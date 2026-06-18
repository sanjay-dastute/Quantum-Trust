'use client';

import { Box, Typography, Button, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DnsIcon from '@mui/icons-material/Dns';
import TimerIcon from '@mui/icons-material/Timer';
import PublicIcon from '@mui/icons-material/Public';

import KpiCard from '@/components/dashboard/KpiCard';
import TrendChart from '@/components/dashboard/TrendChart';
import ActivityTable from '@/components/dashboard/ActivityTable';

export default function Home() {
  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Global infrastructure & revenue oversight for QuantumTrust Enterprise.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<CalendarMonthIcon />}
            sx={{ bgcolor: '#FFFFFF', borderColor: '#E2E8F0', color: 'text.primary', '&:hover': { bgcolor: '#F8F9FB' } }}
          >
            Last 30 Days
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<FileDownloadIcon />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <KpiCard 
            title="Global MRR"
            value="$4,210,800"
            trend="+12.5%"
            isPositive={true}
            icon={<AttachMoneyIcon fontSize="small" />}
            iconBgColor="primary.light"
            iconColor="primary.main"
            borderColor="primary.main"
          />
        </Box>
        <Box>
          <KpiCard 
            title="Active HSM Clusters"
            value="128"
            trend="+4%"
            isPositive={true}
            icon={<DnsIcon fontSize="small" />}
            iconBgColor="#EDE9FE" // light purple
            iconColor="#8B5CF6" // purple
            borderColor="#8B5CF6"
          />
        </Box>
        <Box>
          <KpiCard 
            title="System Uptime"
            value="99.99%"
            trend="-0.01%"
            isPositive={false}
            icon={<TimerIcon fontSize="small" />}
            iconBgColor="success.light"
            iconColor="success.main"
            borderColor="success.main"
          />
        </Box>
      </Box>

      {/* Charts & Regions Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
        <Box>
          <TrendChart />
        </Box>
        <Box>
          <Paper sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 2, height: '100%', elevation: 0 }}>
            <Typography variant="h6" gutterBottom>
              Regional Distribution
            </Typography>
            <List sx={{ mb: 2 }}>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 24 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3461FF' }} /></ListItemIcon>
                <ListItemText primary={<Box component="span" sx={{ fontSize: '0.875rem' }}>North America</Box>} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>42%</Typography>
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 24 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#8B5CF6' }} /></ListItemIcon>
                <ListItemText primary={<Box component="span" sx={{ fontSize: '0.875rem' }}>Europe (EMEA)</Box>} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>31%</Typography>
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 24 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00D4FF' }} /></ListItemIcon>
                <ListItemText primary={<Box component="span" sx={{ fontSize: '0.875rem' }}>Asia Pacific</Box>} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>19%</Typography>
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 24 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#E2E8F0' }} /></ListItemIcon>
                <ListItemText primary={<Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Rest of World</Box>} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>8%</Typography>
              </ListItem>
            </List>
            <Box sx={{ 
              height: 120, 
              bgcolor: '#F8F9FB', 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#CBD5E1'
            }}>
              <PublicIcon sx={{ fontSize: 64 }} />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Activity Table Row */}
      <ActivityTable />
    </Box>
  );
}
