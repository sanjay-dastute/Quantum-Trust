'use client';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function OrgUsersPage() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (e) { }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Team Management</Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>+ Invite User</Button>
      </Box>

      <Paper sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>MFA Status</TableCell>
              <TableCell>IP / MAC Pending Approval</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.user_id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                <TableCell><Chip label={user.role} size="small" /></TableCell>
                <TableCell>
                  <Chip label={user.mfa_enabled ? 'Enabled' : 'Disabled'} size="small" color={user.mfa_enabled ? 'success' : 'error'} variant="outlined" />
                </TableCell>
                <TableCell>{user.approved_addresses?.length === 0 ? <Button size="small" color="warning">Pending Approval</Button> : 'Approved'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent><TextField fullWidth label="Email" margin="dense" /></DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setModalOpen(false); toast.success('Invite sent.'); }}>Send Invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
