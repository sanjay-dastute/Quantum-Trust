'use client';

import { Box, Typography, Button, TextField, MenuItem } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ user: '', breach_flag: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const query = new URLSearchParams({ ...filters, page: '1', limit: '50' } as any).toString();
      const res = await fetch(`http://localhost:3000/api/admin/logs?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
      } else {
        generateMockData();
      }
    } catch (e) {
      toast.error('Backend offline: Showing simulated data');
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mockLogs = Array.from({ length: 25 }, (_, i) => ({
      log_id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      username: i % 3 === 0 ? 'john_doe' : 'jane_smith',
      action: i % 5 === 0 ? 'LOGIN_FAILED' : 'FILE_ENCRYPTED',
      ip_address: `192.168.1.${i % 255}`,
      mac_address: '00:1A:2B:3C:4D:5E',
      breach_flag: i % 7 === 0
    }));
    setLogs(mockLogs);
  };

  const handleExport = () => {
    const token = localStorage.getItem('accessToken');
    const query = new URLSearchParams(filters as any).toString();
    window.open(`http://localhost:3000/api/admin/logs/export?token=${token}&${query}`, '_blank');
  };

  const columns: GridColDef[] = [
    { 
      field: 'timestamp', 
      headerName: 'Timestamp', 
      width: 200,
      valueGetter: (value, row) => new Date(row.timestamp).toLocaleString()
    },
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 150 },
    { field: 'action', headerName: 'Action', flex: 1, minWidth: 150 },
    { 
      field: 'ip_address', 
      headerName: 'IP / MAC', 
      flex: 1,
      minWidth: 180,
      valueGetter: (value, row) => `${row.ip_address} / ${row.mac_address}`
    },
    { 
      field: 'breach_flag', 
      headerName: 'Breach Alert', 
      width: 130,
      renderCell: (params) => (
        <Box sx={{ 
          bgcolor: params.value ? 'error.light' : 'success.light', 
          color: params.value ? 'error.contrastText' : 'success.contrastText',
          px: 1.5, py: 0.5, borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold' 
        }}>
          {params.value ? 'YES' : 'NO'}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
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

      <Box sx={{ flexGrow: 1, minHeight: 400, width: '100%' }}>
        <DataGrid
          rows={logs}
          columns={columns}
          getRowId={(row) => row.log_id}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 15 } },
          }}
          pageSizeOptions={[15, 50, 100]}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>
    </Box>
  );
}
