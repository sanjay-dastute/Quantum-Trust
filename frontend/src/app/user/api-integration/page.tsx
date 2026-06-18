'use client';
import { Box, Typography, Paper } from '@mui/material';

export default function UserApiIntegrationPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>API Integration</Typography>

      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <Typography sx={{ mb: 2, color: 'text.secondary' }}>
          Personal API access is restricted by your Organisation Administrator. If you require programmatic access to QuantumTrust services, please submit a Support Ticket.
        </Typography>
      </Paper>
    </Box>
  );
}
