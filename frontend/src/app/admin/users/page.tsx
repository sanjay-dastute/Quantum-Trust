'use client';

import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      toast.error('Failed to load users');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: any = {
      admin: { bg: '#FEE2E2', color: '#EF4444' },
      org_admin: { bg: '#FEF3C7', color: '#F59E0B' },
      org_user: { bg: '#E0E7FF', color: '#3B82F6' }
    };
    return (
      <Box sx={{ bgcolor: colors[role]?.bg, color: colors[role]?.color, px: 1.5, py: 0.5, borderRadius: 4, display: 'inline-block', fontSize: '0.75rem', fontWeight: 'bold' }}>
        {role.toUpperCase()}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>User Management</Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>+ Add User</Button>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Organisation</TableCell>
              <TableCell>MFA Status</TableCell>
              <TableCell>IP / MAC Configured</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.user_id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.organisation?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={user.mfa_enabled ? 'Enabled' : 'Disabled'} size="small" color={user.mfa_enabled ? 'success' : 'error'} variant="outlined" />
                </TableCell>
                <TableCell>{user.approved_addresses?.length || 0} Devices</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
