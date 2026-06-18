'use client';

import { Box, Card, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  borderColor: string;
}

export default function KpiCard({ title, value, trend, isPositive, icon, iconBgColor, iconColor, borderColor }: KpiCardProps) {
  return (
    <Card sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ 
          bgcolor: iconBgColor, 
          color: iconColor,
          width: 36, 
          height: 36, 
          borderRadius: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {icon}
        </Box>
        <Box sx={{ 
          bgcolor: isPositive ? 'success.light' : 'error.light', 
          color: isPositive ? 'success.main' : 'error.main',
          px: 1, 
          py: 0.25, 
          borderRadius: 1, 
          typography: 'caption', 
          fontWeight: 'bold' 
        }}>
          {trend}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, bgcolor: '#F1F5F9' }}>
        <Box sx={{ width: '60%', height: '100%', bgcolor: borderColor }} />
      </Box>
    </Card>
  );
}
