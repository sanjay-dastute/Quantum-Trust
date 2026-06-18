import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum UserRole {
  ADMIN = 'admin',
  ORG_ADMIN = 'org_admin',
  ORG_USER = 'org_user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  organisation_id: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organization;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  mfa_secret: string;

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  approved_addresses: Array<{ ip?: string; mac?: string }>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
