'use client';
import { Box, Typography, Button, Paper, TextField, Card, CardContent, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import ApiTestInterface from '@/components/ApiTestInterface';

export default function ApiIntegrationPage() {
  const [apiKey, setApiKey] = useState('');
  const [orgApiKey, setOrgApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [orgId, setOrgId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      setOrgId(decoded.organisation_id);
      fetchKeys(decoded.organisation_id, token);
    }
  }, []);

  const fetchKeys = async (id: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/org/${id}/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const keys = await res.json();
        if (keys && keys.length > 0) {
          setHasExistingKey(true);
          setApiKey(keys[0].id); // Masked key from backend
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateKey = async (isRegen = false) => {
    if (!orgApiKey) {
      return toast.error('Please provide an Organisation API Key');
    }
    if (isRegen && !totpCode) {
      return toast.error('TOTP code is required for regeneration');
    }

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/api-key`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_api_key: orgApiKey,
          totp_code: isRegen ? totpCode : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
        setHasExistingKey(true);
        setIsRegenerating(false);
        setTotpCode('');
        toast.success('API Key generated successfully! Please copy it now, it will not be shown again.');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to generate key');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const copyToClipboard = () => {
    if (!apiKey.includes('****')) {
      navigator.clipboard.writeText(apiKey);
      toast.info('API Key copied to clipboard!');
    } else {
      toast.error('Cannot copy a masked key. Please regenerate if lost.');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>API Integration</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your Dual-Authentication keys for programmatic data intake.
      </Typography>

      <Card sx={{ 
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
        borderRadius: 3,
        background: 'linear-gradient(145deg, #ffffff, #f8f9fc)',
        border: '1px solid #e2e8f0'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1e293b' }}>
            {hasExistingKey ? 'Active API Credentials' : 'Create API Credentials'}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {!hasExistingKey && (
            <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
              To establish a secure integration, provide your system's Organisation API Key. We will generate the secondary QuantumTrust API Key.
            </Typography>
          )}

          <TextField 
            fullWidth 
            label="Organisation API Key (Provided by you)" 
            value={orgApiKey} 
            onChange={(e) => setOrgApiKey(e.target.value)}
            placeholder="e.g., my-internal-system-key-123"
            sx={{ mb: 3 }}
            disabled={!!(hasExistingKey && !isRegenerating && (!apiKey || !apiKey.includes('****')))}
          />

          <Box sx={{ position: 'relative' }}>
            <TextField 
              fullWidth 
              label="QuantumTrust API Key" 
              value={apiKey} 
              slotProps={{ htmlInput: { readOnly: true } }} 
              sx={{ mb: 4 }}
              color={apiKey && !apiKey.includes('****') ? 'success' : 'primary'}
              focused={Boolean(apiKey && !apiKey.includes('****'))}
            />
            {apiKey && !apiKey.includes('****') && (
              <Button 
                variant="text" 
                onClick={copyToClipboard}
                sx={{ position: 'absolute', right: 8, top: 10, fontWeight: 'bold' }}
              >
                COPY
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {!hasExistingKey ? (
              <Button 
                variant="contained" 
                size="large"
                sx={{ background: 'linear-gradient(90deg, #3b82f6, #2563eb)', px: 4 }}
                onClick={() => generateKey(false)}
              >
                Generate Keys
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => setIsRegenerating(true)}
              >
                Regenerate Credentials
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Regeneration TOTP Dialog */}
      <Dialog open={isRegenerating} onClose={() => setIsRegenerating(false)}>
        <DialogTitle>Regenerate API Keys</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, mt: 1 }}>
            Warning: Regenerating your API keys will immediately revoke the current keys. Any active integrations using the old keys will fail.
          </Typography>
          <TextField
            fullWidth
            label="New Organisation API Key"
            value={orgApiKey}
            onChange={(e) => setOrgApiKey(e.target.value)}
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            label="Enter TOTP Code from Authenticator App"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsRegenerating(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => generateKey(true)}
          >
            Confirm & Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      <ApiTestInterface apiKey={apiKey && !apiKey.includes('****') ? apiKey : ''} orgApiKey={orgApiKey} />
    </Box>
  );
}
