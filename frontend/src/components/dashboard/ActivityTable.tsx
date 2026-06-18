'use client';

import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';

const DATA = [
  { id: 'HSM-US-EAST-01', location: 'Virginia, USA', status: 'Active', throughput: '12.4k req/s', created: '2h ago' },
  { id: 'HSM-EU-WEST-04', location: 'Frankfurt, GER', status: 'Active', throughput: '8.1k req/s', created: '5h ago' },
  { id: 'HSM-AP-SO-02', location: 'Singapore', status: 'Scaling', throughput: '15.9k req/s', created: '12h ago' },
  { id: 'HSM-US-WEST-09', location: 'Oregon, USA', status: 'Standby', throughput: '0 req/s', created: '1d ago' },
];

export default function ActivityTable() {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return { bg: 'success.light', color: 'success.main' };
      case 'Scaling': return { bg: 'warning.light', color: 'warning.main' };
      case 'Standby': return { bg: '#F1F5F9', color: 'text.secondary' };
      default: return { bg: '#F1F5F9', color: 'text.secondary' };
    }
  };

  return (
    <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
        <Typography variant="h6">Recent Cluster Activity</Typography>
        <Typography variant="body2" color="primary.main" sx={{ cursor: 'pointer', fontWeight: 600 }}>
          View All Clusters
        </Typography>
      </Box>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F8F9FB' }}>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>CLUSTER ID</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>LOCATION</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>STATUS</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>THROUGHPUT</TableCell>
            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>CREATED</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {DATA.map((row) => {
            const statusStyle = getStatusColor(row.status);
            return (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 500, borderBottom: '1px solid #E2E8F0' }}>{row.id}</TableCell>
                <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid #E2E8F0' }}>{row.location}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                  <Chip 
                    label={row.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: statusStyle.bg, 
                      color: statusStyle.color, 
                      fontWeight: 600,
                      borderRadius: 1,
                      height: 24,
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>{row.throughput}</TableCell>
                <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid #E2E8F0' }}>{row.created}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
