import { Controller, Post, Get, Body, Param, Req, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { BatchService } from './batch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsArray, IsNotEmpty } from 'class-validator';

class SubmitBatchDto {
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @IsArray()
  fields_to_encrypt: string[];
}

@Controller('api/batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('encrypt')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async submitBatchJob(@Req() req: any, @Body() body: SubmitBatchDto) {
    return this.batchService.submitBatchJob(req.user.organisation_id, body.file_path, body.fields_to_encrypt);
  }

  @Get('status/:id')
  async getBatchStatus(@Param('id') jobId: string) {
    return this.batchService.getJobStatus(jobId);
  }

  @Post('cancel/:id')
  async cancelBatchJob(@Req() req: any, @Param('id') jobId: string) {
    return this.batchService.cancelJob(jobId, req.user.organisation_id);
  }

  @Get('history')
  async getBatchHistory(@Req() req: any) {
    return this.batchService.getJobHistory(req.user.organisation_id);
  }
}
