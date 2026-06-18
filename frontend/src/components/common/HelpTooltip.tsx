'use client';

import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppContext } from '@/context/AppContext';

interface HelpTooltipProps {
  id: string;
  content: string;
  children?: React.ReactNode;
}

export default function HelpTooltip({ id, content, children }: HelpTooltipProps) {
  const { themeMode } = useAppContext();

  return (
    <>
      <Box 
        data-tooltip-id={id} 
        data-tooltip-content={content}
        sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      >
        {children || <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />}
      </Box>
      <ReactTooltip 
        id={id} 
        place="top"
        style={{
          backgroundColor: themeMode === 'dark' ? '#334155' : '#1E293B',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          zIndex: 9999,
        }}
      />
    </>
  );
}
