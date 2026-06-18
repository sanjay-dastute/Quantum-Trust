import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Key } from '../entities/key.entity';
import { RecoverySession } from '../entities/recovery-session.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Key, RecoverySession]), CryptoModule, IntegrationsModule, UsersModule],
  providers: [KeysService],
  controllers: [KeysController],
  exports: [KeysService]
})
export class KeysModule {}
