'use client';

import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function OrganisationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchOrgs(); }, []);

  const fetchOrgs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/admin/organisations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOrgs(await res.json());
    } catch (e) {
      toast.error('Failed to load organisations');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Organisation Profiles</Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>+ Add Organisation</Button>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Org ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Compliance Mode</TableCell>
              <TableCell>Storage Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgs.map((org: any) => (
              <TableRow key={org.organisation_id} hover>
                <TableCell>{org.organisation_id}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{org.name}</TableCell>
                <TableCell>{org.settings?.compliance_template || 'GDPR'}</TableCell>
                <TableCell>{org.settings?.storage_type || 'AWS S3'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
