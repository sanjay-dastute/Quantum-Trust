'use client';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/admin/alerts?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.data);
      }
    } catch (e) {}
  };

  const handleResolve = (id: string) => {
    toast.success('Alert resolved!');
    setAlerts(alerts.filter((a: any) => a.log_id !== id));
  };

  const chartData = {
    labels: alerts.slice(0, 10).map((a: any) => new Date(a.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Recent Breaches',
        data: alerts.slice(0, 10).map((_, i) => i + 1), // Trend data
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      }
    ],
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Security Alerts</Typography>

      <Paper sx={{ p: 3, mb: 4, height: 300 }}>
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      </Paper>

      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>IP / MAC</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert: any) => (
              <TableRow key={alert.log_id} sx={{ bgcolor: 'error.light' }}>
                <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                <TableCell>{alert.action}</TableCell>
                <TableCell>{alert.ip_address} / {alert.mac_address}</TableCell>
                <TableCell>
                  <Button size="small" variant="contained" color="success" onClick={() => handleResolve(alert.log_id)}>Resolve</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
