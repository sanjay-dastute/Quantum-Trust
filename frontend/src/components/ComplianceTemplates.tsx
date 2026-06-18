import { Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { Shield, Security, MedicalServices, AccountBalance, Gavel, Warning } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getOrgIdFromToken } from '@/utils/jwt';

const TEMPLATES = [
  {
    id: 'GDPR',
    title: 'GDPR',
    description: 'General Data Protection Regulation (EU). Auto-encrypts PII and enforces 365-day log retention.',
    icon: <Security color="primary" fontSize="large" />,
    fields: ['name', 'email', 'DOB', 'address', 'IP']
  },
  {
    id: 'HIPAA',
    title: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act. Auto-encrypts PHI and enforces MFA.',
    icon: <MedicalServices color="error" fontSize="large" />,
    fields: ['patient_id', 'diagnosis', 'SSN', 'DOB', 'medical_record']
  },
  {
    id: 'SAMA',
    title: 'SAMA',
    description: 'Saudi Central Bank. Enforces data localisation (On-Premises) and financial PII encryption.',
    icon: <AccountBalance color="success" fontSize="large" />,
    fields: ['account_no', 'transaction_data', 'IBAN']
  },
  {
    id: 'PDPA',
    title: 'PDPA',
    description: 'Thailand Personal Data Protection Act. Consent-based data minimisation, 3-year log retention.',
    icon: <Gavel color="warning" fontSize="large" />,
    fields: ['national_ID', 'financial_info']
  }
];

export const ComplianceTemplates = () => {
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveProfile();
  }, []);

  const fetchActiveProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgId = getOrgIdFromToken();
      if (!orgId) return;
      const res = await fetch(`http://localhost:3000/api/org/${orgId}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Since we exposed settings, we need a way to get profile. 
        // We'll hit a new generic GET endpoint or just fetch the profile if the API returns it.
        // Wait, the settings endpoint usually doesn't return profile. 
        // Let's assume the API returns the profile or we fetch /api/org/:id/profile
      }
      
      const profileRes = await fetch(`http://localhost:3000/api/org/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
         const pData = await profileRes.json();
         if (pData && pData.profile && pData.profile.active_profile) {
            setActiveProfile(pData.profile.active_profile);
         }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmApply = (profileName: string) => {
    setConfirmDialog(profileName);
  };

  const applyProfile = async () => {
    if (!confirmDialog) return;
    const profileName = confirmDialog;
    setConfirmDialog(null);

    try {
      setLoadingProfile(profileName);
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch(`http://localhost:3000/api/compliance/settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile_name: profileName })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${profileName} Profile Enforced Successfully`);
        setActiveProfile(profileName);
      } else {
        toast.error(`Failed to apply profile: ${data.message || 'Unknown error'}`);
      }
    } catch (e) {
      toast.error('Network error applying compliance profile');
    } finally {
      setLoadingProfile(null);
    }
  };

  const removeProfile = async () => {
     setConfirmDialog('NONE');
  };

  const getProfileSettingsSummary = (profileId: string) => {
    if (profileId === 'NONE') return "This will remove all auto-enforced settings. Manual configuration will take over.";
    const t = TEMPLATES.find(x => x.id === profileId);
    if (!t) return "";
    return `Warning: This will forcefully override your manual settings. The following fields will be permanently auto-encrypted on all uploads: ${t.fields.join(', ')}. Log retention and breach notification settings will be automatically enforced.`;
  };

  return (
    <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(10, 15, 25, 0.6)', backdropFilter: 'blur(10px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Shield sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Regulatory Compliance Templates</Typography>
      </Box>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Automate encryption fields, log retention, and MFA requirements with a single click. Warning: applying a profile overrides manual settings.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {TEMPLATES.map((tmpl) => {
          const isActive = activeProfile === tmpl.id;
          return (
            <Box key={tmpl.id} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                background: isActive ? 'rgba(0, 163, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: isActive ? '1px solid rgba(0, 163, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    {tmpl.icon}
                    {isActive && <Chip label="ACTIVE" color="primary" size="small" />}
                  </Box>
                  <Typography variant="h6" gutterBottom>{tmpl.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{tmpl.description}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {tmpl.fields.map(f => (
                      <Chip key={f} label={f} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }} />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant={isActive ? "contained" : "outlined"} 
                    color={isActive ? "success" : "primary"}
                    fullWidth
                    onClick={() => isActive ? removeProfile() : confirmApply(tmpl.id)}
                    disabled={loadingProfile !== null && loadingProfile !== tmpl.id}
                  >
                    {loadingProfile === tmpl.id ? <CircularProgress size={24} /> : isActive ? 'Enforced (Click to Remove)' : 'Enforce Profile'}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          );
        })}
      </Box>

      <Dialog open={confirmDialog !== null} onClose={() => setConfirmDialog(null)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Warning color="warning" sx={{ mr: 1 }} />
          {confirmDialog === 'NONE' ? 'Remove Compliance Profile' : `Enforce ${confirmDialog} Profile`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog && getProfileSettingsSummary(confirmDialog)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={applyProfile} variant="contained" color={confirmDialog === 'NONE' ? 'error' : 'primary'}>
            Confirm & Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
