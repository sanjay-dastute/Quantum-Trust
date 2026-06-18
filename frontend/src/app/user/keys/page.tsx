'use client';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import HelpTooltip from '@/components/common/HelpTooltip';
import { getUserIdFromToken } from '@/utils/jwt';

export default function UserKeysPage() {
  const [keys, setKeys] = useState([]);
  const [mfaModal, setMfaModal] = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userId = getUserIdFromToken();
      if (!userId) return;
      const res = await fetch(`http://localhost:3000/api/user/${userId}/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setKeys(await res.json());
    } catch (e) {}
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>My Encryption Keys</Typography>
      
      <Paper sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key ID</TableCell>
              <TableCell>Algorithm</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {keys.map((k: any) => (
              <TableRow key={k.id}>
                <TableCell>{k.id}</TableCell>
                <TableCell>{k.type}</TableCell>
                <TableCell>{k.status}</TableCell>
                <TableCell>{new Date(k.created).toLocaleString()}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setMfaModal(true)}>
                    <HelpTooltip id={`tip-${k.id}`} content="Requires fresh TOTP to view raw key material">View</HelpTooltip>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={mfaModal} onClose={() => setMfaModal(false)}>
        <DialogTitle>MFA Required</DialogTitle>
        <DialogContent>
           <Typography variant="body2" sx={{ mb: 2 }}>Please enter your TOTP to view your personal raw key.</Typography>
           <TextField fullWidth type="password" label="TOTP" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMfaModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setMfaModal(false); toast.success('Key viewing simulated.'); }}>Verify</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
