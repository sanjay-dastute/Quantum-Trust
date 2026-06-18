'use client';
import { Box, Typography, Button, Paper, CircularProgress, Checkbox, FormControlLabel, Chip, LinearProgress, Tabs, Tab, TextField } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';

export default function UserFileManagerPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [data, setData] = useState('');
  
  // Array of { originalName, dataId } for uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<{ originalName: string, dataId: string }[]>([]);
  
  // Data analysis state
  const [isStructured, setIsStructured] = useState<boolean>(true);
  const [schema, setSchema] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  // Encryption state
  const [loading, setLoading] = useState(false);
  const [deliveryResults, setDeliveryResults] = useState<any[]>([]);

  // Batch Job State
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<number>(0);

  const uploadToTemp = async (fileOrData: File | string): Promise<{ originalName: string, dataId: string }> => {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    let originalName = 'manual_entry.txt';

    if (typeof fileOrData === 'string') {
      const cleanStr = sanitizeHtml(fileOrData);
      formData.append('fileContent', cleanStr);
    } else {
      originalName = fileOrData.name;
      formData.append('file', fileOrData);
    }

    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) throw new Error('Failed to upload file');
    const { data_id } = await res.json();
    return { originalName, dataId: data_id };
  };

  const processInputData = async (fileOrData?: string) => {
    setLoading(true);
    try {
      if (fileOrData) {
        // Manual Entry path
        const uploaded = await uploadToTemp(fileOrData);
        setUploadedFiles([uploaded]);
        await fetchPreview(uploaded.dataId);
      } else {
        // Assume uploadedFiles is already populated via onDrop
        if (uploadedFiles.length > 0) {
          await fetchPreview(uploadedFiles[0].dataId);
        }
      }
    } catch (e) {
      toast.error('Failed to parse data structure');
    }
    setLoading(false);
  };

  const fetchPreview = async (dataId: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`http://localhost:3000/api/user/view-data?data_id=${dataId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const parsed = await res.json();
      setIsStructured(parsed.isStructured);
      if (parsed.isStructured) {
        setSchema(parsed.schema);
        setPreview(parsed.preview);
        setSelectedFields(parsed.schema); // select all by default
      } else {
        setSchema([]);
        setSelectedFields([]);
      }
    } else {
      throw new Error('Failed to fetch preview');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    try {
      // 4.4 Spec: Upload all files simultaneously, get IDs back
      const results = await Promise.all(acceptedFiles.map(f => uploadToTemp(f)));
      setUploadedFiles(results);
      
      // Preview the first one
      await fetchPreview(results[0].dataId);
    } catch (e) {
      toast.error('Error uploading files');
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxSize: 5 * 1024 * 1024 * 1024 // 5GB
  });

  const toggleField = (field: string) => {
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const executeSingleEncryption = async (dataId: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch('http://localhost:3000/api/user/encrypt', {
      method: 'POST',
      headers: {  
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-api-key': 'qt-valid-api-key',
        'x-org-api-key': 'qt-org-key'
      },
      body: JSON.stringify({
        data_id: dataId,
        fields: selectedFields,
        storage_config: 'default'
      })
    });
    
    if (!res.ok) throw new Error('Encryption failed');
    return res.json();
  };

  const handleEncrypt = async () => {
    if (uploadedFiles.length === 0) return toast.error('No data to encrypt');
    setLoading(true);
    
    try {
      const results = await Promise.all(uploadedFiles.map(f => executeSingleEncryption(f.dataId)));
      setDeliveryResults(results);
      toast.success('Data encrypted and delivered successfully!');
    } catch (e) {
      toast.error('Network or encryption error occurred');
    }
    
    setLoading(false);
  };

  const handleBatchEncrypt = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/batch/encrypt', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'x-api-key': 'qt-valid-api-key',
          'x-org-api-key': 'qt-org-key'
        },
        body: JSON.stringify({ datasetUri: 's3://mock-bucket/dataset.csv' })
      });
      if (res.ok) {
        const json = await res.json();
        setBatchJobId(json.jobId);
        setBatchProgress(0);
        toast.success('Batch Job queued in Kafka!');
      } else {
        toast.error('Batch submission failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    let interval: any;
    if (batchJobId && batchProgress < 100) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`http://localhost:3000/api/batch/status/${batchJobId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const resultData = await res.json();
            setBatchProgress(resultData.progress);
            if (resultData.progress >= 100) {
              clearInterval(interval);
              toast.success('Apache Spark batch encryption completed!');
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [batchJobId, batchProgress]);

  const reset = () => {
    setData('');
    setUploadedFiles([]);
    setSchema([]);
    setPreview([]);
    setSelectedFields([]);
    setDeliveryResults([]);
    setBatchJobId(null);
    setBatchProgress(0);
  };

  // Convert schema to DataGrid columns
  const columns: GridColDef[] = schema.map(f => ({ field: f, headerName: f, width: 150, flex: 1 }));
  const rows = preview.map((row, i) => ({ id: i, ...row }));

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Post-Quantum Encryption Engine</Typography>
      
      {uploadedFiles.length === 0 && (
        <Box sx={{ mb: 4 }}>
          <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} sx={{ mb: 3 }}>
            <Tab label="File Upload (Drag & Drop)" />
            <Tab label="Manual Entry (Text/JSON)" />
          </Tabs>
          
          {tabIndex === 0 && (
            <Paper {...getRootProps()} sx={{ p: 6, textAlign: 'center', bgcolor: isDragActive ? 'primary.light' : 'background.default', border: '2px dashed', borderColor: 'primary.main', cursor: 'pointer' }}>
              <input {...getInputProps()} />
              {loading ? <CircularProgress /> : <Typography>Drag & drop up to 5GB files (CSV, JSON, PDF, Images) here. Multi-file uploads supported!</Typography>}
            </Paper>
          )}

          {tabIndex === 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Enter Raw Data (JSON, SQL, text payload)</Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                placeholder="Paste raw string, JSON payload, or SQL here..."
                onChange={(e) => setData(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button variant="contained" onClick={() => processInputData(data)} disabled={!data || loading}>
                {loading ? <CircularProgress size={24} /> : 'Analyze Data'}
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {uploadedFiles.length > 0 && deliveryResults.length === 0 && !batchJobId && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">{isStructured ? 'Select Fields to Encrypt' : 'Unstructured Data Detected'}</Typography>
            <Button color="error" onClick={reset}>Cancel</Button>
          </Box>
          
          {isStructured ? (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                {schema.map(field => (
                  <FormControlLabel
                    key={field}
                    control={<Checkbox checked={selectedFields.includes(field)} onChange={() => toggleField(field)} />}
                    label={field}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 2 }}>Interactive Data Preview (Max 500 rows)</Typography>
              <Box sx={{ height: 400, width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSizeOptions={[10, 50, 100, 500]}
                  initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
                  disableRowSelectionOnClick
                />
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, mb: 4, textAlign: 'center', bgcolor: '#1E293B' }}>
              <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                The uploaded file or text is not structured JSON/CSV. The entire payload will be encrypted as a raw binary/text blob.
              </Typography>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleEncrypt} disabled={loading} size="large" fullWidth>
              {loading ? <CircularProgress size={24} color="inherit" /> : `Encrypt ${uploadedFiles.length > 1 ? uploadedFiles.length + ' Files' : 'Payload'} & Deliver`}
            </Button>
            <Button variant="contained" color="secondary" onClick={handleBatchEncrypt} disabled={loading} size="large" fullWidth>
              Simulate Batch Spark Job (TB-Scale)
            </Button>
          </Box>
        </Box>
      )}

      {batchJobId && (
        <Paper sx={{ mt: 4, p: 4, bgcolor: '#1E293B', color: '#fff', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Apache Spark Batch Encryption</Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', mb: 4 }}>Processing massive dataset asynchronously via Kafka Queues.</Typography>
          
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress variant="determinate" value={batchProgress} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
          <Typography variant="h6" sx={{ color: batchProgress === 100 ? '#10B981' : '#38BDF8', mb: 4 }}>
            {batchProgress}% Completed
          </Typography>

          {batchProgress === 100 && (
             <Button variant="outlined" onClick={reset}>Process Another Dataset</Button>
          )}
        </Paper>
      )}

      {deliveryResults.length > 0 && (
        <Box sx={{ mt: 4 }}>
          {deliveryResults.map((result, idx) => (
            <Paper key={idx} sx={{ p: 4, mb: 3, bgcolor: '#1E293B', color: '#10B981', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Job {idx + 1} Successful</Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                <Chip label={`Key Version: ${result.key_version}`} color="primary" />
                <Chip label={`Fabric Signature: ${result.signature?.slice(0, 16) || 'N/A'}...`} color="secondary" />
              </Box>
              
              <Paper sx={{ p: 2, bgcolor: '#0F172A', color: '#38BDF8', mb: 4 }}>
                <Typography variant="subtitle2">Destination URI</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{result.storage_path}</Typography>
              </Paper>
            </Paper>
          ))}
          <Button variant="outlined" onClick={reset} fullWidth>Encrypt Another Batch</Button>
        </Box>
      )}
    </Box>
  );
}
