import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private kem: any;

  constructor() {
    const kyber = require('crystals-kyber-js');
    this.kem = new kyber.MlKem768();
  }

  async generateKyberKeyPair() {
    try {
      const [pk, sk] = await this.kem.generateKeyPair();
      return { 
        pk: Buffer.from(pk).toString('base64'), 
        sk: Buffer.from(sk).toString('base64') 
      };
    } catch (e) {
      throw new InternalServerErrorException('PQC Key Generation failed');
    }
  }

  async encapsulateKyber(pkBase64: string) {
    const pk = new Uint8Array(Buffer.from(pkBase64, 'base64'));
    try {
      const [ct, ss] = await this.kem.encap(pk);
      return { 
        ciphertext: Buffer.from(ct).toString('base64'), 
        sharedSecret: Buffer.from(ss).toString('base64') 
      };
    } catch (e) {
      throw new InternalServerErrorException('PQC Encapsulation failed');
    }
  }

  async decapsulateKyber(ctBase64: string, skBase64: string) {
    const ct = new Uint8Array(Buffer.from(ctBase64, 'base64'));
    const sk = new Uint8Array(Buffer.from(skBase64, 'base64'));
    try {
      const ss = await this.kem.decap(ct, sk);
      return Buffer.from(ss).toString('base64');
    } catch (e) {
      throw new InternalServerErrorException('PQC Decapsulation failed');
    }
  }

  deriveSymmetricKey(sharedSecretBase64: string): Buffer {
    const secret = Buffer.from(sharedSecretBase64, 'base64');
    return crypto.createHash('sha256').update(secret).digest();
  }

  encryptAesGcm(data: string, key: Buffer): { ciphertext: string, iv: string, authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(data, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    return { ciphertext, iv: iv.toString('base64'), authTag };
  }

  decryptAesGcm(ciphertext: string, key: Buffer, ivBase64: string, authTagBase64: string): string {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    return plaintext;
  }

  /**
   * Mocks a CRYSTALS-Dilithium post-quantum signature for a given payload buffer.
   * In a true production PQC environment, this would call out to a lattice cryptography C-library (e.g., liboqs).
   */
  signPqcDilithium(payloadBuffer: Buffer): { signature: string; algorithm: string; timestamp: string } {
    const hash = crypto.createHash('sha3-512').update(payloadBuffer).digest('hex');
    
    // Simulate a lattice-based polynomial signature blob (using an HMAC of the hash with a mock PQC secret)
    const mockPqcSecret = process.env.PQC_DILITHIUM_SECRET || 'quantum-lattice-mock-secret-42';
    const simulatedSignature = crypto.createHmac('sha3-512', mockPqcSecret).update(hash).digest('hex');

    // CRYSTALS-Dilithium signatures are large (e.g. ~2420 bytes for Dilithium2). 
    // We expand the mock string to loosely simulate a lattice signature size.
    const expandedSignature = simulatedSignature.repeat(15).substring(0, 4840); // Hex characters

    return {
      signature: `PQC-DILITHIUM-2:${expandedSignature}`,
      algorithm: 'CRYSTALS-Dilithium2',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verifies the mock CRYSTALS-Dilithium signature against a payload buffer.
   */
  verifyPqcDilithium(payloadBuffer: Buffer, signature: string): boolean {
    const hash = crypto.createHash('sha3-512').update(payloadBuffer).digest('hex');
    const mockPqcSecret = process.env.PQC_DILITHIUM_SECRET || 'quantum-lattice-mock-secret-42';
    const simulatedSignature = crypto.createHmac('sha3-512', mockPqcSecret).update(hash).digest('hex');
    const expectedExpanded = `PQC-DILITHIUM-2:${simulatedSignature.repeat(15).substring(0, 4840)}`;
    
    return signature === expectedExpanded;
  }

  generateSignature(data: string): string {
    return `mock-dilithium-sig-${crypto.randomUUID()}`;
  }
}
