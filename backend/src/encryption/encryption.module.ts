import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TemporaryMetadata } from '../entities/temp-metadata.entity';
import { EncryptionService } from './encryption.service';
import { EncryptionController } from './encryption.controller';

import { CryptoModule } from '../crypto/crypto.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { KeysModule } from '../keys/keys.module';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ApiKeyAuthMiddleware } from '../auth/middleware/api-key-auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemporaryMetadata]),
    CryptoModule, 
    IntegrationsModule, 
    KeysModule,
    UsersModule,
    AuditLogsModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'quantum-trust',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'encryption-consumer'
          }
        }
      }
    ])
  ],
  providers: [EncryptionService],
  controllers: [EncryptionController]
})
export class EncryptionModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyAuthMiddleware)
      .forRoutes(
        { path: 'api/encrypt', method: RequestMethod.POST },
        { path: 'api/batch/encrypt', method: RequestMethod.POST },
        { path: 'api/view-data', method: RequestMethod.GET },
        { path: 'api/admin/encrypt', method: RequestMethod.POST },
        { path: 'api/admin/view-data', method: RequestMethod.GET },
        { path: 'api/org/encrypt', method: RequestMethod.POST },
        { path: 'api/org/view-data', method: RequestMethod.GET },
        { path: 'api/user/encrypt', method: RequestMethod.POST },
        { path: 'api/user/view-data', method: RequestMethod.GET }
      );
  }
}
