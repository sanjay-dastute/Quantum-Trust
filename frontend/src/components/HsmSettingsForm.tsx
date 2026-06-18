import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { getOrgIdFromToken } from '@/utils/jwt';

export const HsmSettingsForm = () => {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState('Thales Luna HSM');
  const [libraryPath, setLibraryPath] = useState('');
  const [slotId, setSlotId] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [label, setLabel] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/hsm/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: true, provider, library_path: libraryPath, slot_id: slotId, pin, ip, port, label })
      });
      const data = await res.json();
      if (res.ok) toast.success('HSM Ping Successful');
      else toast.error(data.message || 'HSM Ping Failed');
    } catch (e) {
      toast.error('Network Error pinging HSM');
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/hsm/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled, provider, library_path: libraryPath, slot_id: slotId, pin, ip, port, label })
      });
      if (res.ok) toast.success('HSM Configuration Saved');
      else toast.error('Failed to save HSM configuration');
    } catch (e) {
      toast.error('Network error saving HSM configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, mt: 4, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Hardware Security Module (HSM) Integration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Offload cryptographic operations physically to PKCS#11 compliant devices.
      </Typography>

      <FormControlLabel
        control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} color="primary" />}
        label="Enable HSM Offloading"
        sx={{ mb: 3 }}
      />

      {enabled && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>HSM Provider</InputLabel>
            <Select value={provider} label="HSM Provider" onChange={(e) => setProvider(e.target.value as string)}>
              <MenuItem value="Thales Luna HSM">Thales Luna HSM</MenuItem>
              <MenuItem value="YubiHSM 2">YubiHSM 2</MenuItem>
              <MenuItem value="AWS CloudHSM">AWS CloudHSM (PKCS#11)</MenuItem>
              <MenuItem value="Generic PKCS#11">Generic PKCS#11</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="HSM IP (Network Attached)" value={ip} onChange={(e) => setIp(e.target.value)} fullWidth />
            <TextField label="HSM Port" value={port} onChange={(e) => setPort(e.target.value)} fullWidth />
          </Box>

          <TextField 
            label="PKCS#11 Library Path (e.g. /usr/lib/libcryptoki.so)" 
            value={libraryPath} 
            onChange={(e) => setLibraryPath(e.target.value)} 
            fullWidth 
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Slot ID" value={slotId} onChange={(e) => setSlotId(e.target.value)} fullWidth />
            <TextField label="HSM Label (Partition)" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
          </Box>
          
          <TextField 
            label="Crypto Officer PIN" 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            fullWidth 
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="outlined" color="primary" onClick={testConnection}>
              Test Connection
            </Button>
            <Button variant="contained" color="primary" onClick={saveConfig} disabled={loading}>
              Save HSM Configuration
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};
