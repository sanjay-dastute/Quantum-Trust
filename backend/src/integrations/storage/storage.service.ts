import { Injectable, Logger } from '@nestjs/common';
import { CryptoService } from '../../crypto/crypto.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly cryptoService: CryptoService) {}

  async pushEncryptedPayload(config: any, payload: any, filename: string): Promise<string> {
    if (!config) {
      this.logger.log(`No specific config provided, simulating default AWS S3 bucket delivery.`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return `s3://default-quantum-trust-bucket/${filename}`;
    }

    const { type, credentials } = config;
    this.logger.log(`[Storage SDK] Routing payload via SDK for: ${type}`);

    // Decrypt credentials internally
    const masterKeyString = process.env.MASTER_KEY || '12345678901234567890123456789012';
    const masterKeyBuf = Buffer.from(masterKeyString.padEnd(32, '0').slice(0, 32), 'utf8');

    const decryptedCreds = { ...credentials };
    const sensitiveFields = ['secret_access_key', 'account_key', 'password', 'secret_key', 'auth_token', 'connection_string'];
    
    for (const field of sensitiveFields) {
      if (decryptedCreds[field] && decryptedCreds[field].startsWith('ENC_GCM:')) {
        try {
          const [, iv, tag, ct] = decryptedCreds[field].split(':');
          decryptedCreds[field] = this.cryptoService.decryptAesGcm(ct, masterKeyBuf, iv, tag);
        } catch (e) {
          this.logger.error(`Failed to decrypt credential field: ${field}`);
        }
      }
    }

    // Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate specific SDK logic
    switch (type) {
      case 'AWS S3':
        this.logger.log(`[AWS SDK] aws-sdk v3: s3.upload({ Bucket: ${decryptedCreds.bucket_name}, Key: ${filename} })`);
        return `s3://${decryptedCreds.bucket_name}/${filename}`;
      case 'Azure Data Lake':
        this.logger.log(`[Azure SDK] @azure/storage-blob: blockBlobClient.uploadData() to ${decryptedCreds.container_name}`);
        return `https://${decryptedCreds.account_name}.blob.core.windows.net/${decryptedCreds.container_name}/${filename}`;
      case 'SQL Database':
        this.logger.log(`[pg/mysql2 SDK] INSERT INTO encrypted_files(data) VALUES($1) at ${decryptedCreds.server_name}:${decryptedCreds.port}`);
        return `sql://${decryptedCreds.server_name}/${decryptedCreds.database_name}/${filename}`;
      case 'NoSQL Database':
        this.logger.log(`[mongodb SDK] collection.insertOne({ data: encrypted_data }) at ${decryptedCreds.collection_name}`);
        return `nosql://${decryptedCreds.server_name}/${decryptedCreds.database_name}/${filename}`;
      case 'On-Premises Instance':
        this.logger.log(`[ssh2-sftp-client] SFTP pushing payload to ${decryptedCreds.server_name}:${decryptedCreds.port}${decryptedCreds.path}/${filename}`);
        return `sftp://${decryptedCreds.server_name}${decryptedCreds.path}/${filename}`;
      case 'Custom Endpoint':
        this.logger.log(`[axios SDK] POST to endpoint_url: ${decryptedCreds.endpoint_url} with Authorization: Bearer ${decryptedCreds.auth_token ? '***' : 'none'} and encrypted_data in body`);
        return `${decryptedCreds.endpoint_url}/${filename}`;
      default:
        return `unknown://${filename}`;
    }
  }
}
