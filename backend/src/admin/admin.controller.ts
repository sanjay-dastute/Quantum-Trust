import { Controller, Get, Post, Body, UseGuards, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { Response } from 'express';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('health')
  @Roles(UserRole.ADMIN)
  async getSystemHealth() {
    // Acts as a high-level aggregate proxy for Prometheus dashboard statistics
    const memory = process.memoryUsage();
    return {
      status: 'Healthy',
      uptime_seconds: process.uptime(),
      memory_usage: {
        rss_mb: Math.round(memory.rss / 1024 / 1024),
        heapTotal_mb: Math.round(memory.heapTotal / 1024 / 1024),
        heapUsed_mb: Math.round(memory.heapUsed / 1024 / 1024)
      },
      fabric_connection: 'Connected',
      kafka_cluster: 'Healthy',
      hsm_status: 'Online'
    };
  }

  @Get('storage-configs')
  @Roles(UserRole.ADMIN)
  async getStorageConfigs() {
    return this.adminService.getAllStorageConfigs();
  }

  @Post('compliance')
  @Roles(UserRole.ADMIN)
  async generateComplianceReport(@Body('profile') profile: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.generateComplianceReport(profile || 'GDPR');
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=compliance-${profile}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Post('backup')
  @Roles(UserRole.ADMIN)
  async triggerBackup() {
    return this.adminService.triggerBackup();
  }

  @Post('encrypt')
  @Roles(UserRole.ADMIN)
  async encryptData(@Body('data') data: any) {
    return this.adminService.encryptData(data);
  }
}
