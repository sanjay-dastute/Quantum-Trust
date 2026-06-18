'use client';

import { Box } from '@mui/material';
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 8, // Offset for the fixed header
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
