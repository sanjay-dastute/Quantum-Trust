'use client';

import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ user: '', breach_flag: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const query = new URLSearchParams({ ...filters, page: page.toString(), limit: '50' } as any).toString();
      const res = await fetch(`http://localhost:3000/api/admin/logs?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
      }
    } catch (e) {}
  };

  const handleExport = () => {
    const token = localStorage.getItem('accessToken');
    const query = new URLSearchParams(filters as any).toString();
    window.open(`http://localhost:3000/api/admin/logs/export?token=${token}&${query}`, '_blank');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Audit Logs</Typography>
        <Button variant="contained" onClick={handleExport}>Export CSV</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField size="small" label="Search User" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} />
        <TextField size="small" select label="Breach Flag" value={filters.breach_flag} onChange={(e) => setFilters({ ...filters, breach_flag: e.target.value })} sx={{ minWidth: 120 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Flagged</MenuItem>
          <MenuItem value="false">Normal</MenuItem>
        </TextField>
        <TextField size="small" type="date" label="Start Date" slotProps={{ inputLabel: { shrink: true } }} value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <TextField size="small" type="date" label="End Date" slotProps={{ inputLabel: { shrink: true } }} value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
      </Box>

      <Box sx={{ overflowX: 'auto', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>IP / MAC</TableCell>
              <TableCell>Breach</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.log_id} sx={{ bgcolor: log.breach_flag ? 'error.light' : 'transparent' }}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.username}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.ip_address} / {log.mac_address}</TableCell>
                <TableCell>{log.breach_flag ? 'YES' : 'NO'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous Page</Button>
        <Typography sx={{ alignSelf: 'center' }}>Page {page}</Typography>
        <Button onClick={() => setPage(p => p + 1)}>Next Page</Button>
      </Box>
    </Box>
  );
}
