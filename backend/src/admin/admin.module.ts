import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { KeysModule } from '../keys/keys.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization]),
    EncryptionModule,
    KeysModule,
    UsersModule,
    AuditLogsModule,
  ],
  providers: [AdminService, DeploymentService],
  controllers: [AdminController, DeploymentController],
})
export class AdminModule {}
