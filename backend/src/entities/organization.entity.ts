import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';

@Entity('organisations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  organisation_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  admin_user_id: string;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_user_id' })
  admin_user: User;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  // Stored as encrypted string/text or encrypted JSON object. 
  // select: false ensures we don't accidentally pull this in standard queries.
  @Column({ type: 'jsonb', select: false, nullable: true })
  storage_config: any;

  @Column({ type: 'jsonb', nullable: true })
  profile: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  api_key: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  org_api_key: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => User, (user) => user.organisation)
  users: User[];
}
