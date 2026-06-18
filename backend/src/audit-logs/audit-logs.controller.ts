import { Controller, Get, Post, Query, Res, UseGuards, Patch, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { LedgerService } from '../integrations/ledger/ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import type { Response } from 'express';
import { DetectBreachDto } from './dto/breach.dto';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly ledgerService: LedgerService
  ) {}

  @Post('logs')
  async createLog(@Body() payload: any) {
    // Explicit manual ingestion for internal services mapped dual to Fabric + Mongo
    return this.auditLogsService.logEvent(payload);
  }

  @Get('admin/logs')
  @Roles(UserRole.ADMIN)
  async getAdminLogs(
    @Query('page') page: string, 
    @Query('limit') limit: string,
    @Query('user') user?: string,
    @Query('breach_flag') breach_flag?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.auditLogsService.getLogs(Number(page) || 1, Number(limit) || 50, false, user, breach_flag, startDate, endDate);
  }

  @Get('admin/logs/breach')
  @Roles(UserRole.ADMIN)
  async getBreachLogs(@Query('page') page: string, @Query('limit') limit: string) {
    return this.auditLogsService.getLogs(Number(page) || 1, Number(limit) || 50, true);
  }

  @Patch('admin/logs/breach/:id')
  @Roles(UserRole.ADMIN)
  async resolveBreachAlert(@Param('id') id: string) {
    return this.auditLogsService.resolveAlert(id);
  }

  @Get('admin/logs/export')
  @Roles(UserRole.ADMIN)
  async exportCsv(
    @Res() res: Response,
    @Query('user') user?: string,
    @Query('breach_flag') breach_flag?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const csvData = await this.auditLogsService.exportLogsCsv(user, breach_flag, startDate, endDate);
    res.header('Content-Type', 'text/csv');
    res.attachment(`audit_logs_${new Date().getTime()}.csv`);
    return res.send(csvData);
  }

  @Get('org/:id/logs')
  @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN)
  async getOrgLogs(@Param('id') orgId: string, @Query('page') page: string, @Query('limit') limit: string) {
    return this.auditLogsService.getLogsByOrg(orgId, Number(page) || 1, Number(limit) || 50);
  }

  @Get('user/:id/logs')
  async getUserLogs(@Param('id') userId: string, @Query('page') page: string, @Query('limit') limit: string) {
    // In production, guard should verify JWT matches `userId`
    return this.auditLogsService.getLogsByUser(userId, Number(page) || 1, Number(limit) || 50);
  }

  @Get('fabric/verify/:txid')
  @Roles(UserRole.ADMIN)
  async verifyFabricTransaction(@Param('txid') txid: string) {
    return this.ledgerService.verifyTransaction(txid);
  }
}

@Controller('api')
export class PublicBreachController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post('detect-breach')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async detectBreach(@Body() dto: DetectBreachDto) {
    return this.auditLogsService.registerBreachEvent(dto);
  }
}
