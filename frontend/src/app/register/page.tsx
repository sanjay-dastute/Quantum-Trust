'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      setErrorMsg('');
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8F9FB' }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2, border: '1px solid #E2E8F0', elevation: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center', color: 'primary.main' }}>
          <SecurityIcon sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>QuantumTrust</Typography>
        </Box>
        
        <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>Create an Account</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Enter your details to securely register.
        </Typography>

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Registration successful! Redirecting...</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Username"
            margin="normal"
            {...register('username', { required: 'Username is required' })}
            error={!!errors.username}
            helperText={errors.username?.message as string}
          />
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            margin="normal"
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
            })}
            error={!!errors.email}
            helperText={errors.email?.message as string}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register('password', { 
              required: 'Password is required',
              pattern: { 
                value: /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, 
                message: 'Must contain uppercase, lowercase, and number/special char' 
              },
              minLength: { value: 8, message: 'Must be at least 8 characters' }
            })}
            error={!!errors.password}
            helperText={errors.password?.message as string}
          />
          <TextField
            fullWidth
            label="Organization Name (Optional)"
            margin="normal"
            {...register('organizationName')}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, bgcolor: '#3461FF', textTransform: 'none', fontWeight: 'bold' }}
          >
            Register
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account? <Button variant="text" size="small" onClick={() => router.push('/login')}>Log in</Button>
          </Typography>
        </form>
      </Paper>
    </Box>
  );
}
