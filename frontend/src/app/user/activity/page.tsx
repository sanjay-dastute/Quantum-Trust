'use client';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { getUserIdFromToken } from '@/utils/jwt';

export default function UserActivityTrackerPage() {
  const [activity, setActivity] = useState([]);

  useEffect(() => { fetchActivity(); }, []);

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userId = getUserIdFromToken();
      if (!userId) return;
      const res = await fetch(`http://localhost:3000/api/user/${userId}/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setActivity(await res.json());
    } catch (e) {}
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>My Activity Timeline</Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        {activity.length === 0 ? (
          <Typography color="text.secondary">No recent activity found.</Typography>
        ) : (
          <List>
            {activity.map((day: any, idx) => (
              <Box key={day._id}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>{day._id}</Typography>
                {day.actions.map((act: any, i: number) => (
                  <ListItem key={i} disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={act.action} 
                      secondary={new Date(act.time).toLocaleTimeString()} 
                    />
                  </ListItem>
                ))}
                {idx < activity.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
