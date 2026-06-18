import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '../integrations/kafka/kafka.service';
import { BatchJob, BatchJobStatus } from '../entities/batch-job.entity';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private readonly redis = new Redis({ host: 'localhost', port: 6379 });

  constructor(
    @InjectRepository(BatchJob) private readonly batchJobRepository: Repository<BatchJob>,
    private readonly kafkaService: KafkaService
  ) {}

  async submitBatchJob(orgId: string, filePath: string, fieldsToEncrypt: string[]) {
    const jobId = crypto.randomUUID();
    
    // Initialize Progress in Redis to 0
    const redisKey = `batch:${jobId}:progress`;
    await this.redis.set(redisKey, '0', 'EX', 86400); // 24hr TTL

    const job = this.batchJobRepository.create({
      job_id: jobId,
      org_id: orgId,
      file_path: filePath,
      status: BatchJobStatus.PROCESSING
    });
    await this.batchJobRepository.save(job);

    const payload = {
      job_id: jobId,
      org_id: orgId,
      file_path: filePath,
      fields: fieldsToEncrypt,
      timestamp: new Date().toISOString()
    };

    this.logger.log(`[Batch] Submitted Job ${jobId} for org ${orgId}. Emitting to Kafka...`);
    await this.kafkaService.emit('encryption-jobs', payload);

    return {
      status: 'submitted',
      job_id: jobId,
      message: 'Batch encryption job successfully queued.'
    };
  }

  async getJobStatus(jobId: string) {
    const redisKey = `batch:${jobId}:progress`;
    const progressStr = await this.redis.get(redisKey);

    if (progressStr === null) {
      throw new NotFoundException(`Job ${jobId} not found or expired.`);
    }

    if (progressStr === 'CANCELLED') {
      return { job_id: jobId, status: 'CANCELLED', progress_percent: 0, estimated_time_remaining_sec: 0 };
    }

    const progress = parseInt(progressStr, 10);
    const estimatedTimeRemaining = progress === 100 ? 0 : Math.max(1, 10 - Math.floor(progress / 10)); // rough mock logic

    return {
      job_id: jobId,
      status: progress === 100 ? 'COMPLETED' : 'PROCESSING',
      progress_percent: progress,
      estimated_time_remaining_sec: estimatedTimeRemaining
    };
  }

  async cancelJob(jobId: string, orgId: string) {
    const job = await this.batchJobRepository.findOne({ where: { job_id: jobId, org_id: orgId } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status === BatchJobStatus.COMPLETED) {
      throw new BadRequestException('Job already completed');
    }

    // Set Redis flag so Spark Worker stops processing
    const redisKey = `batch:${jobId}:progress`;
    await this.redis.set(redisKey, 'CANCELLED', 'EX', 86400);

    job.status = BatchJobStatus.CANCELLED;
    await this.batchJobRepository.save(job);

    this.logger.log(`[Batch] Job ${jobId} successfully CANCELLED.`);
    return { status: 'success', message: 'Batch job successfully cancelled.' };
  }

  async getJobHistory(orgId: string) {
    const jobs = await this.batchJobRepository.find({
      where: { org_id: orgId },
      order: { created_at: 'DESC' }
    });
    return jobs;
  }
}
