import { Module } from '@nestjs/common';
import { ClientUserService } from './client-user.service';
import { ClientUserController } from './client-user.controller';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [UsersModule, AuditLogsModule],
  providers: [ClientUserService],
  controllers: [ClientUserController]
})
export class ClientUserModule {}
