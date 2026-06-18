import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BatchJobStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

@Entity('batch_jobs')
export class BatchJob {
  @PrimaryColumn('uuid')
  job_id: string;

  @Column({ type: 'uuid' })
  org_id: string;

  @Column({ type: 'text' })
  file_path: string;

  @Column({ type: 'text', nullable: true })
  output_path: string;

  @Column({
    type: 'enum',
    enum: BatchJobStatus,
    default: BatchJobStatus.PROCESSING,
  })
  status: BatchJobStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
