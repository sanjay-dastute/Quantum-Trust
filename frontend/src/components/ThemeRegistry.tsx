'use client';

import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ReactNode, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const { themeMode } = useAppContext();

  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#3461FF',
        light: themeMode === 'dark' ? '#1E3A8A' : '#EEF2FF',
      },
      secondary: {
        main: '#64748B',
      },
      success: {
        main: '#10B981',
        light: themeMode === 'dark' ? '#064E3B' : '#D1FAE5',
      },
      error: {
        main: '#EF4444',
        light: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2',
      },
      warning: {
        main: '#F59E0B',
        light: themeMode === 'dark' ? '#78350F' : '#FEF3C7',
      },
      background: {
        default: themeMode === 'dark' ? '#0F172A' : '#F8F9FB',
        paper: themeMode === 'dark' ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: themeMode === 'dark' ? '#F8FAFC' : '#1E293B',
        secondary: themeMode === 'dark' ? '#94A3B8' : '#64748B',
      },
      divider: themeMode === 'dark' ? '#334155' : '#E2E8F0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h3: {
        fontWeight: 700,
        color: themeMode === 'dark' ? '#F8FAFC' : '#1E293B',
      },
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 600,
      },
      body2: {
        color: themeMode === 'dark' ? '#94A3B8' : '#64748B',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: themeMode === 'dark' ? 'none' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: `1px solid ${themeMode === 'dark' ? '#334155' : '#E2E8F0'}`,
            backgroundImage: 'none', // Remove default dark mode elevation gradient
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          }
        }
      }
    },
  }), [themeMode]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
