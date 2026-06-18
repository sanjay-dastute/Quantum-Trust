import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

/**
 * Temporary Metadata Table
 * This table is the ONLY place raw/uploaded file metadata is stored.
 * All records are hard-deleted after encryption completes or after a 10-minute session timeout.
 * No raw file content is ever persisted.
 */
@Entity('temporary_metadata')
export class Metadata {
  @PrimaryGeneratedColumn('uuid')
  data_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  organisation_id: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organization;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 50 })
  file_type: string;

  // Path to encrypted output — deleted post-processing
  @Column({ type: 'varchar', length: 500, nullable: true })
  encrypted_file_path: string;

  // Selected fields for encryption (e.g., ['name','ssn'])
  @Column({ type: 'jsonb', nullable: true })
  fields_encrypted: string[];

  // Embedded breach-response script
  @Column({ type: 'text', nullable: true })
  self_destruct_script: string;

  // Destination config: {type, bucket, credentials_ref}
  @Column({ type: 'jsonb', nullable: true })
  storage_config: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
