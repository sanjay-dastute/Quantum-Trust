import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import * as fs from 'fs';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    UsersModule,
    AuditLogsModule,
    IntegrationsModule,
    PassportModule,
    JwtModule.register({
      privateKey: fs.readFileSync('private.pem'),
      publicKey: fs.readFileSync('public.pem'),
      signOptions: { algorithm: 'RS256', expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
