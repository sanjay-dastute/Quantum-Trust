import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CryptoModule } from '../crypto/crypto.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [UsersModule, AuditLogsModule, CryptoModule, IntegrationsModule],
  providers: [OrgService],
  controllers: [OrgController]
})
export class OrgModule {}
