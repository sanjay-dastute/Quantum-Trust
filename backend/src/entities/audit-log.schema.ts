import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'logs', timestamps: { createdAt: 'timestamp', updatedAt: false } })
export class AuditLog {
  @Prop({ required: true, unique: true })
  log_id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, index: true })
  organisation_id: string;

  @Prop({ required: true, index: true })
  username: string;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  ip_address?: string;

  @Prop()
  mac_address?: string;

  @Prop()
  details?: string;

  @Prop({ default: false, index: true })
  breach_flag: boolean;

  @Prop({ default: false })
  approval_required: boolean;

  @Prop({ index: true })
  fabric_tx_id?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Create compound index for timestamp descending
AuditLogSchema.index({ timestamp: -1 });

// AC-9.3.02: TTL index enforces log retention per org compliance settings (e.g., GDPR: 365 days)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });
