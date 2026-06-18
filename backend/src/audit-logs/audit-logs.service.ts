import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../entities/audit-log.schema';
import { LedgerService } from '../integrations/ledger/ledger.service';
import * as crypto from 'crypto';
import { DetectBreachDto } from './dto/breach.dto';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private readonly ledgerService: LedgerService,
    private readonly metricsService: MetricsService
  ) {}

  async logEvent(data: Partial<AuditLog>) {
    const newLog = new this.auditLogModel({
      log_id: crypto.randomUUID(),
      timestamp: new Date(),
      ...data,
    });
    return newLog.save();
  }

  async registerBreachEvent(dto: DetectBreachDto) {
    this.logger.error(`[BREACH DETECTED] Unauthorized decryption attempt from IP: ${dto.ip_address} | MAC: ${dto.mac_address} | File: ${dto.file_name}`);

    // Increment Prometheus metric
    this.metricsService.incrementBreachEvent();

    // 1. Log to MongoDB with breach_flag
    const newLog = new this.auditLogModel({
      log_id: crypto.randomUUID(),
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      user_id: 'UNKNOWN_ATTACKER',
      organisation_id: 'SYSTEM_WIDE',
      username: 'Unauthorised Client',
      action: `UNAUTHORISED_DECRYPTION_ATTEMPT`,
      ip_address: dto.ip_address,
      mac_address: dto.mac_address,
      details: `Attempted to decrypt file: ${dto.file_name} (Data ID: ${dto.data_id})`,
      breach_flag: true
    });
    await newLog.save();

    // 2. Immutably log to Hyperledger Fabric
    await this.ledgerService.logBreachEvent(
      'SYSTEM', // Unknown user at time of breach
      dto.ip_address || 'UNKNOWN',
      dto.mac_address || 'UNKNOWN',
      dto.file_name || 'UNKNOWN',
      'SELF_DESTRUCT'
    );

    // 3. Trigger Mock SendGrid Email Alert
    this.logger.log(`[SendGrid] Dispatching CRITICAL BREACH ALERT email to System Admins for Data ID: ${dto.data_id}`);

    return {
      status: 'logged',
      message: 'Breach event successfully logged to QuantumTrust systems.'
    };
  }

  async getLogs(page = 1, limit = 50, alertsOnly = false, user?: string, breach_flag?: string, startDate?: string, endDate?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (alertsOnly) filter.breach_flag = true;
    else if (breach_flag !== undefined) filter.breach_flag = breach_flag === 'true';

    if (user) filter.username = { $regex: user, $options: 'i' };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const data = await this.auditLogModel.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.auditLogModel.countDocuments(filter);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async resolveAlert(id: string) {
    return this.auditLogModel.findByIdAndUpdate(id, { breach_flag: false }, { new: true }).exec();
  }

  async getLogsByOrg(organisation_id: string, page = 1, limit = 50) {
    const filter = { organisation_id };
    const skip = (page - 1) * limit;

    const data = await this.auditLogModel.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.auditLogModel.countDocuments(filter);

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getActivityTimelineByOrg(organisation_id: string) {
    const filter = { organisation_id };
    return this.auditLogModel.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          actions: { $push: { action: "$action", username: "$username", time: "$timestamp" } }
        }
      },
      { $sort: { "_id": -1 } },
      { $limit: 30 }
    ]).exec();
  }

  async getLogsByUser(user_id: string, page = 1, limit = 50) {
    const filter = { user_id };
    const skip = (page - 1) * limit;

    const data = await this.auditLogModel.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.auditLogModel.countDocuments(filter);

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getActivityTimelineByUser(user_id: string) {
    const filter = { user_id };
    return this.auditLogModel.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          actions: { $push: { action: "$action", username: "$username", time: "$timestamp" } }
        }
      },
      { $sort: { "_id": -1 } },
      { $limit: 30 }
    ]).exec();
  }

  async exportLogsCsv(user?: string, breach_flag?: string, startDate?: string, endDate?: string) {
    const filter: any = {};
    if (breach_flag !== undefined) filter.breach_flag = breach_flag === 'true';
    if (user) filter.username = { $regex: user, $options: 'i' };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const { Parser } = require('json2csv');
    const logs = await this.auditLogModel.find(filter).sort({ timestamp: -1 }).lean().exec();
    
    const data = logs.map(l => ({
      log_id: l.log_id,
      timestamp: l.timestamp?.toISOString(),
      user_id: l.user_id,
      username: l.username,
      organisation_id: l.organisation_id,
      action: l.action,
      ip_address: l.ip_address,
      mac_address: l.mac_address,
      breach_flag: l.breach_flag ? 'YES' : 'NO'
    }));

    if (data.length === 0) return '';
    const parser = new Parser();
    return parser.parse(data);
  }
}
