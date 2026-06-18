'use client';

import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LockIcon from '@mui/icons-material/Lock';
import PaymentsIcon from '@mui/icons-material/Payments';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import CircleIcon from '@mui/icons-material/Circle';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

const DRAWER_WIDTH = 280;

const getNavigation = (role?: string) => {
  if (role === 'admin') {
    return [
      { text: 'Admin Overview', icon: <DashboardIcon />, path: '/admin/dashboard' },
      { text: 'User Management', icon: <VerifiedUserIcon />, path: '/admin/users' },
      { text: 'Global Audit Logs', icon: <HistoryIcon />, path: '/admin/logs' },
    ];
  } else if (role === 'org_admin') {
    return [
      { text: 'Org Overview', icon: <DashboardIcon />, path: '/org-admin/dashboard' },
      { text: 'Team Users', icon: <VerifiedUserIcon />, path: '/org-admin/users' },
      { text: 'HSM Clusters', icon: <LockIcon />, path: '/org-admin/hsm-clusters' },
    ];
  } else {
    // org_user
    return [
      { text: 'My Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'My Keys', icon: <LockIcon />, path: '/keys' },
      { text: 'My Activity', icon: <HistoryIcon />, path: '/activity' },
    ];
  }
};

const NAVIGATION = [
  { text: 'Overview', icon: <DashboardIcon />, path: '/' },
  { text: 'HSM Clusters', icon: <LockIcon />, path: '/hsm-clusters' },
  { text: 'Revenue', icon: <PaymentsIcon />, path: '/revenue' },
  { text: 'Compliance', icon: <VerifiedUserIcon />, path: '/compliance' },
  { text: 'Audit Logs', icon: <HistoryIcon />, path: '/audit-logs' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppContext();
  
  const NAVIGATION = getNavigation(user?.role);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: DRAWER_WIDTH, 
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          bgcolor: 'primary.light', 
          color: 'primary.main', 
          p: 0.5, 
          borderRadius: 1, 
          display: 'flex' 
        }}>
          <SecurityIcon fontSize="small" />
        </Box>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold' }}>
          QuantumTrust
        </Typography>
      </Box>

      <Box sx={{ px: 3, py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
          MAIN MENU
        </Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {NAVIGATION.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  borderRadius: '8px',
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  borderLeft: isActive ? '4px solid' : '4px solid transparent',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.light' : '#F1F5F9',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={<Box component="span" sx={{ fontWeight: isActive ? 600 : 500 }}>{item.text}</Box>} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          bgcolor: 'background.default', 
          p: 2, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider' 
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Infrastructure Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircleIcon sx={{ color: 'success.main', fontSize: 10 }} />
            <Typography variant="caption" color="text.secondary">
              All systems operational
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'block',
              textAlign: 'center',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              py: 0.5,
              typography: 'caption',
              fontWeight: 'bold',
              color: 'text.primary',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'primary.light', color: 'primary.main' }
            }}
          >
            View Status Page
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
