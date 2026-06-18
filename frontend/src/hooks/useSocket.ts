import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

export const useSocket = (orgId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize WebSocket connection
    const socketInstance = io('http://localhost:3000');

    socketInstance.on('connect', () => {
      console.log('Connected to real-time telemetry stream');
    });

    socketInstance.on('global_dashboard_update', () => {
      // Invalidate queries so the UI seamlessly updates without refreshing
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['orgStats'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    });

    if (orgId) {
      socketInstance.on(`breach_alert_${orgId}`, (data) => {
        toast.error(`CRITICAL BREACH DETECTED: ${data.message}`, {
          autoClose: false,
          position: "top-center"
        });
        queryClient.invalidateQueries();
      });
    }

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [orgId, queryClient]);

  return socket;
};
