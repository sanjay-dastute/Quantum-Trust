'use client';
import { Box, Typography, Button, Paper, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useState } from 'react';

export default function ApiTestPage() {
  const [endpoint, setEndpoint] = useState('/api/admin/stats');
  const [method, setMethod] = useState('GET');
  const [response, setResponse] = useState('');

  const sendRequest = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResponse(e.toString());
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>API Integration Tester</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Method</InputLabel>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} label="Method">
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth label="Endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
        <Button variant="contained" onClick={sendRequest}>Send</Button>
      </Box>

      <Paper sx={{ p: 3, bgcolor: '#1E293B', color: '#F8FAFC', minHeight: 300 }}>
        <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 2 }}>Response Output</Typography>
        <pre>{response}</pre>
      </Paper>
    </Box>
  );
}
