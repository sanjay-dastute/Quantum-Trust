import { Injectable, Logger } from '@nestjs/common';
import { Gateway, Wallets } from 'fabric-network';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../entities/audit-log.schema';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  private gateway: Gateway;
  private network: any;
  private contract: any;
  private isConnected: boolean = false;

  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>
  ) {
    this.gateway = new Gateway();
    this.connectFabric().catch(e => this.logger.warn(`Fabric node connection pending: ${e.message}`));
  }

  private async connectFabric() {
    try {
      const walletPath = './wallet';
      let wallet;
      if (fs.existsSync(walletPath)) {
        wallet = await Wallets.newFileSystemWallet(walletPath);
      } else {
        return;
      }
      const ccpPath = './connection-profile.json';
      if (!fs.existsSync(ccpPath)) return;
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
      await this.gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
      this.network = await this.gateway.getNetwork('quantumtrust-channel');
      this.contract = this.network.getContract('audit');
      this.isConnected = true;
      this.logger.log('Successfully connected to Hyperledger Fabric network.');
    } catch (error) {
      this.logger.warn(`Fabric connection failed. Running in standalone mode.`);
    }
  }

  private encryptPayload(payload: any): string {
    const keyString = process.env.MASTER_KEY || '12345678901234567890123456789012'; // 32 bytes
    const key = Buffer.from(keyString, 'utf8');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decryptPayload(cipherText: string): any {
    const keyString = process.env.MASTER_KEY || '12345678901234567890123456789012'; // 32 bytes
    const key = Buffer.from(keyString, 'utf8');
    const parts = cipherText.split(':');
    if (parts.length !== 3) throw new Error('Invalid cipher format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  private async submit(eventId: string, orgId: string, userId: string, action: string, payload: any, isBreach: boolean) {
    const ts = new Date().toISOString();
    let txId = 'MOCK_TX_' + Date.now();
    
    // 1. Commit to Fabric (Blocking)
    if (this.isConnected && this.contract) {
      const transaction = this.contract.createTransaction('CreateLog');
      txId = transaction.getTransactionId();
      await transaction.submit(eventId, orgId, userId, action, ts, JSON.stringify(payload), String(isBreach));
    }
    this.logger.log(`[Fabric Audit] ${action} -> TX: ${txId}`);

    // 2. Fire-And-Forget to MongoDB (Non-blocking)
    const encryptedDetails = this.encryptPayload(payload);
    
    this.auditLogModel.create({
      log_id: eventId,
      user_id: userId,
      organisation_id: orgId,
      username: userId, // Fallback, could be expanded
      action: action,
      timestamp: new Date(),
      breach_flag: isBreach,
      details: encryptedDetails,
      fabric_tx_id: txId
    }).catch(err => {
      this.logger.error(`[MongoDB] Failed to write dual-audit log ${eventId}: ${err.message}`);
    });
  }

  // 1. Encryption
  async logEncryptionEvent(userId: string, orgId: string, fieldsEncrypted: string[], keyVersion: number, storagePath: string) {
    const payload = { user_id: userId, org_id: orgId, fields_encrypted: fieldsEncrypted, key_version: keyVersion, timestamp: new Date().toISOString(), storage_path: storagePath };
    await this.submit(`enc-${Date.now()}`, orgId, userId, 'ENCRYPTION', payload, false);
  }

  // 2. Key Management
  async logKeyManagementEvent(keyId: string, userId: string, operation: string, version: number, hsmUsed: boolean) {
    const payload = { key_id: keyId, user_id: userId, operation, version, timestamp: new Date().toISOString(), hsm_used: hsmUsed };
    await this.submit(`key-${Date.now()}`, 'SYSTEM', userId, 'KEY_MANAGEMENT', payload, false);
  }

  // 3. Authentication
  async logAuthenticationEvent(userId: string, ip: string, mac: string, result: string) {
    const payload = { user_id: userId, ip, mac, result, timestamp: new Date().toISOString() };
    await this.submit(`auth-${Date.now()}`, 'SYSTEM', userId, 'AUTHENTICATION', payload, false);
  }

  // 4. Breach Events
  async logBreachEvent(userId: string, ip: string, mac: string, fileName: string, action: string) {
    const payload = { user_id: userId, ip, mac, file_name: fileName, action, timestamp: new Date().toISOString() };
    await this.submit(`breach-${Date.now()}`, 'SYSTEM', userId, 'BREACH_EVENT', payload, true);
  }

  // 5. API Key Operations
  async logApiKeyOperation(orgId: string, userId: string, ip: string, operation: string) {
    const payload = { org_id: orgId, user_id: userId, ip, operation, timestamp: new Date().toISOString() };
    await this.submit(`apikey-${Date.now()}`, orgId, userId, 'API_KEY_OP', payload, false);
  }

  // 6. Compliance
  async logComplianceEvent(orgId: string, regulation: string, userId: string) {
    const payload = { org_id: orgId, regulation, user_id: userId, timestamp: new Date().toISOString() };
    await this.submit(`comp-${Date.now()}`, orgId, userId, 'COMPLIANCE', payload, false);
  }

  // 7. Storage Delivery
  async logStorageDelivery(orgId: string, storageType: string, fileName: string, status: string) {
    const payload = { org_id: orgId, storage_type: storageType, file_name: fileName, timestamp: new Date().toISOString(), status };
    await this.submit(`store-${Date.now()}`, orgId, 'SYSTEM', 'STORAGE_DELIVERY', payload, false);
  }

  // 8. User Management
  async logUserManagementEvent(adminId: string, targetUserId: string, operation: string) {
    const payload = { admin_id: adminId, target_user_id: targetUserId, operation, timestamp: new Date().toISOString() };
    await this.submit(`user-${Date.now()}`, 'SYSTEM', adminId, 'USER_MANAGEMENT', payload, false);
  }

  // 9. Fabric Verification
  async verifyTransaction(txid: string) {
    try {
      // 1. Fetch from MongoDB
      const mongoRecord = await this.auditLogModel.findOne({ fabric_tx_id: txid }).exec();
      if (!mongoRecord) {
        return { status: 'error', message: 'Transaction ID not found in MongoDB replica' };
      }

      // 2. Decrypt MongoDB payload
      let mongoPayload;
      try {
        if (!mongoRecord.details) throw new Error('No details payload found');
        mongoPayload = this.decryptPayload(mongoRecord.details);
      } catch (e) {
        this.logger.error(`[INTEGRITY VIOLATION] MongoDB payload cipher corruption detected on TX: ${txid}`);
        return { status: 'INTEGRITY VIOLATION', message: 'MongoDB data tampering detected (cipher broken)', match: false };
      }

      // 3. Fetch from Fabric
      if (!this.isConnected || !this.contract) {
        return { status: 'offline', message: 'Fabric network is not connected to perform cryptographical verification', mongo_state: mongoPayload };
      }

      const result = await this.contract.evaluateTransaction('GetLog', mongoRecord.log_id);
      const fabricRecord = JSON.parse(result.toString());

      // 4. Compare JSON Integrity
      const fabricPayloadJSON = fabricRecord.payload;
      const mongoPayloadJSON = JSON.stringify(mongoPayload);

      if (fabricPayloadJSON !== mongoPayloadJSON) {
        this.logger.error(`[INTEGRITY VIOLATION] Hash mismatch on TX ${txid}! Fabric: ${fabricPayloadJSON} | MongoDB: ${mongoPayloadJSON}`);
        return { 
          status: 'INTEGRITY VIOLATION', 
          message: 'Data tampering detected between mutable MongoDB store and immutable Fabric ledger.', 
          match: false,
          fabric_state: JSON.parse(fabricPayloadJSON),
          mongo_state: mongoPayload
        };
      }

      return { 
        status: 'verified', 
        match: true, 
        message: 'Cryptographic integrity verified. MongoDB matches Fabric ledger.',
        fabric_tx_id: txid,
        payload: mongoPayload
      };
    } catch (err) {
      return { status: 'error', message: `Verification failed: ${err.message}` };
    }
  }
}
