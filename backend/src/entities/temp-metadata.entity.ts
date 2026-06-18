import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('temporary_metadata')
export class TemporaryMetadata {
  @PrimaryGeneratedColumn('uuid')
  file_id: string;

  @Column()
  original_name: string;

  @Column()
  size_bytes: number;

  @Column()
  org_id: string;

  @Column({ nullable: true })
  file_path: string;

  @Column('simple-array', { nullable: true })
  fields_encrypted: string[];

  @CreateDateColumn()
  created_at: Date;
}
