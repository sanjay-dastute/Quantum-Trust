import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../entities/audit-log.schema';
import { AuditLogsController, PublicBreachController } from './audit-logs.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    IntegrationsModule
  ],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
  controllers: [AuditLogsController, PublicBreachController]
})
export class AuditLogsModule {}
