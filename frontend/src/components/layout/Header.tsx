'use client';

import { Box, AppBar, Toolbar, IconButton, InputBase, Avatar, Menu, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import SettingsDrawer from './SettingsDrawer';

const DRAWER_WIDTH = 280;

export default function Header() {
  const { user, logout } = useAppContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.default',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              px: 2,
              py: 0.5,
              width: '400px',
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search resources..."
              sx={{ flex: 1, fontSize: '0.875rem', color: 'text.primary' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
              <NotificationsNoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </IconButton>
            <IconButton 
              sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </IconButton>
            
            <Avatar 
              src="https://mui.com/static/images/avatar/2.jpg" 
              sx={{ width: 36, height: 36, ml: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }} 
              onClick={handleMenu}
            />
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>{user?.username || 'Guest'}</MenuItem>
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
