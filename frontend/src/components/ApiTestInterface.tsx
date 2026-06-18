'use client';
import { Box, Typography, Button, Paper, TextField, Card, CardContent, Divider, MenuItem, Tabs, Tab } from '@mui/material';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

interface ApiTestInterfaceProps {
  apiKey: string;
  orgApiKey: string;
}

export default function ApiTestInterface({ apiKey, orgApiKey }: ApiTestInterfaceProps) {
  const [endpoint, setEndpoint] = useState('/api/encrypt');
  const [method, setMethod] = useState('POST');
  const [body, setBody] = useState('{\n  "data": "[]",\n  "fields": []\n}');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [endpoints, setEndpoints] = useState<{path: string; method: string; body: string}[]>([]);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const decoded: any = jwtDecode(token);
        const orgId = decoded.organisation_id;

        const res = await fetch(`http://localhost:3000/api/org/${orgId}/api-test`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.endpoints) {
            setEndpoints(data.endpoints);
            if (data.endpoints.length > 0) {
              setEndpoint(data.endpoints[0].path);
              setMethod(data.endpoints[0].method);
              setBody(data.endpoints[0].body);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load dynamic api test configuration');
      }
    };
    fetchEndpoints();
  }, []);

  useEffect(() => {
    const selected = endpoints.find(e => e.path === endpoint);
    if (selected) {
      setMethod(selected.method);
      if (selected.body) setBody(selected.body);
    }
  }, [endpoint]);

  const sendRequest = async () => {
    setIsLoading(true);
    setResponse(null);

    let parsedBody;
    if (method !== 'GET') {
      try {
        parsedBody = body ? JSON.parse(body) : undefined;
      } catch (e) {
        toast.error('Invalid JSON body');
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3000/api/org/api-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint,
          method,
          headers: {
            'X-API-Key': apiKey,
            'X-Org-API-Key': orgApiKey,
            'Content-Type': 'application/json'
          },
          body: parsedBody
        })
      });

      const data = await res.json();
      setResponse(data);
    } catch (e) {
      toast.error('Failed to execute proxy request');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurlSnippet = () => {
    return `curl -X ${method} http://localhost:3000${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'your_quantum_trust_api_key'}" \\
  -H "X-Org-API-Key: ${orgApiKey || 'your_organisation_api_key'}"${method !== 'GET' ? ` \\
  -d '${body.replace(/\n/g, '')}'` : ''}`;
  };

  const getPythonSnippet = () => {
    return `import requests

url = "http://localhost:3000${endpoint}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey || 'your_quantum_trust_api_key'}",
    "X-Org-API-Key": "${orgApiKey || 'your_organisation_api_key'}"
}
${method !== 'GET' ? `payload = ${body}\n\nresponse = requests.${method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.get(url, headers=headers)`}

print(response.status_code)
print(response.json())`;
  };

  const getNodeSnippet = () => {
    return `const axios = require('axios');

const config = {
  method: '${method.toLowerCase()}',
  url: 'http://localhost:3000${endpoint}',
  headers: { 
    'Content-Type': 'application/json', 
    'X-API-Key': '${apiKey || 'your_quantum_trust_api_key'}', 
    'X-Org-API-Key': '${orgApiKey || 'your_organisation_api_key'}'
  }${method !== 'GET' ? `,\n  data: ${body}` : ''}
};

axios(config)
  .then((response) => console.log(response.data))
  .catch((error) => console.error(error));`;
  };

  return (
    <Card sx={{ mt: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 3, border: '1px solid #e2e8f0' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 1, color: '#1e293b' }}>API Test Interface</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Simulate external programmatic requests to the QuantumTrust Dual-Auth endpoints.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            select
            fullWidth
            label="Endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          >
            {endpoints.map((option) => (
              <MenuItem key={option.path} value={option.path}>
                <Typography component="span" sx={{ fontWeight: 'bold', mr: 2, color: option.method === 'GET' ? '#16a34a' : '#2563eb' }}>
                  {option.method}
                </Typography>
                {option.path}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="X-API-Key"
            value={apiKey || 'Not generated yet'}
            disabled
            size="small"
            sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
          <TextField
            fullWidth
            label="X-Org-API-Key"
            value={orgApiKey || 'Not provided yet'}
            disabled
            size="small"
            sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
        </Box>

        {method !== 'GET' && (
          <TextField
            fullWidth
            multiline
            rows={6}
            label="JSON Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            sx={{ mb: 3, '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: '#f8fafc' } }}
          />
        )}

        <Button 
          variant="contained" 
          size="large" 
          onClick={sendRequest} 
          disabled={isLoading}
          sx={{ background: 'linear-gradient(90deg, #10b981, #059669)', px: 4, mb: 4 }}
        >
          {isLoading ? 'Sending...' : 'Send Request'}
        </Button>

        {response && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#475569' }}>
              Response
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#0f172a', color: '#f8fafc', borderRadius: 2, overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 2, borderBottom: '1px solid #334155', pb: 1 }}>
                <Typography variant="body2" sx={{ color: response.status >= 200 && response.status < 300 ? '#4ade80' : '#f87171' }}>
                  Status: {response.status}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Time: {response.timeMs} ms
                </Typography>
              </Box>
              <pre style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#475569' }}>
          Integration Snippets
        </Typography>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="cURL" />
              <Tab label="Python" />
              <Tab label="Node.js" />
            </Tabs>
          </Box>
          <Paper sx={{ p: 2, bgcolor: '#1e293b', color: '#f8fafc', borderRadius: 2, mt: 2, overflowX: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'monospace' }}>
              {activeTab === 0 && getCurlSnippet()}
              {activeTab === 1 && getPythonSnippet()}
              {activeTab === 2 && getNodeSnippet()}
            </pre>
          </Paper>
        </Box>

      </CardContent>
    </Card>
  );
}
