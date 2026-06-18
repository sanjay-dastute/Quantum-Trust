import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import * as crypto from 'crypto';

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  // Using AES-256-GCM for robust infrastructure credential encryption at rest
  private readonly MASTER_KEY = crypto.scryptSync(process.env.MASTER_KEY || 'default_master_key_123', 'salt', 32);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>
  ) {}

  private encryptCredentials(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.MASTER_KEY, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  async saveDeploymentConfig(orgId: string, provider: string, kubeconfig: string) {
    const org = await this.orgRepository.findOne({ where: { organisation_id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    const encryptedConfig = this.encryptCredentials(kubeconfig);

    if (!org.settings.deployment_targets) {
      org.settings.deployment_targets = [];
    }

    // Check if provider already exists and update, else push
    const existingIndex = org.settings.deployment_targets.findIndex((t: any) => t.cloud_provider === provider);
    
    const targetObj = {
      cloud_provider: provider,
      encrypted_credentials: encryptedConfig,
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      org.settings.deployment_targets[existingIndex] = targetObj;
    } else {
      org.settings.deployment_targets.push(targetObj);
    }

    await this.orgRepository.save(org);

    this.logger.log(`[DeploymentManager] Securely stored encrypted Kubeconfig for ${provider} under Org ${orgId}.`);

    return {
      status: 'success',
      provider,
      message: 'Cloud infrastructure credentials successfully encrypted and saved.'
    };
  }

  async getDeploymentStatus(orgId: string) {
    const org = await this.orgRepository.findOne({ where: { organisation_id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    const targets = org.settings.deployment_targets || [];
    
    // Sanitize: NEVER return encrypted_credentials back to client
    const sanitizedTargets = targets.map((t: any) => ({
      cloud_provider: t.cloud_provider,
      updated_at: t.updated_at,
      status: 'Healthy', // Mock ping health
      active_pods: Math.floor(Math.random() * 5) + 3 // Mock dynamic pod count
    }));

    return { targets: sanitizedTargets };
  }

  async triggerDeployment(orgId: string, provider: string) {
    const org = await this.orgRepository.findOne({ where: { organisation_id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    const targets = org.settings.deployment_targets || [];
    const target = targets.find((t: any) => t.cloud_provider === provider);

    if (!target) {
      throw new NotFoundException(`No deployment configuration found for provider ${provider}`);
    }

    this.logger.log(`[DeploymentManager] Initiating rolling deployment sequence to ${provider} cluster for Org ${orgId}...`);

    // Mock asynchronous pipeline trigger
    return {
      status: 'accepted',
      message: `Deployment pipeline successfully triggered for ${provider}.`,
      estimated_completion_time: '2 minutes'
    };
  }
}
