import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerService } from './ledger/ledger.service';
import { StorageService } from './storage/storage.service';
import { KafkaService } from './kafka/kafka.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../entities/audit-log.schema';
import { CryptoModule } from '../crypto/crypto.module';
import { HsmModule } from '../hsm/hsm.module';
import { BatchJob } from '../entities/batch-job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BatchJob]),
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    CryptoModule,
    forwardRef(() => HsmModule),
  ],
  providers: [LedgerService, StorageService, KafkaService],
  exports: [LedgerService, StorageService, HsmModule, KafkaService]
})
export class IntegrationsModule {}
