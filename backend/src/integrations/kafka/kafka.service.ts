import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { LedgerService } from '../ledger/ledger.service';
import { BatchJob, BatchJobStatus } from '../../entities/batch-job.entity';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);
  private readonly redis = new Redis({ host: 'localhost', port: 6379 });

  constructor(
    @InjectRepository(BatchJob) private readonly batchJobRepository: Repository<BatchJob>,
    private readonly ledgerService: LedgerService
  ) {}

  /**
   * Pushes a message to a Kafka topic. In this mock, it also instantly
   * triggers the Apache Spark consumer simulator.
   */
  async emit(topic: string, payload: any) {
    this.logger.log(`[Kafka] Message published to topic '${topic}': JobID ${payload.job_id}`);
    
    if (topic === 'encryption-jobs') {
      // Asynchronously trigger the Spark consumer mock
      this.simulateSparkConsumer(payload);
    }
  }

  /**
   * Simulates a distributed Apache Spark cluster consuming the message,
   * chunking the dataset into 128MB partitions, and processing them.
   */
  private async simulateSparkConsumer(payload: { job_id: string, file_path: string, org_id: string }) {
    this.logger.log(`[Spark Worker] Picked up job ${payload.job_id}. Splitting payload into 128MB partitions...`);
    
    // Log to ledger (AC-7.4.05)
    await this.ledgerService.logEncryptionEvent('SYSTEM', payload.org_id, [], 1, 'KAFKA_STREAM_STARTED');

    const redisKey = `batch:${payload.job_id}:progress`;
    
    // Simulate 10 iterations of processing
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 800)); // 800ms per "chunk"
      
      const currentStatus = await this.redis.get(redisKey);
      if (currentStatus === 'CANCELLED') {
        this.logger.warn(`[Spark Worker] Job ${payload.job_id} was CANCELLED. Aborting chunk processing. Cleaning up temporary Spark segments...`);
        // Log to ledger (AC-7.4.05)
        await this.ledgerService.logEncryptionEvent('SYSTEM', payload.org_id, [], 1, 'KAFKA_STREAM_CANCELLED');
        return;
      }

      const progress = i * 10;
      await this.redis.set(redisKey, progress.toString(), 'EX', 86400); // 24hr TTL
      this.logger.log(`[Spark Worker] Job ${payload.job_id} progress: ${progress}%`);
    }

    this.logger.log(`[Spark Worker] Job ${payload.job_id} COMPLETED. Signing manifest with Dilithium.`);
    
    // Update DB status to completed
    await this.batchJobRepository.update({ job_id: payload.job_id }, { status: BatchJobStatus.COMPLETED });

    // Log to ledger
    await this.ledgerService.logEncryptionEvent('SYSTEM', payload.org_id, [], 1, 'KAFKA_STREAM_COMPLETED');
  }
}
