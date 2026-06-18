'use client';

import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
      else toast.error('Failed to load dashboard stats');
    } catch (e) {
      toast.error('Backend Offline: Showing Simulated Data');
      setStats({
        totalUsers: 1450,
        totalKeys: 8520,
        pendingApprovals: 14,
        activeBreachAlerts: 0,
        encryptionEventsTimeline: [
          { date: 'Mon', count: 120 }, { date: 'Tue', count: 250 }, { date: 'Wed', count: 180 },
          { date: 'Thu', count: 300 }, { date: 'Fri', count: 280 }, { date: 'Sat', count: 150 }, { date: 'Sun', count: 90 }
        ]
      });
    }
  };

  if (!stats) return <Box sx={{ p: 4 }}><Typography>Loading...</Typography></Box>;

  const chartData = {
    labels: stats.encryptionEventsTimeline.map((t: any) => t.date),
    datasets: [
      {
        label: 'Daily Encryption Events',
        data: stats.encryptionEventsTimeline.map((t: any) => t.count),
        backgroundColor: '#3461FF',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>System Overview</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Active Users</Typography>
              <Typography variant="h4">{stats.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Keys</Typography>
              <Typography variant="h4">{stats.totalKeys}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Pending Approvals</Typography>
              <Typography variant="h4">{stats.pendingApprovals}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card sx={{ bgcolor: stats.activeBreachAlerts > 0 ? 'error.light' : 'background.paper' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Active Breach Alerts</Typography>
              <Typography variant="h4" color={stats.activeBreachAlerts > 0 ? 'error.main' : 'text.primary'}>
                {stats.activeBreachAlerts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ height: 400, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Encryption Volumes (30 Days)</Typography>
        <Box sx={{ height: 320 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>
      </Card>
    </Box>
  );
}
