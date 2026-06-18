'use client';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getOrgIdFromToken } from '@/utils/jwt';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrgDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      if (!orgId) return;
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      toast.error('Backend Offline: Showing Simulated Data');
      setStats({
        totalMembers: 45,
        encryptedFiles: 1240,
        activeKeys: 85,
        breachAlerts: 0,
        storageDistribution: [
          { name: 'AWS S3', value: 450 }, { name: 'Azure Blob', value: 320 }, { name: 'On-Premises', value: 150 }
        ],
        fieldDistribution: [
          { name: 'PII', value: 500 }, { name: 'Financial', value: 200 }, { name: 'Healthcare', value: 120 }
        ]
      });
    }
  };

  if (!stats) return <Box sx={{ p: 4 }}><Typography>Loading...</Typography></Box>;

  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const } } };

  const storageData = {
    labels: stats.storageDistribution.map((d: any) => d.name),
    datasets: [{ data: stats.storageDistribution.map((d: any) => d.value), backgroundColor: ['#3461FF', '#10B981', '#F59E0B'] }]
  };

  const fieldData = {
    labels: stats.fieldDistribution.map((d: any) => d.name),
    datasets: [{ data: stats.fieldDistribution.map((d: any) => d.value), backgroundColor: ['#8B5CF6', '#EF4444', '#06B6D4'] }]
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Organisation Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card><CardContent><Typography color="text.secondary">Total Members</Typography><Typography variant="h4">{stats.totalMembers}</Typography></CardContent></Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card><CardContent><Typography color="text.secondary">Encrypted Files</Typography><Typography variant="h4">{stats.encryptedFiles}</Typography></CardContent></Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card><CardContent><Typography color="text.secondary">Active Keys</Typography><Typography variant="h4">{stats.activeKeys}</Typography></CardContent></Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
          <Card sx={{ bgcolor: stats.breachAlerts > 0 ? 'error.light' : 'background.paper' }}><CardContent><Typography color="text.secondary">Breach Alerts</Typography><Typography variant="h4" color={stats.breachAlerts > 0 ? 'error.main' : 'text.primary'}>{stats.breachAlerts}</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card sx={{ height: 350, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Storage Distribution</Typography>
            <Box sx={{ height: 280 }}><Pie data={storageData} options={pieOptions} /></Box>
          </Card>
        </Grid>
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card sx={{ height: 350, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Field Type Distribution</Typography>
            <Box sx={{ height: 280 }}><Pie data={fieldData} options={pieOptions} /></Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
