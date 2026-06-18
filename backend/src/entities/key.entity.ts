import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  ROTATED = 'ROTATED',
  EXPIRED = 'EXPIRED',
}

@Entity('keys')
export class Key {
  @PrimaryGeneratedColumn('uuid')
  key_id: string;

  @Column({ type: 'uuid' })
  org_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'text' })
  public_key: string;

  @Column({ type: 'text' })
  master_encrypted_sk: string;

  @Column({
    type: 'enum',
    enum: KeyStatus,
    default: KeyStatus.ACTIVE,
  })
  status: KeyStatus;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  shards_metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
