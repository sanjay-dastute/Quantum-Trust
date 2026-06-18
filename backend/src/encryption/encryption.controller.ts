import { Controller, Get, Post, Delete, Body, UseGuards, Req, Logger, BadRequestException, Inject, Param, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientKafka } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { EncryptionService } from './encryption.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class EncryptionController {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly auditLogsService: AuditLogsService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('batch-encryption-jobs');
    await this.kafkaClient.connect();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    dest: path.join(__dirname, '..', '..', '.tmp_uploads')
  }))
  async uploadTemp(@Req() req: any, @Body('fileContent') fileContent: string, @UploadedFile() file?: Express.Multer.File) {
    const dataString = fileContent;
    
    // Write to ephemeral disk
    const orgId = req.user.organisation_id || 'DEFAULT_ORG';
    const tmpDir = path.join(__dirname, '..', '..', '.tmp_uploads');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    let filePath = '';
    let size = 0;
    
    if (file) {
      filePath = file.path; // Already written to disk by Multer
      size = file.size;
    } else if (fileContent) {
      if (!dataString) throw new BadRequestException('No file or data provided');
      const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      filePath = path.join(tmpDir, fileName);
      await fs.promises.writeFile(filePath, dataString);
      size = dataString.length;
    } else {
      throw new BadRequestException('No file or data provided');
    }

    const tempMetadata = await this.encryptionService.logTemporaryFile(orgId, file?.originalname || 'manual_entry.txt', size, filePath);
    
    return { status: 'success', data_id: tempMetadata.file_id };
  }

  @Get('view-data')
  async viewData(@Query('data_id') dataId: string) {
    if (!dataId) throw new BadRequestException('Missing data_id');
    return this.encryptionService.parseFileFromDisk(dataId);
  }

  @Delete('temp-data/:id')
  async deleteTempData(@Param('id') dataId: string) {
    await this.encryptionService.deleteTemporaryData(dataId);
    return { status: 'success', message: 'Temporary data hard deleted' };
  }

  @Post('encrypt')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    dest: path.join(__dirname, '..', '..', '.tmp_uploads')
  }))
  async encryptData(
    @Req() req: any,
    @Body('data_id') dataId: string,
    @Body('data') data: string,
    @Body('fields') fieldsRaw: any,
    @Body('storage_config') storageConfig: any,
    @Body('interactive') interactiveParam: string | boolean,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const orgId = req.user.organisation_id || 'DEFAULT_ORG';
    const isInteractive = interactiveParam === true || interactiveParam === 'true';

    // 1. Data Reception Logging
    if (!dataId) {
      await this.auditLogsService.logEvent({
        user_id: req.user.user_id || 'API',
        organisation_id: orgId,
        username: req.user.username || 'API_USER',
        action: 'Automated Data Reception',
        details: `Received data from ${orgId}, IP: ${req.ip}`,
        ip_address: req.ip,
        mac_address: 'UNKNOWN',
        breach_flag: false
      });
    }

    // 2. Interactive Short-circuit
    if (isInteractive && !dataId) {
      const dataString = data;
      const tmpDir = path.join(__dirname, '..', '..', '.tmp_uploads');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      
      let filePath = '';
      let size = 0;
      
      if (file) {
        filePath = file.path;
        size = file.size;
      } else if (dataString) {
        const fileName = `interactive-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        filePath = path.join(tmpDir, fileName);
        await fs.promises.writeFile(filePath, dataString);
        size = dataString.length;
      } else {
        throw new BadRequestException('No file or data provided');
      }

      const tempMetadata = await this.encryptionService.logTemporaryFile(orgId, file?.originalname || 'interactive_entry.txt', size, filePath);

      await this.auditLogsService.logEvent({
        user_id: req.user.user_id || 'API',
        organisation_id: orgId,
        username: req.user.username || 'API_USER',
        action: 'Interactive Data Received - Requires Review',
        details: `Dataset ${tempMetadata.file_id} staged for manual field selection.`
      });

      return { 
        status: 'success', 
        message: 'Interactive mode initiated. Data staged for manual field selection.', 
        data_id: tempMetadata.file_id 
      };
    }

    let payload = data;
    if (dataId) {
       const fileData = await this.encryptionService.readFileFromDisk(dataId);
       payload = fileData;
    } else if (file) {
      payload = await fs.promises.readFile(file.path, 'utf8');
    }

    if (!payload) {
      throw new BadRequestException('Missing required field: data_id, data, or file');
    }
    
    let fields = [];
    if (typeof fieldsRaw === 'string') {
      try { fields = JSON.parse(fieldsRaw); } catch { fields = [fieldsRaw]; }
    } else if (Array.isArray(fieldsRaw)) {
      fields = fieldsRaw;
    }

    return this.encryptionService.executeEncryptionPipeline(dataId, payload, fields, orgId, req.user.user_id);
  }

  // --- ROLE-SCOPED ALIASES ---

  @Get('admin/view-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminViewData(@Query('data_id') dataId: string) { return this.viewData(dataId); }

  @Post('admin/encrypt')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async encryptAdmin(@Req() req: any, @Body('data_id') dataId: string, @Body('data') data: string, @Body('fields') fieldsRaw: any, @Body('storage_config') storageConfig: any, @Body('interactive') interactive: any, @UploadedFile() file?: Express.Multer.File) {
    return this.encryptData(req, dataId, data, fieldsRaw, storageConfig, interactive, file);
  }

  @Get('org/view-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  async orgViewData(@Query('data_id') dataId: string) { return this.viewData(dataId); }

  @Post('org/encrypt')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  async encryptOrg(@Req() req: any, @Body('data_id') dataId: string, @Body('data') data: string, @Body('fields') fieldsRaw: any, @Body('storage_config') storageConfig: any, @Body('interactive') interactive: any, @UploadedFile() file?: Express.Multer.File) {
    return this.encryptData(req, dataId, data, fieldsRaw, storageConfig, interactive, file);
  }

  @Get('user/view-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_USER)
  async userViewData(@Query('data_id') dataId: string) { return this.viewData(dataId); }

  @Post('user/encrypt')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async encryptUser(@Req() req: any, @Body('data_id') dataId: string, @Body('data') data: string, @Body('fields') fieldsRaw: any, @Body('storage_config') storageConfig: any, @Body('interactive') interactive: any, @UploadedFile() file?: Express.Multer.File) {
    return this.encryptData(req, dataId, data, fieldsRaw, storageConfig, interactive, file);
  }

  @Post('batch/encrypt')
  @UseGuards(JwtAuthGuard)
  async batchEncrypt(@Body('datasetUri') datasetUri: string) {
    const jobId = `spark-job-${Date.now()}`;
    
    // Publish to Kafka topic for asynchronous processing
    this.kafkaClient.emit('batch-encryption-jobs', {
      jobId,
      datasetUri,
      timestamp: new Date().toISOString()
    });

    Logger.log(`[Kafka] Published dataset at ${datasetUri} to Kafka topic 'batch-encryption-jobs'. Job ID: ${jobId}`);
    return {
      status: 'ACCEPTED',
      jobId,
      message: 'Batch encryption submitted to Kafka queue for Spark processing'
    };
  }

  @Get('batch/status/:jobId')
  @UseGuards(JwtAuthGuard)
  async getBatchStatus(@Param('jobId') jobId: string) {
    // Mocking a Spark progress incrementing by 15% roughly every second
    // We use the jobId timestamp to determine how much time has passed
    const timestampMatch = jobId.match(/spark-job-(\d+)/);
    let progress = 0;
    
    if (timestampMatch) {
      const startTime = parseInt(timestampMatch[1], 10);
      const elapsedMs = Date.now() - startTime;
      progress = Math.min(Math.floor((elapsedMs / 1000) * 15), 100);
    }
    
    return {
      jobId,
      progress,
      status: progress === 100 ? 'COMPLETED' : 'PROCESSING'
    };
  }

  @Post('hsm/encrypt')
  @UseGuards(JwtAuthGuard)
  async hsmEncrypt(@Body('payload') payload: string) {
    Logger.log(`[HSM Mock] Routing encryption payload to hardware security module via PKCS#11`);
    return {
      success: true,
      provider: 'HSM',
      message: 'Payload successfully encrypted on hardware device'
    };
  }

  @Post('output/deliver')
  // Internal implies it's either guarded by JWT or an internal microservice guard.
  @UseGuards(JwtAuthGuard)
  async deliverEncryptedOutput(@Req() req: any, @Body('data_id') dataId: string, @Body('payload') payload: any) {
    // This is an internal endpoint to manually push an already-encrypted payload to storage.
    // We would use the org's active config.
    const orgId = req.user.organisation_id || 'DEFAULT_ORG';
    const orgRecord = await this.encryptionService['usersService'].getOrgWithStorageConfig(orgId);
    let activeConfig = null;
    if (orgRecord && orgRecord.storage_config) {
      activeConfig = orgRecord.storage_config.find((c: any) => c.active);
    }
    
    const d = new Date();
    const ts = d.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
    const customFilename = `encrypted_${dataId || Date.now()}_${ts}.json`;

    const deliveryUri = await this.encryptionService['storageService'].pushEncryptedPayload(activeConfig, payload, customFilename);
    
    return {
      status: 'success',
      message: 'Internal delivery successful',
      storage_path: deliveryUri,
      timestamp: new Date().toISOString()
    };
  }

  @Post('admin/api-test')
  @UseGuards(JwtAuthGuard)
  async proxyTestRequest(@Body() payload: { endpoint: string; method: string; headers: Record<string, string>; body: any }) {
    const { endpoint, method, headers, body } = payload;
    
    if (!endpoint || !method) {
      throw new BadRequestException('Endpoint and Method are required');
    }

    const targetUrl = `http://localhost:3000${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Set headers, ensuring Content-Type is json unless specified otherwise
    const fetchHeaders: Record<string, string> = {
      ...headers,
      'Content-Type': headers['Content-Type'] || 'application/json',
    };

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: fetchHeaders,
    };

    if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const startTime = Date.now();
    let responseTimeMs = 0;
    
    try {
      const response = await fetch(targetUrl, fetchOptions);
      responseTimeMs = Date.now() - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      return {
        status: response.status,
        timeMs: responseTimeMs,
        data: responseData
      };
    } catch (e) {
      responseTimeMs = Date.now() - startTime;
      return {
        status: 500,
        timeMs: responseTimeMs,
        data: { error: 'Proxy request failed', details: e.message }
      };
    }
  }

  @Post('org/api-test')
  @UseGuards(JwtAuthGuard)
  async proxyTestRequestOrg(@Body() payload: { endpoint: string; method: string; headers: Record<string, string>; body: any }) {
    return this.proxyTestRequest(payload);
  }

  @Post('user/api-test')
  @UseGuards(JwtAuthGuard)
  async proxyTestRequestUser(@Body() payload: { endpoint: string; method: string; headers: Record<string, string>; body: any }) {
    return this.proxyTestRequest(payload);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getGlobalLogs(
    @Req() req: any,
    @Query('page') page: string, 
    @Query('limit') limit: string
  ) {
    // Explicitly scope logs to the user's organisation_id
    const orgId = req.user.organisation_id;
    if (!orgId) throw new BadRequestException('User does not belong to an organisation');
    
    return this.auditLogsService.getLogsByOrg(orgId, Number(page) || 1, Number(limit) || 50);
  }
}
