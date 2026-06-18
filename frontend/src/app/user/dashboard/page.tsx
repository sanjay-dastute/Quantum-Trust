'use client';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getUserIdFromToken } from '@/utils/jwt';

export default function UserDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userId = getUserIdFromToken();
      if (!userId) return;
      const res = await fetch(`http://localhost:3000/api/user/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      toast.error('Backend Offline: Showing Simulated Data');
      setStats({
        filesEncrypted: 42,
        activeKeys: 5,
        lastEncryptionTime: new Date().toISOString()
      });
    }
  };

  if (!stats) return <Box sx={{ p: 4 }}><Typography>Loading Dashboard...</Typography></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>My Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Files Encrypted</Typography>
              <Typography variant="h4">{stats.filesEncrypted}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Active Keys</Typography>
              <Typography variant="h4">{stats.activeKeys}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', md: '33.33%' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Last Encryption</Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {new Date(stats.lastEncryptionTime).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
