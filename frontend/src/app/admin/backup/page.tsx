'use client';
import { Box, Typography, Button, Paper } from '@mui/material';
import { toast } from 'react-toastify';

export default function BackupPage() {
  const triggerBackup = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Backup successful! SHA-256 Checksum: ${data.checksum}`);
      } else {
        toast.error('Backup failed');
      }
    } catch (e) {
      toast.error('Backup network error');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Database Backup Manager</Typography>
      <Paper sx={{ p: 4 }}>
        <Typography sx={{ mb: 2 }}>Manually trigger a secure database dump. The file will be hashed with SHA-256 to ensure integrity.</Typography>
        <Button variant="contained" color="primary" onClick={triggerBackup}>Trigger Full Backup</Button>
      </Paper>
    </Box>
  );
}
