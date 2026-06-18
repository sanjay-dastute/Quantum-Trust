'use client';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function OrgProfilePage() {
  const [profile, setProfile] = useState({ name: '', contact_email: '', billing_address: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/org/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setProfile(await res.json());
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/org/profile`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) toast.success('Profile updated successfully');
    } catch (e) {
      toast.error('Network error');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Organisation Profile</Typography>

      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <TextField 
          fullWidth 
          label="Organisation Name" 
          value={profile.name || ''} 
          onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
          sx={{ mb: 3 }}
        />
        <TextField 
          fullWidth 
          label="Contact Email" 
          value={profile.contact_email || ''} 
          onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })} 
          sx={{ mb: 3 }}
        />
        <TextField 
          fullWidth 
          label="Billing Address" 
          multiline
          rows={3}
          value={profile.billing_address || ''} 
          onChange={(e) => setProfile({ ...profile, billing_address: e.target.value })} 
          sx={{ mb: 4 }}
        />

        <Button variant="contained" color="primary" onClick={handleSave} fullWidth>Update Profile</Button>
      </Paper>
    </Box>
  );
}
