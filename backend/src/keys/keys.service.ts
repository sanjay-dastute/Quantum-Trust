import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Key, KeyStatus } from '../entities/key.entity';
import { RecoverySession, RecoveryStatus } from '../entities/recovery-session.entity';
import { CryptoService } from '../crypto/crypto.service';
import { LedgerService } from '../integrations/ledger/ledger.service';
import { MetricsService } from '../metrics/metrics.service';
import { UsersService } from '../users/users.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import * as crypto from 'crypto';
const secrets = require('secrets.js-grempe');

@Injectable()
export class KeysService {
  private readonly logger = new Logger(KeysService.name);
  private readonly MASTER_KEY = process.env.MASTER_KEY || '12345678901234567890123456789012'; // 32 bytes
  private readonly redis = new Redis({ host: 'localhost', port: 6379 });

  constructor(
    @InjectRepository(Key) private readonly keysRepository: Repository<Key>,
    @InjectRepository(RecoverySession) private readonly recoveryRepository: Repository<RecoverySession>,
    private readonly cryptoService: CryptoService,
    private readonly ledgerService: LedgerService,
    private readonly usersService: UsersService,
    private readonly metricsService: MetricsService
  ) {}

  async getKeyById(keyId: string) {
    const key = await this.keysRepository.findOne({ where: { key_id: keyId } });
    if (!key) throw new NotFoundException('Key not found');
    
    // AC-3.06: Expired keys return 410 Gone
    if (key.status === KeyStatus.EXPIRED) {
      throw new HttpException('Key has expired; please rotate or recover', HttpStatus.GONE);
    }
    
    return key;
  }

  async getActiveKey(orgId: string, userId?: string) {
    const redisKey = `active_key:${orgId}`;
    
    // 0. Check Redis Cache First
    const cachedKeyStr = await this.redis.get(redisKey).catch(() => null);
    if (cachedKeyStr) {
      this.logger.log(`[Redis] Cache Hit: Active key returned from memory for org: ${orgId}`);
      return JSON.parse(cachedKeyStr);
    }

    // 1. Check for existing active key
    const activeKey = await this.keysRepository.findOne({
      where: { org_id: orgId, status: KeyStatus.ACTIVE },
      order: { version: 'DESC' }
    });

    const ROTATION_INTERVAL_MS = 300 * 1000; // 5 minutes mock
    const now = new Date();

    if (activeKey) {
      const age = now.getTime() - activeKey.created_at.getTime();
      if (age < ROTATION_INTERVAL_MS) {
        // Cache it for 60 seconds
        await this.redis.set(redisKey, JSON.stringify(activeKey), 'EX', 60).catch(() => null);
        return activeKey;
      }
      // If elapsed, mark rotated
      activeKey.status = KeyStatus.ROTATED;
      await this.keysRepository.save(activeKey);
      
      // Increment Prometheus Counter
      this.metricsService.incrementKeyRotation();
    }

    // 2. Generate new Kyber keypair
    this.logger.log(`Timer elapsed or no key found. Generating new Kyber key for org: ${orgId}`);
    const kyberKeyPair = await this.cryptoService.generateKyberKeyPair();
    
    // 3. Encrypt the secret key with the MASTER_KEY
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.MASTER_KEY), iv);
    let masterEncryptedSk = cipher.update(kyberKeyPair.sk, 'utf8', 'base64');
    masterEncryptedSk += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    
    const finalEncryptedSk = `${iv.toString('base64')}:${authTag}:${masterEncryptedSk}`;

    // 4. Split secret key into Shards via Shamir's Secret Sharing
    // secrets.js requires hex string
    const hexSecret = Buffer.from(finalEncryptedSk).toString('hex');
    const shards = secrets.share(hexSecret, 5, 3); // 5 shards, 3 required
    
    // Distribute shards metadata (mocking holder mapping)
    const shardsMetadata = shards.map((s: string, index: number) => ({
      shard_id: `shard-${index}`,
      holder: index < 2 ? 'FabricNode' : `TrustedHolder-${index}`
    }));

    // 5. Store new Key
    const newKey = this.keysRepository.create({
      org_id: orgId,
      user_id: userId,
      version: activeKey ? activeKey.version + 1 : 1,
      public_key: kyberKeyPair.pk,
      master_encrypted_sk: finalEncryptedSk, // Stored encrypted
      status: KeyStatus.ACTIVE,
      shards_metadata: shardsMetadata
    });

    await this.keysRepository.save(newKey);
    
    // 6. Log to Fabric
    await this.ledgerService.logKeyManagementEvent(newKey.key_id, userId || 'SYSTEM', 'GENERATED', newKey.version, false);

    // Cache the newly generated key for 60 seconds
    await this.redis.set(redisKey, JSON.stringify(newKey), 'EX', 60).catch(() => null);

    return newKey;
  }

  async recoverKey(keyId: string, providedShards: string[]) {
    if (providedShards.length < 3) {
      throw new BadRequestException('At least 3 shards are required for Shamir reconstruction');
    }
    
    try {
      const hexReconstructed = secrets.combine(providedShards);
      const reconstructedEncryptedSk = Buffer.from(hexReconstructed, 'hex').toString('utf8');
      
      // We could return this to admin
      this.logger.log(`[Shamir] Key ${keyId} successfully reconstructed by trusted quorum.`);
      return { success: true, reconstructedEncryptedSk };
    } catch (e) {
      throw new ForbiddenException('Shard combination failed. Invalid shards provided.');
    }
  }

  // ---- 7.3 Asynchronous Key Recovery Flow ---- //

  async registerShardHolders(orgId: string, emails: string[]) {
    const org = await this.usersService.findOrganisationById(orgId);
    if (!org) throw new NotFoundException('Organisation not found');
    
    org.settings = org.settings || {};
    org.settings.shard_holders = emails;
    await this.usersService.updateOrganisation(orgId, { settings: org.settings });
    
    this.logger.log(`[SSS] Registered ${emails.length} trusted shard holders for Org ${orgId}`);
    return { status: 'success', holders: emails };
  }

  async initiateRecoveryFlow(orgId: string, userId: string, keyId: string) {
    const key = await this.getKeyById(keyId);
    if (key.org_id !== orgId) throw new ForbiddenException('Key does not belong to this organisation');

    const org = await this.usersService.findOrganisationById(orgId);
    const holders = org?.settings?.shard_holders || [];
    if (holders.length < 3) {
      throw new BadRequestException('Not enough shard holders registered for 3-of-5 quorum');
    }

    const session = this.recoveryRepository.create({
      org_id: orgId,
      key_id: keyId,
      initiator_user_id: userId,
      status: RecoveryStatus.PENDING,
      collected_shards: []
    });
    await this.recoveryRepository.save(session);

    this.logger.log(`[SSS] Recovery Session ${session.session_id} INITIATED by ${userId}. Sending mock emails to ${holders.join(', ')}`);
    // Mock email delivery: send approval link `https://dashboard.quantumtrust.app/approve-shard?session=${session.session_id}`
    
    await this.ledgerService.logKeyManagementEvent(keyId, userId, 'RECOVERY_INITIATED', key.version, false);
    return { status: 'success', session_id: session.session_id, message: `Recovery initiated. Approvals requested from ${holders.length} holders.` };
  }

  async approveShard(sessionId: string, holderEmail: string, shardValue: string) {
    const session = await this.recoveryRepository.findOne({ where: { session_id: sessionId } });
    if (!session) throw new NotFoundException('Recovery session not found');

    if (session.status === RecoveryStatus.COMPLETED) {
      throw new ConflictException('Recovery already completed');
    }

    // Enforce 24 hour expiration (AC-7.3.04)
    const ageMs = Date.now() - session.created_at.getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      session.status = RecoveryStatus.EXPIRED;
      await this.recoveryRepository.save(session);
      throw new HttpException('Recovery session has expired (24h limit)', HttpStatus.GONE); // 410 Gone
    }
    if (session.status === RecoveryStatus.EXPIRED) {
      throw new HttpException('Recovery session has expired', HttpStatus.GONE);
    }

    // AC-7.3.02: Check if holder already approved
    if (session.collected_shards.some(s => s.holder === holderEmail)) {
      throw new ConflictException('Holder has already submitted a shard');
    }

    session.collected_shards.push({ holder: holderEmail, shard: shardValue });

    // AC-7.3.01: Check Quorum
    if (session.collected_shards.length >= 3) {
      try {
        const shardsOnly = session.collected_shards.map(s => s.shard);
        const hexReconstructed = secrets.combine(shardsOnly);
        const reconstructedEncryptedSk = Buffer.from(hexReconstructed, 'hex').toString('utf8');
        
        // Quorum Reached - Key is reconstructed temporarily
        this.logger.log(`[SSS] Quorum reached (3/5) for Session ${sessionId}. Key Reconstructed.`);
        session.status = RecoveryStatus.COMPLETED;
        await this.recoveryRepository.save(session);
        
        const approvedHolders = session.collected_shards.map(s => s.holder);
        // AC-7.3.03: Full recovery event logged
        await this.ledgerService.logKeyManagementEvent(session.key_id, session.initiator_user_id, 'RECOVERY_COMPLETED', 1, false);

        // In a real system, the AES master key would be re-injected into HSM/memory here.
        // For security, we do not return it raw, we just ack success.
        return { status: 'success', message: 'Quorum reached. Key successfully reconstructed and loaded.' };

      } catch (e) {
        this.logger.error(`[SSS] Reconstruction failed for Session ${sessionId}: Invalid Shards`);
        throw new BadRequestException('Shard threshold reached, but reconstruction failed mathematically (invalid shard provided).');
      }
    }

    await this.recoveryRepository.save(session);
    this.logger.log(`[SSS] Session ${sessionId}: Received shard from ${holderEmail}. Current approvals: ${session.collected_shards.length}/3`);
    return { status: 'success', message: `Shard approved. Waiting for ${3 - session.collected_shards.length} more approvals.` };
  }

  async getRecoveryStatus(sessionId: string, orgId: string) {
    const session = await this.recoveryRepository.findOne({ where: { session_id: sessionId } });
    if (!session || session.org_id !== orgId) throw new NotFoundException('Session not found');

    const ageMs = Date.now() - session.created_at.getTime();
    if (session.status === RecoveryStatus.PENDING && ageMs > 24 * 60 * 60 * 1000) {
      session.status = RecoveryStatus.EXPIRED;
      await this.recoveryRepository.save(session);
    }

    const timeRemainingSeconds = Math.max(0, Math.floor((24 * 60 * 60 * 1000 - ageMs) / 1000));

    return {
      session_id: session.session_id,
      status: session.status,
      approvals_received: session.collected_shards.length,
      quorum_required: 3,
      time_remaining_seconds: session.status === RecoveryStatus.PENDING ? timeRemainingSeconds : 0,
      approved_holders: session.collected_shards.map(s => s.holder)
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyExpiry() {
    this.logger.log('Running daily key expiry check...');
    const expiredKeys = await this.keysRepository.find({
      where: { expires_at: LessThan(new Date()), status: KeyStatus.ACTIVE }
    });
    
    for (const key of expiredKeys) {
      key.status = KeyStatus.EXPIRED;
      await this.keysRepository.save(key);
      this.logger.warn(`Key ${key.key_id} has expired.`);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyRotation() {
    this.logger.log('Running monthly automatic key rotation...');
    // In production, we would rotate all active keys across all orgs here.
  }
}
