'use client';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getOrgIdFromToken } from '@/utils/jwt';
import { StorageSettingsForm } from '@/components/StorageSettingsForm';
import { ComplianceTemplates } from '@/components/ComplianceTemplates';
import { HsmSettingsForm } from '@/components/HsmSettingsForm';

export default function OrgSettingsPage() {
  const [settings, setSettings] = useState({ default_algorithm: '', key_timer_interval: 3600, storage_destination: '' });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      if (!orgId) return;
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSettings(await res.json());
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/settings`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) toast.success('Encryption settings updated successfully');
      else toast.error('Failed to update settings');
    } catch (e) {
      toast.error('Network error');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Global Encryption Settings</Typography>

      {/* Hardware Security Module Integration */}
      <HsmSettingsForm />

      <Paper sx={{ p: 4, mb: 4, maxWidth: 600 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Default Algorithm</InputLabel>
          <Select 
            value={settings.default_algorithm || 'AES-256-GCM'} 
            onChange={(e) => setSettings({ ...settings, default_algorithm: e.target.value })} 
            label="Default Algorithm"
          >
            <MenuItem value="AES-256-GCM">AES-256-GCM (Recommended)</MenuItem>
            <MenuItem value="ChaCha20-Poly1305">ChaCha20-Poly1305</MenuItem>
            <MenuItem value="RSA-4096">RSA-4096</MenuItem>
          </Select>
        </FormControl>

        <TextField 
          fullWidth 
          label="Key Rotation Interval (seconds)" 
          type="number" 
          value={settings.key_timer_interval} 
          onChange={(e) => setSettings({ ...settings, key_timer_interval: Number(e.target.value) })} 
          sx={{ mb: 3 }}
        />

        <Button variant="contained" color="primary" onClick={handleSave} fullWidth>Save Configuration</Button>
      </Paper>

      {/* 2. COMPLIANCE TEMPLATES */}
      <ComplianceTemplates />

      {/* 3. STORAGE SETTINGS FORM */}
      <StorageSettingsForm />
    </Box>
  );
}
