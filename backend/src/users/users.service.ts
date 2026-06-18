import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import * as bcrypt from 'bcrypt';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const { username, email, password, organizationName } = registerDto;
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    let organization = null;
    if (organizationName) {
      organization = await this.orgRepository.findOne({ where: { name: organizationName } });
      if (!organization) {
        organization = this.orgRepository.create({ name: organizationName });
        await this.orgRepository.save(organization);
      }
    }

    const user = new User();
    user.username = username;
    user.email = email;
    user.password_hash = password;
    user.role = UserRole.ORG_USER;
    if (organization) {
      user.organisation = organization;
    }
    user.mfa_enabled = false;

    return this.userRepository.save(user);
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    return this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.organisation', 'organisation')
      .addSelect(['user.password_hash', 'user.mfa_secret'])
      .where('user.email = :identifier OR user.username = :identifier', { identifier })
      .getOne();
  }

  async findUsersByOrg(organisation_id: string) {
    return this.userRepository.find({
      where: { organisation: { organisation_id } },
      relations: { organisation: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { user_id: id },
      relations: { organisation: true },
    });
  }

  // --- ADMIN ENDPOINTS ---

  async findAllUsers() {
    return this.userRepository.find({
      relations: { organisation: true },
      select: { user_id: true, username: true, email: true, role: true, mfa_enabled: true, created_at: true },
    });
  }

  async updateUser(id: string, updateData: Partial<User>) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    
    // Simple update merge
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async softDeleteUser(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    // Implement soft-delete by deactivating
    user.role = UserRole.ORG_USER; // Reset role
    user.permissions = { active: false };
    return this.userRepository.save(user);
  }

  async addApprovedAddress(userId: string, ip: string, mac: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const addrs = user.approved_addresses || [];
    addrs.push({ ip, mac });
    user.approved_addresses = addrs;
    return this.userRepository.save(user);
  }

  async removeApprovedAddress(userId: string, ip: string, mac: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const addrs = user.approved_addresses || [];
    user.approved_addresses = addrs.filter(a => !(a.ip === ip && a.mac === mac));
    return this.userRepository.save(user);
  }

  async findAllOrganisations() {
    return this.orgRepository.find();
  }

  async findOrganisationById(id: string) {
    return this.orgRepository.findOne({ where: { organisation_id: id } });
  }

  async updateOrganisation(id: string, updateData: Partial<Organization>) {
    const org = await this.orgRepository.findOne({ where: { organisation_id: id } });
    if (!org) throw new NotFoundException('Organization not found');
    Object.assign(org, updateData);
    return this.orgRepository.save(org);
  }

  // --- ORG ADMIN ENDPOINTS ---

  async findOrgUsers(orgId: string) {
    return this.userRepository.find({
      where: { organisation_id: orgId } as any, // TypeORM relation alias if organization_id is mapped manually
      select: { user_id: true, username: true, email: true, role: true, mfa_enabled: true, created_at: true },
    });
  }

  async getOrgWithApiKeys(orgId: string): Promise<Organization | null> {
    return this.orgRepository.createQueryBuilder('org')
      .addSelect(['org.api_key', 'org.org_api_key'])
      .where('org.organisation_id = :orgId', { orgId })
      .getOne();
  }

  async getOrgWithStorageConfig(orgId: string): Promise<Organization | null> {
    return this.orgRepository.createQueryBuilder('org')
      .addSelect(['org.storage_config'])
      .where('org.organisation_id = :orgId', { orgId })
      .getOne();
  }

  async validateApiKeys(orgId: string, apiKey: string, orgApiKey: string): Promise<boolean> {
    const org = await this.getOrgWithApiKeys(orgId);
    
    if (!org || !org.api_key || !org.org_api_key) return false;

    const masterKeyString = process.env.MASTER_KEY || '12345678901234567890123456789012';
    const masterKeyBuf = Buffer.from(masterKeyString.padEnd(32, '0').slice(0, 32), 'utf8');

    // 1. Decrypt org.org_api_key
    const orgParts = org.org_api_key.split(':');
    if (orgParts.length !== 4 || orgParts[0] !== 'ENC_GCM') return false;
    
    try {
      const [, oIv, oAuthTag, oCiphertext] = orgParts;
      const decryptedOrgKey = this.cryptoService.decryptAesGcm(oCiphertext, masterKeyBuf, oIv, oAuthTag);
      if (decryptedOrgKey !== orgApiKey) return false;
    } catch (err) {
      return false; // Decryption failed or tampered
    }

    // 2. Decrypt org.api_key
    const qtParts = org.api_key.split(':');
    if (qtParts.length !== 4 || qtParts[0] !== 'ENC_GCM') return false;

    try {
      const [, qIv, qAuthTag, qCiphertext] = qtParts;
      const decryptedQtKey = this.cryptoService.decryptAesGcm(qCiphertext, masterKeyBuf, qIv, qAuthTag);
      return decryptedQtKey === apiKey;
    } catch (err) {
      return false; // Decryption failed or tampered
    }
  }
}
