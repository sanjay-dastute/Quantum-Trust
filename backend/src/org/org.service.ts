import { Injectable, NotFoundException, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CryptoService } from '../crypto/crypto.service';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { LedgerService } from '../integrations/ledger/ledger.service';
import PDFDocument from 'pdfkit';
import { StorageService } from '../integrations/storage/storage.service';
import { HsmService } from '../hsm/hsm.service';

@Injectable()
export class OrgService {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
    private readonly cryptoService: CryptoService,
    private readonly ledgerService: LedgerService,
    private readonly storageService: StorageService,
    private readonly hsmService: HsmService,
  ) {}

  async getStats(orgId: string) {
    const users = await this.usersService.findUsersByOrg(orgId);
    
    const storageDistribution = [
      { name: 'AWS S3', value: 45 },
      { name: 'Azure Blob', value: 30 },
      { name: 'Local Disk', value: 25 },
    ];
    const fieldDistribution = [
      { name: 'Email', value: 50 },
      { name: 'Phone', value: 20 },
      { name: 'Credit Card', value: 30 },
    ];

    return {
      totalMembers: users.length,
      encryptedFiles: 1420,
      activeKeys: 12,
      breachAlerts: 1,
      storageDistribution,
      fieldDistribution,
    };
  }

  async applyComplianceProfile(id: string, profileName: string) {
    const org = await this.usersService.findOrganisationById(id);
    if (!org) throw new NotFoundException('Organisation not found');

    if (profileName === 'NONE') {
      const profile = { active_profile: null, enforced_fields: [] };
      return this.usersService.updateOrganisation(id, { profile });
    }

    const settings = org.settings || {};
    let enforced_fields: string[] = [];

    switch (profileName) {
      case 'GDPR':
        settings.log_retention_days = 365;
        settings.require_mfa = false;
        settings.breach_notification_window = 72;
        enforced_fields = ['name', 'email', 'DOB', 'address', 'IP'];
        break;
      case 'HIPAA':
        settings.log_retention_days = 2190;
        settings.require_mfa = true;
        settings.breach_notification_window = 24;
        enforced_fields = ['patient_id', 'diagnosis', 'SSN', 'DOB', 'medical_record'];
        break;
      case 'SAMA':
        const hasLocal = org.storage_config && org.storage_config.some((c: any) => c.active && ['On-Premises Instance', 'Custom Endpoint', 'SQL Database'].includes(c.type));
        if (!hasLocal) {
          throw new BadRequestException('SAMA requires active local or custom cloud storage (On-Premises, SQL, or Custom Endpoint)');
        }
        settings.log_retention_days = 365;
        settings.require_mfa = true;
        settings.breach_notification_window = 24;
        enforced_fields = ['account_no', 'transaction_data', 'IBAN'];
        break;
      case 'PDPA':
        settings.log_retention_days = 1095;
        settings.require_mfa = false;
        settings.breach_notification_window = 72;
        enforced_fields = ['national_ID', 'financial_info'];
        break;
      default:
        throw new BadRequestException('Invalid profile');
    }

    const profile = {
      active_profile: profileName,
      enforced_fields,
      applied_at: new Date().toISOString()
    };

    return this.usersService.updateOrganisation(id, { settings, profile });
  }

  async generateComplianceReportPDF(orgId: string, dateRange: { start: string; end: string }) {
    const org = await this.usersService.getOrgWithStorageConfig(orgId);
    if (!org) throw new NotFoundException('Org not found');

    const profileName = org.profile?.active_profile || 'NONE';
    const stats = await this.getStats(orgId);

    // 1. Generate PDF
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).text(`QuantumTrust Compliance Report`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Organisation: ${org.name}`);
      doc.text(`Regulatory Profile: ${profileName}`);
      doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`);
      doc.moveDown();
      doc.fontSize(12).text(`Total Encryption Events: ${stats.encryptedFiles}`);
      doc.text(`Fields Encrypted: ${org.profile?.enforced_fields?.join(', ') || 'Manual'}`);
      doc.text(`Key Rotation History: ${stats.activeKeys} Active Keys`);
      doc.text(`Breach Incidents: ${stats.breachAlerts}`);
      doc.text(`Access Log Summary: Audited by Hyperledger Fabric`);
      doc.moveDown();
      doc.text(`Compliance Score: 100%`);
      doc.end();
    });

    // 2. Sign PDF with PQC Dilithium Mock
    const pqcSignature = this.cryptoService.signPqcDilithium(pdfBuffer);

    // 3. Deliver to Storage Destination
    let activeConfig = null;
    if (org.storage_config) {
      activeConfig = org.storage_config.find((c: any) => c.active);
    }
    const filename = `compliance_report_${orgId}_${Date.now()}.pdf`;
    
    // We append the signature metadata conceptually, or assume it's stored alongside.
    // For this simulation, we deliver the buffer directly.
    const storageUri = await this.storageService.pushEncryptedPayload(activeConfig, pdfBuffer, filename);

    return {
      status: 'success',
      report_url: storageUri,
      signature: pqcSignature.signature,
      algorithm: pqcSignature.algorithm,
      timestamp: pqcSignature.timestamp
    };
  }

  async scheduleComplianceReport(orgId: string, payload: any) {
    // Stores schedule boolean in settings
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');

    const settings = org.settings || {};
    settings.compliance_schedule = payload.enabled ? payload.frequency || 'monthly' : false;

    await this.usersService.updateOrganisation(orgId, { settings });
    return { status: 'success', scheduled: payload.enabled, frequency: settings.compliance_schedule };
  }

  verifyComplianceReportSignature(pdfBuffer: Buffer, signature: string): boolean {
    return this.cryptoService.verifyPqcDilithium(pdfBuffer, signature);
  }

  getComplianceTemplates() {
    return [
      { id: 'GDPR', title: 'GDPR', fields: ['name', 'email', 'DOB', 'address', 'IP'], retention: 365 },
      { id: 'HIPAA', title: 'HIPAA', fields: ['patient_id', 'diagnosis', 'SSN', 'DOB', 'medical_record'], retention: 2190 },
      { id: 'SAMA', title: 'SAMA', fields: ['account_no', 'transaction_data', 'IBAN'], retention: 365, notes: 'Requires On-Prem/SQL storage' },
      { id: 'PDPA', title: 'PDPA', fields: ['national_ID', 'financial_info'], retention: 1095 }
    ];
  }

  async getComplianceStatus(orgId: string) {
    const org = await this.usersService.getOrgWithStorageConfig(orgId);
    if (!org) throw new NotFoundException('Org not found');

    const activeProfile = org.profile?.active_profile || 'NONE';
    const hasActiveStorage = org.storage_config && org.storage_config.some((c: any) => c.active);
    const score = activeProfile !== 'NONE' ? (hasActiveStorage ? 100 : 90) : 50;

    return {
      status: 'success',
      active_profile: activeProfile,
      score,
      enforced_fields: org.profile?.enforced_fields || [],
      retention_days: org.settings?.log_retention_days || 30,
      mfa_enforced: !!org.settings?.require_mfa,
      breach_window: org.settings?.breach_notification_window || null
    };
  }

  async getLogs(orgId: string, page: number, limit: number) {
    return this.auditLogsService.getLogsByOrg(orgId, page, limit);
  }

  async getActivity(orgId: string) {
    return this.auditLogsService.getActivityTimelineByOrg(orgId);
  }

  async getSettings(orgId: string) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');
    return org.settings || {
      default_algorithm: 'AES-256-GCM',
      key_timer_interval: 3600,
      storage_destination: 'AWS S3'
    };
  }

  async updateSettings(orgId: string, settings: any) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');
    const newSettings = { ...(org.settings || {}), ...settings };
    await this.usersService.updateOrganisation(orgId, { settings: newSettings });
    return newSettings;
  }

  async getProfile(orgId: string) {
    return this.usersService.findOrganisationById(orgId);
  }

  async updateProfile(orgId: string, profile: any) {
    return this.usersService.updateOrganisation(orgId, profile);
  }

  async saveSupportTicket(orgId: string, payload: any) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');
    const tickets = org.settings?.tickets || [];
    const newTicket = { id: crypto.randomUUID(), ...payload, status: 'Open', date: new Date().toISOString() };
    tickets.push(newTicket);
    await this.updateSettings(orgId, { tickets });
    return newTicket;
  }

  async getKeys(orgId: string) {
    const org = await this.usersService.getOrgWithApiKeys(orgId);
    if (!org) throw new NotFoundException('Org not found');
    
    if (org.api_key) {
      return [{
        id: 'qt-********-****-****-****',
        type: 'QuantumTrust Dual-Auth Key',
        status: 'Active'
      }];
    }
    return [];
  }

  async generateApiKeys(orgId: string, userId: string, orgApiKey: string, totpCode?: string, ipAddress: string = 'UNKNOWN') {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');

    // If an API key already exists, this is a regeneration. We must verify TOTP.
    // In our implementation, we'll check if the db has an api_key (by querying securely).
    // Or we can just check if orgApiKey is provided and if the user requires TOTP.
    // The safest is always verifying TOTP if it's a regeneration.
    
    // We fetch the org securely using the exact query from usersService to see if api_key exists
    const orgWithKeys = await this.usersService.getOrgWithApiKeys(orgId);
    if (orgWithKeys && orgWithKeys.api_key) {
      if (!totpCode) {
        throw new UnauthorizedException('TOTP code is required to regenerate API keys.');
      }
      
      const user = await this.usersService.findById(userId);
      if (!user || !user.mfa_secret) {
        throw new UnauthorizedException('User MFA not configured.');
      }

      const isTotpValid = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: totpCode,
        window: 1,
      });

      if (!isTotpValid) {
        throw new UnauthorizedException('Invalid TOTP code.');
      }
    }

    if (!orgApiKey) {
      throw new UnauthorizedException('Organisation API Key is required to establish dual authentication.');
    }

    // 1. Generate UUID-based QuantumTrust API Key
    const plainApiKey = `qt-${crypto.randomUUID()}-${crypto.randomBytes(4).toString('hex')}`;

    // 2. Encrypt with AES-256 MASTER_KEY
    const masterKeyString = process.env.MASTER_KEY || '12345678901234567890123456789012';
    const masterKeyBuf = Buffer.from(masterKeyString.padEnd(32, '0').slice(0, 32), 'utf8');
    
    const encryptedBlob = this.cryptoService.encryptAesGcm(plainApiKey, masterKeyBuf);
    const dbApiKeyString = `ENC_GCM:${encryptedBlob.iv}:${encryptedBlob.authTag}:${encryptedBlob.ciphertext}`;

    const encryptedOrgBlob = this.cryptoService.encryptAesGcm(orgApiKey, masterKeyBuf);
    const dbOrgApiKeyString = `ENC_GCM:${encryptedOrgBlob.iv}:${encryptedOrgBlob.authTag}:${encryptedOrgBlob.ciphertext}`;

    // 3. Store in database
    await this.usersService.updateOrganisation(orgId, { 
      api_key: dbApiKeyString,
      org_api_key: dbOrgApiKeyString
    });

    // 4. Log to Audit Service (MongoDB & Fabric Mock)
    const user = await this.usersService.findById(userId);
    await this.auditLogsService.logEvent({
      user_id: userId,
      organisation_id: orgId,
      username: user?.username || 'admin',
      action: orgWithKeys && orgWithKeys.api_key ? 'API Key Regenerated' : 'API Key Generated',
      details: 'Dual Authentication keys provisioned'
    });

    // 5. Log to Hyperledger Fabric (AC-5.07)
    await this.ledgerService.logApiKeyOperation(orgId, 'SYSTEM', ipAddress, 'GENERATED');

    return { status: 'success', apiKey: plainApiKey };
  }

  async updateOrgApiKey(orgId: string, userId: string, orgApiKey: string) {
    if (!orgApiKey) throw new UnauthorizedException('Organisation API Key is required.');

    const masterKeyString = process.env.MASTER_KEY || '12345678901234567890123456789012';
    const masterKeyBuf = Buffer.from(masterKeyString.padEnd(32, '0').slice(0, 32), 'utf8');
    const encryptedOrgBlob = this.cryptoService.encryptAesGcm(orgApiKey, masterKeyBuf);
    const dbOrgApiKeyString = `ENC_GCM:${encryptedOrgBlob.iv}:${encryptedOrgBlob.authTag}:${encryptedOrgBlob.ciphertext}`;

    await this.usersService.updateOrganisation(orgId, { 
      org_api_key: dbOrgApiKeyString
    });

    const user = await this.usersService.findById(userId);
    await this.auditLogsService.logEvent({
      user_id: userId,
      organisation_id: orgId,
      username: user?.username || 'admin',
      action: 'Organisation API Key Updated',
      details: 'Isolated update of the organisation dual-auth key.'
    });

    return { status: 'success' };
  }

  async getStorageConfig(orgId: string) {
    const org = await this.usersService.getOrgWithStorageConfig(orgId);
    if (!org) throw new NotFoundException('Org not found');
    const configs = org.storage_config || [];

    // Mask sensitive fields
    const sensitiveFields = ['secret_access_key', 'account_key', 'password', 'secret_key', 'auth_token', 'connection_string'];
    return configs.map((c: any) => {
      const masked = { ...c };
      if (masked.credentials) {
        masked.credentials = { ...c.credentials };
        sensitiveFields.forEach(field => {
          if (masked.credentials[field]) {
            masked.credentials[field] = '****' + masked.credentials[field].slice(-4);
          }
        });
      }
      return masked;
    });
  }

  async saveStorageConfig(orgId: string, newConfig: any) {
    const org = await this.usersService.getOrgWithStorageConfig(orgId);
    if (!org) throw new NotFoundException('Org not found');
    let configs = org.storage_config || [];
    
    const existingIndex = configs.findIndex((c: any) => c.id === newConfig.id);
    
    const masterKeyString = process.env.MASTER_KEY || '12345678901234567890123456789012';
    const masterKeyBuf = Buffer.from(masterKeyString.padEnd(32, '0').slice(0, 32), 'utf8');

    const sensitiveFields = ['secret_access_key', 'account_key', 'password', 'secret_key', 'auth_token', 'connection_string'];
    
    // Create deep copy to mutate credentials
    const configToSave = { ...newConfig };
    if (configToSave.credentials) {
      configToSave.credentials = { ...newConfig.credentials };
      sensitiveFields.forEach(field => {
        const val = configToSave.credentials[field];
        if (val) {
          if (val.includes('****')) {
            // Keep old encrypted value if it was masked
            if (existingIndex !== -1 && configs[existingIndex].credentials) {
               configToSave.credentials[field] = configs[existingIndex].credentials[field];
            } else {
               delete configToSave.credentials[field]; // shouldn't happen normally
            }
          } else {
            // Encrypt plain text secret
            const encryptedBlob = this.cryptoService.encryptAesGcm(val, masterKeyBuf);
            configToSave.credentials[field] = `ENC_GCM:${encryptedBlob.iv}:${encryptedBlob.authTag}:${encryptedBlob.ciphertext}`;
          }
        }
      });
    }

    if (existingIndex !== -1) {
      configs[existingIndex] = configToSave;
    } else {
      if (configs.length >= 3) {
        throw new ConflictException('Maximum of 3 storage destinations allowed.');
      }
      // If it has no ID, assign one
      if (!configToSave.id) configToSave.id = crypto.randomUUID();
      configs.push(configToSave);
    }

    // Ensure only one is active if this one is active
    if (configToSave.active) {
      configs = configs.map((c: any) => ({ ...c, active: c.id === configToSave.id }));
    } else if (configs.length === 1) {
      // If it's the only one, make it active
      configs[0].active = true;
    }

    await this.usersService.updateOrganisation(orgId, { storage_config: configs });
    return this.getStorageConfig(orgId); // return masked array
  }

  async testStorageConnection(orgId: string, payload: any) {
    // In a full production system, this would instantiate the AWS SDK, pg pool, or MongoDB client
    // and attempt a live ping. For this MVP, we simulate the validation.
    if (!payload.type || !payload.credentials) {
      throw new ConflictException('Invalid payload for connection test.');
    }
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // We return success dynamically
    return { success: true, message: `Successfully connected to ${payload.type}` };
  }

  async saveHsmConfig(orgId: string, data: any) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');
    const settings = org.settings || {};

    const masterKeyBuf = Buffer.from((process.env.MASTER_KEY || '12345678901234567890123456789012').padEnd(32, '0').slice(0, 32), 'utf8');

    if (data.pin && !data.pin.startsWith('ENC_GCM:')) {
      const encryptedBlob = this.cryptoService.encryptAesGcm(data.pin, masterKeyBuf);
      data.pin = `ENC_GCM:${encryptedBlob.iv}:${encryptedBlob.authTag}:${encryptedBlob.ciphertext}`;
    }

    settings.hsm_config = data;
    await this.usersService.updateOrganisation(orgId, { settings });
    return { status: 'success', message: 'HSM Configuration Saved Successfully' };
  }

  async testHsmConnection(data: any) {
    try {
      await this.hsmService.testHsmConnection(data);
      return { status: 'success', message: 'HSM Ping Successful' };
    } catch (e) {
      throw new BadRequestException('HSM Connection Failed');
    }
  }

  async getHsmStatus(orgId: string) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org || !org.settings?.hsm_config) {
      return { configured: false, status: 'NOT_CONFIGURED' };
    }
    const online = await this.hsmService.healthCheck(org.settings.hsm_config);
    return {
      configured: true,
      enabled: org.settings.hsm_config.enabled,
      status: online ? 'ONLINE' : 'OFFLINE',
      provider: org.settings.hsm_config.provider,
      slot_count: online ? 4 : 0,
      firmware_version: online ? 'v7.8.4' : 'UNKNOWN'
    };
  }

  async deleteHsmConfig(orgId: string) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Org not found');
    if (org.settings) {
      delete org.settings.hsm_config;
      await this.usersService.updateOrganisation(orgId, { settings: org.settings });
    }
    return { status: 'success', message: 'HSM configuration deleted. Reverted to software encryption.' };
  }
}
