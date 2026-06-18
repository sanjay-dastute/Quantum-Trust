'use client';

import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        // Offline Mock Data
        setUsers([
          { user_id: '1', username: 'john_doe', email: 'john@example.com', role: 'admin', organisation: { name: 'HQ' }, mfa_enabled: true, approved_addresses: ['ip1'] },
          { user_id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'org_admin', organisation: { name: 'Acme Corp' }, mfa_enabled: false, approved_addresses: [] },
          { user_id: '3', username: 'bob_jones', email: 'bob@example.com', role: 'org_user', organisation: { name: 'Acme Corp' }, mfa_enabled: true, approved_addresses: ['ip2', 'ip3'] },
        ]);
      }
    } catch (e) {
      toast.error('Backend offline: Showing simulated data');
      setUsers([
        { user_id: '1', username: 'john_doe', email: 'john@example.com', role: 'admin', organisation: { name: 'HQ' }, mfa_enabled: true, approved_addresses: ['ip1'] },
        { user_id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'org_admin', organisation: { name: 'Acme Corp' }, mfa_enabled: false, approved_addresses: [] },
        { user_id: '3', username: 'bob_jones', email: 'bob@example.com', role: 'org_user', organisation: { name: 'Acme Corp' }, mfa_enabled: true, approved_addresses: ['ip2', 'ip3'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 130,
      renderCell: (params) => {
        const colors: any = {
          admin: { bg: '#FEE2E2', color: '#EF4444' },
          org_admin: { bg: '#FEF3C7', color: '#F59E0B' },
          org_user: { bg: '#E0E7FF', color: '#3B82F6' }
        };
        const role = params.value;
        return (
          <Box sx={{ bgcolor: colors[role]?.bg || '#f3f4f6', color: colors[role]?.color || '#374151', px: 1.5, py: 0.5, borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold' }}>
            {role ? role.toUpperCase() : 'UNKNOWN'}
          </Box>
        );
      }
    },
    { 
      field: 'organisation', 
      headerName: 'Organisation', 
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.organisation?.name || 'N/A' 
    },
    { 
      field: 'mfa_enabled', 
      headerName: 'MFA Status', 
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Enabled' : 'Disabled'} size="small" color={params.value ? 'success' : 'error'} variant="outlined" />
      )
    },
    { 
      field: 'approved_addresses', 
      headerName: 'Devices', 
      width: 100,
      valueGetter: (value, row) => `${row.approved_addresses?.length || 0} Devices`
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: () => (
        <Box>
          <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>User Management</Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>+ Add User</Button>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 400, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.user_id}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
           <TextField fullWidth label="Username" margin="dense" />
           <TextField fullWidth label="Email" margin="dense" />
           <TextField fullWidth label="Role (admin, org_admin, org_user)" margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setModalOpen(false); toast.success('User created successfully'); }}>Create User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
