'use client';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer } from '@mui/material';
import { useEffect, useState } from 'react';
import { getOrgIdFromToken } from '@/utils/jwt';

export default function OrgLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      if (!orgId) return;
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
      }
    } catch (e) {}
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Data Audit Logs</Typography>

      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.log_id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.username}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.ip_address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
