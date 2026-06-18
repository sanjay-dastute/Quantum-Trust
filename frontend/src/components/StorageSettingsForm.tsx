import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Chip, Stack } from '@mui/material';
import { toast } from 'react-toastify';
import { getOrgIdFromToken } from '@/utils/jwt';

export function StorageSettingsForm() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [type, setType] = useState('AWS S3');
  const [credentials, setCredentials] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      if (!orgId) return;
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/storage-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (field: string, value: string) => {
    setCredentials((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/storage-test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, credentials: { ...credentials, _type: type } })
      });
      if (res.ok) {
        toast.success(`Successfully connected to ${type}`);
      } else {
        toast.error(`Connection failed for ${type}`);
      }
    } catch (e) {
      toast.error('Network error during test ping');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      
      const payload = {
        type,
        active: true,
        credentials: { ...credentials, _type: type }
      };

      const res = await fetch(`http://localhost:3000/api/org/${orgId}/storage-config`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('Storage configuration saved and set to active');
        setCredentials({});
        fetchConfigs();
      } else {
        const err = await res.json();
        toast.error(`Error saving config: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      toast.error('Network error during save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Storage Destinations</Typography>
      
      {configs.length > 0 && (
        <Stack spacing={2} sx={{ mb: 4 }}>
          {configs.map((c, i) => (
            <Paper key={c.id || i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{c.type}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.credentials?.bucket_name || c.credentials?.server_name || c.credentials?.account_name || c.credentials?.endpoint_url || 'Unknown Destination'}
                </Typography>
              </Box>
              {c.active ? <Chip label="Active" color="success" size="small" /> : <Chip label="Inactive" size="small" />}
            </Paper>
          ))}
        </Stack>
      )}

      {configs.length >= 3 ? (
        <Typography color="error">Maximum of 3 storage destinations configured.</Typography>
      ) : (
        <Paper sx={{ p: 4, maxWidth: 600 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Add New Destination</Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Storage Type</InputLabel>
            <Select value={type} onChange={(e) => { setType(e.target.value); setCredentials({}); }} label="Storage Type">
              <MenuItem value="AWS S3">AWS S3</MenuItem>
              <MenuItem value="Azure Data Lake">Azure Data Lake</MenuItem>
              <MenuItem value="SQL Database">SQL Database</MenuItem>
              <MenuItem value="NoSQL Database">NoSQL Database</MenuItem>
              <MenuItem value="On-Premises Instance">On-Premises Instance</MenuItem>
              <MenuItem value="Custom Endpoint">Custom Endpoint</MenuItem>
            </Select>
          </FormControl>

          {type === 'AWS S3' && (
            <>
              <TextField fullWidth label="S3 Bucket Name" sx={{ mb: 2 }} onChange={(e) => handleChange('bucket_name', e.target.value)} />
              <TextField fullWidth label="AWS Access Key ID" sx={{ mb: 2 }} onChange={(e) => handleChange('access_key_id', e.target.value)} />
              <TextField fullWidth label="AWS Secret Key" type="password" sx={{ mb: 2 }} onChange={(e) => handleChange('secret_access_key', e.target.value)} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>AWS Region</InputLabel>
                <Select value={credentials.region || ''} onChange={(e) => handleChange('region', e.target.value)} label="AWS Region">
                  <MenuItem value="us-east-1">us-east-1</MenuItem>
                  <MenuItem value="eu-west-1">eu-west-1</MenuItem>
                  <MenuItem value="ap-south-1">ap-south-1</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {type === 'Azure Data Lake' && (
            <>
              <TextField fullWidth label="Storage Account Name" sx={{ mb: 2 }} onChange={(e) => handleChange('account_name', e.target.value)} />
              <TextField fullWidth label="Account Access Key" type="password" sx={{ mb: 2 }} onChange={(e) => handleChange('account_key', e.target.value)} />
              <TextField fullWidth label="Container/File System Name" sx={{ mb: 2 }} onChange={(e) => handleChange('container_name', e.target.value)} />
              <TextField fullWidth label="Connection String (Optional)" sx={{ mb: 2 }} onChange={(e) => handleChange('connection_string', e.target.value)} />
            </>
          )}

          {type === 'SQL Database' && (
            <>
              <TextField fullWidth label="Server Hostname/IP" sx={{ mb: 2 }} onChange={(e) => handleChange('server_name', e.target.value)} />
              <TextField fullWidth label="Database Name" sx={{ mb: 2 }} onChange={(e) => handleChange('database_name', e.target.value)} />
              <TextField fullWidth label="Username" sx={{ mb: 2 }} onChange={(e) => handleChange('username', e.target.value)} />
              <TextField fullWidth label="Password" type="password" sx={{ mb: 2 }} onChange={(e) => handleChange('password', e.target.value)} />
              <TextField fullWidth label="Port" type="number" sx={{ mb: 2 }} onChange={(e) => handleChange('port', e.target.value)} />
              <TextField fullWidth label="Auth Token (Optional)" sx={{ mb: 2 }} onChange={(e) => handleChange('auth_token', e.target.value)} />
            </>
          )}

          {type === 'NoSQL Database' && (
            <>
              <TextField fullWidth label="Server Hostname/IP" sx={{ mb: 2 }} onChange={(e) => handleChange('server_name', e.target.value)} />
              <TextField fullWidth label="Database Name" sx={{ mb: 2 }} onChange={(e) => handleChange('database_name', e.target.value)} />
              <TextField fullWidth label="Collection/Table Name" sx={{ mb: 2 }} onChange={(e) => handleChange('collection_name', e.target.value)} />
              <TextField fullWidth label="Connection URI" sx={{ mb: 2 }} onChange={(e) => handleChange('connection_string', e.target.value)} />
              <TextField fullWidth label="Secret Key (Optional)" type="password" sx={{ mb: 2 }} onChange={(e) => handleChange('secret_key', e.target.value)} />
            </>
          )}

          {type === 'On-Premises Instance' && (
            <>
              <TextField fullWidth label="Server IP/Hostname" sx={{ mb: 2 }} onChange={(e) => handleChange('server_name', e.target.value)} />
              <TextField fullWidth label="Port" type="number" sx={{ mb: 2 }} onChange={(e) => handleChange('port', e.target.value)} />
              <TextField fullWidth label="Server Username" sx={{ mb: 2 }} onChange={(e) => handleChange('username', e.target.value)} />
              <TextField fullWidth label="Server Password" type="password" sx={{ mb: 2 }} onChange={(e) => handleChange('password', e.target.value)} />
              <TextField fullWidth label="Destination Path (e.g., /data)" sx={{ mb: 2 }} onChange={(e) => handleChange('path', e.target.value)} />
              <TextField fullWidth label="REST Auth Token (Optional)" sx={{ mb: 2 }} onChange={(e) => handleChange('auth_token', e.target.value)} />
            </>
          )}

          {type === 'Custom Endpoint' && (
            <>
              <TextField fullWidth label="Full API URL" sx={{ mb: 2 }} onChange={(e) => handleChange('endpoint_url', e.target.value)} />
              <TextField fullWidth label="Bearer Token / API Key" sx={{ mb: 2 }} onChange={(e) => handleChange('auth_token', e.target.value)} />
              <TextField fullWidth label="HMAC Secret Key (Optional)" type="password" sx={{ mb: 2 }} onChange={(e) => handleChange('secret_key', e.target.value)} />
            </>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
