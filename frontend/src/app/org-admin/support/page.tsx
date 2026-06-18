'use client';
import { Box, Typography, Paper, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function SupportTicketsPage() {
  const [ticket, setTicket] = useState({ subject: '', message: '' });
  const [tickets, setTickets] = useState<any[]>([]);

  const handleSubmit = async () => {
    if (!ticket.subject || !ticket.message) return toast.error('Fill all fields');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/org/support', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });
      if (res.ok) {
        const newTicket = await res.json();
        setTickets([newTicket, ...tickets]);
        setTicket({ subject: '', message: '' });
        toast.success('Support ticket submitted successfully');
      }
    } catch (e) {
      toast.error('Submission failed');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Help & Support</Typography>

      <Paper sx={{ p: 4, mb: 4, maxWidth: 600 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Submit New Ticket</Typography>
        <TextField fullWidth label="Subject" value={ticket.subject} onChange={(e) => setTicket({...ticket, subject: e.target.value})} sx={{ mb: 3 }} />
        <TextField fullWidth label="Message" multiline rows={4} value={ticket.message} onChange={(e) => setTicket({...ticket, message: e.target.value})} sx={{ mb: 3 }} />
        <Button variant="contained" onClick={handleSubmit}>Submit Ticket</Button>
      </Paper>

      <Paper sx={{ border: '1px solid', borderColor: 'divider', elevation: 0 }}>
        <Table>
          <TableHead><TableRow><TableCell>Ticket ID</TableCell><TableCell>Subject</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
          <TableBody>
            {tickets.map((t: any) => (
              <TableRow key={t.id}><TableCell>{t.id.slice(0,8)}</TableCell><TableCell>{t.subject}</TableCell><TableCell>{t.status}</TableCell><TableCell>{new Date(t.date).toLocaleString()}</TableCell></TableRow>
            ))}
            {tickets.length === 0 && <TableRow><TableCell colSpan={4} align="center">No tickets submitted yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
