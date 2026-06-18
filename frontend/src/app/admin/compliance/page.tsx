'use client';
import { Box, Typography, Button, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function CompliancePage() {
  const [profile, setProfile] = useState('GDPR');

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/compliance', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-${profile}.pdf`;
        a.click();
        toast.success('Report generated successfully');
      } else {
        toast.error('Report generation failed');
      }
    } catch (e) {
      toast.error('Network error during report generation');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Compliance Reports</Typography>
      <Paper sx={{ p: 4, maxWidth: 500 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Regulatory Profile</InputLabel>
          <Select value={profile} onChange={(e) => setProfile(e.target.value)} label="Regulatory Profile">
            <MenuItem value="GDPR">GDPR</MenuItem>
            <MenuItem value="HIPAA">HIPAA</MenuItem>
            <MenuItem value="SAMA">SAMA</MenuItem>
            <MenuItem value="PDPA">PDPA</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={generateReport} fullWidth>Generate PDF Report</Button>
      </Paper>
    </Box>
  );
}
