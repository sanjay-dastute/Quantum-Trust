import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum RecoveryStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

@Entity('recovery_sessions')
export class RecoverySession {
  @PrimaryGeneratedColumn('uuid')
  session_id: string;

  @Column({ type: 'uuid' })
  org_id: string;

  @Column({ type: 'uuid' })
  key_id: string;

  @Column({ type: 'uuid' })
  initiator_user_id: string;

  @Column({
    type: 'enum',
    enum: RecoveryStatus,
    default: RecoveryStatus.PENDING,
  })
  status: RecoveryStatus;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  collected_shards: any[]; // Array of { holder_id, shard }

  @CreateDateColumn()
  created_at: Date;
}
