import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { BatchJob } from '../entities/batch-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BatchJob]), IntegrationsModule],
  providers: [BatchService],
  controllers: [BatchController],
})
export class BatchModule {}
