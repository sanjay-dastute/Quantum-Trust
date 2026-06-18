'use client';
import { Box, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getUserIdFromToken } from '@/utils/jwt';

export default function UserSettingsPage() {
  const [settings, setSettings] = useState({ theme: 'dark', language: 'en', field_preferences: [] });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userId = getUserIdFromToken();
      if (!userId) return;
      const res = await fetch(`http://localhost:3000/api/user/${userId}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSettings(await res.json());
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userId = getUserIdFromToken();
      const res = await fetch(`http://localhost:3000/api/user/${userId}/settings`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) toast.success('Personal settings updated');
      else toast.error('Failed to update settings');
    } catch (e) {
      toast.error('Network error');
    }
  };

  const fields = ['Email', 'Phone', 'Credit Card', 'SSN', 'Address'];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Personal Settings</Typography>

      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Default Fields to Encrypt</InputLabel>
          <Select
            multiple
            value={settings.field_preferences || []}
            onChange={(e) => setSettings({ ...settings, field_preferences: typeof e.target.value === 'string' ? e.target.value.split(',') as never[] : e.target.value as never[] })}
            input={<OutlinedInput label="Default Fields to Encrypt" />}
            renderValue={(selected: any) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value: string) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {fields.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" color="primary" onClick={handleSave} fullWidth>Save Profile Options</Button>
      </Paper>
    </Box>
  );
}
