'use client';

import { Box, Drawer, Typography, Divider, Switch, FormControl, Select, MenuItem, InputLabel, Button, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { themeMode, toggleTheme, language, setLanguage, user } = useAppContext();
  const [showMfaPrompt, setShowMfaPrompt] = useState(false);
  const [password, setPassword] = useState('');
  
  // Real user object might have mfa_enabled. Default to false if not loaded.
  const isMfaEnabled = user?.mfa_enabled || false;

  const handleMfaToggle = () => {
    // Show password confirmation before calling endpoints
    setShowMfaPrompt(true);
  };

  const confirmMfaAction = async () => {
    try {
      const endpoint = isMfaEnabled ? '/api/mfa/disable' : '/api/mfa/setup';
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        throw new Error('Password verification failed');
      }

      const data = await res.json();
      
      if (!isMfaEnabled) {
        // Show QR code for setup in real app. For now we just toast success.
        toast.success('MFA Setup Initiated! Scan the QR code.');
      } else {
        toast.success('MFA Disabled successfully');
      }

      setShowMfaPrompt(false);
      setPassword('');
      
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: 320, p: 3, bgcolor: '#0f172a' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Application Settings</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Theme Preference</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="body2">Dark Mode</Typography>
          <Switch checked={themeMode === 'dark'} onChange={toggleTheme} color="primary" />
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Language</Typography>
        <FormControl fullWidth size="small">
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Security</Typography>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Two-Factor Authentication (MFA)</Typography>
            <Switch checked={isMfaEnabled} onChange={handleMfaToggle} color="primary" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Protect your account by requiring a TOTP code during login.
          </Typography>

          {showMfaPrompt && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Enter password to confirm:</Typography>
              <TextField 
                size="small" 
                type="password" 
                fullWidth 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button variant="contained" size="small" fullWidth onClick={confirmMfaAction}>
                Confirm Action
              </Button>
            </Box>
          )}
        </Box>
      </Box>

    </Drawer>
  );
}
