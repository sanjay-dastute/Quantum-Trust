'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMsg, setErrorMsg] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      setErrorMsg('');
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Login failed');
      }

      if (responseData.mfa_required) {
        setMfaRequired(true);
        setErrorMsg('MFA code required.');
        return;
      }

      // Store token (in a real app, use Context/Cookies securely, we'll use localStorage for demo)
      localStorage.setItem('accessToken', responseData.accessToken);
      router.push('/');
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
        
        <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>Welcome Back</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Please enter your credentials to access the platform.
        </Typography>

        {errorMsg && <Alert severity={mfaRequired ? "info" : "error"} sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Username or Email"
            margin="normal"
            {...register('usernameOrEmail', { required: 'Username/Email is required' })}
            error={!!errors.usernameOrEmail}
            helperText={errors.usernameOrEmail?.message as string}
            disabled={mfaRequired}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register('password', { required: 'Password is required' })}
            error={!!errors.password}
            helperText={errors.password?.message as string}
            disabled={mfaRequired}
          />

          {mfaRequired && (
            <TextField
              fullWidth
              label="6-Digit TOTP Code"
              margin="normal"
              {...register('totp', { required: 'TOTP Code is required', minLength: 6, maxLength: 6 })}
              error={!!errors.totp}
              helperText={errors.totp?.message as string}
              autoFocus
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, bgcolor: '#3461FF', textTransform: 'none', fontWeight: 'bold' }}
          >
            {mfaRequired ? 'Verify MFA' : 'Log In'}
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Don't have an account? <Button variant="text" size="small" onClick={() => router.push('/register')}>Register</Button>
          </Typography>
        </form>
      </Paper>
    </Box>
  );
}
