'use client';

import { Box, Typography, Grid, Card, CardContent, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHealth(await res.json());
        setError(false);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    }
  };

  if (!health) return <Box sx={{ p: 4 }}><Typography>Loading Grafana Panel...</Typography></Box>;

  const cpuAlert = health.cpuUsagePercent > 85;
  const memAlert = health.memUsagePercent > 90;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>System Health (Grafana View)</Typography>

      {(cpuAlert || memAlert) && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Security Alert: Critical resource threshold exceeded! 
          {cpuAlert && ` CPU: ${health.cpuUsagePercent.toFixed(1)}% `}
          {memAlert && ` Memory: ${health.memUsagePercent.toFixed(1)}% `}
        </Alert>
      )}

      {error && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Warning: Could not connect to telemetry server.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card sx={{ bgcolor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: '#94A3B8' }}>CPU Usage</Typography>
              <Typography variant="h3" sx={{ color: cpuAlert ? '#EF4444' : '#10B981', mt: 2 }}>
                {health.cpuUsagePercent.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card sx={{ bgcolor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: '#94A3B8' }}>Memory Usage</Typography>
              <Typography variant="h3" sx={{ color: memAlert ? '#EF4444' : '#10B981', mt: 2 }}>
                {health.memUsagePercent.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', md: '33.333%' } }}>
          <Card sx={{ bgcolor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: '#94A3B8' }}>Server Uptime</Typography>
              <Typography variant="h5" sx={{ mt: 2, color: '#F8FAFC' }}>
                {(health.uptime / 3600).toFixed(2)} hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', md: '33.333%' } }}>
          <Card sx={{ bgcolor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: '#94A3B8' }}>Kafka Message Lag</Typography>
              <Typography variant="h5" sx={{ mt: 2, color: '#F8FAFC' }}>
                {health.kafkaLag} ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', md: '33.333%' } }}>
          <Card sx={{ bgcolor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: '#94A3B8' }}>Fabric Node Status</Typography>
              <Typography variant="h5" sx={{ mt: 2, color: '#10B981' }}>
                {health.fabricNodeStatus}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
