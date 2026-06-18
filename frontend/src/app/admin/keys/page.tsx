'use client';

import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import HelpTooltip from '@/components/common/HelpTooltip';

export default function KeyManagerPage() {
  const [keys] = useState([
    { id: 'k-101', user: 'admin_sarah', type: 'AES-256-GCM', expires: '2027-01-01', version: 1 },
    { id: 'k-102', user: 'jdoe', type: 'RSA-4096', expires: '2026-12-31', version: 3 },
  ]);

  const [mfaModal, setMfaModal] = useState(false);
  const [password, setPassword] = useState('');
  const [actionType, setActionType] = useState('');

  const triggerAction = (action: string) => {
    setActionType(action);
    setMfaModal(true);
  };

  const confirmMfa = async () => {
    // Requires actual MFA confirmation
    setMfaModal(false);
    toast.success(`Key ${actionType} successful after MFA verification!`);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Global Key Manager</Typography>
      
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Algorithm</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {keys.map(k => (
              <TableRow key={k.id}>
                <TableCell>{k.id}</TableCell>
                <TableCell>{k.user}</TableCell>
                <TableCell>{k.type}</TableCell>
                <TableCell>v{k.version}</TableCell>
                <TableCell>{k.expires}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => triggerAction('View')}>
                    <HelpTooltip id={`tip-${k.id}`} content="Requires fresh TOTP to view raw key material">View</HelpTooltip>
                  </Button>
                  <Button size="small" color="warning" onClick={() => triggerAction('Rotate')}>Rotate</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={mfaModal} onClose={() => setMfaModal(false)}>
        <DialogTitle>MFA Required for {actionType}</DialogTitle>
        <DialogContent>
           <Typography variant="body2" sx={{ mb: 2 }}>This is a highly sensitive action. Please enter your password or TOTP to proceed.</Typography>
           <TextField fullWidth type="password" label="Password or TOTP" onChange={(e) => setPassword(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMfaModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmMfa}>Verify & Execute</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
