import { Controller, Get, Post, Patch, Body, Query, UseGuards, Req, Param, ForbiddenException } from '@nestjs/common';
import { ClientUserService } from './client-user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('api/user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

  private validateAccess(req: any, targetUserId: string) {
    if (req.user.role !== UserRole.ADMIN && req.user.user_id !== targetUserId) {
      throw new ForbiddenException('Access denied to this user scope');
    }
  }

  @Get(':id/stats')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async getStats(@Req() req: any, @Param('id') id: string) {
    this.validateAccess(req, id);
    return this.clientUserService.getStats(id);
  }

  @Get(':id/logs')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async getLogs(@Req() req: any, @Param('id') id: string, @Query('page') page: string, @Query('limit') limit: string) {
    this.validateAccess(req, id);
    return this.clientUserService.getLogs(id, Number(page) || 1, Number(limit) || 50);
  }

  @Get(':id/activity')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async getActivity(@Req() req: any, @Param('id') id: string) {
    this.validateAccess(req, id);
    return this.clientUserService.getActivity(id);
  }

  @Get(':id/settings')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async getSettings(@Req() req: any, @Param('id') id: string) {
    this.validateAccess(req, id);
    return this.clientUserService.getSettings(id);
  }

  @Patch(':id/settings')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async updateSettings(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    this.validateAccess(req, id);
    return this.clientUserService.updateSettings(id, data);
  }

  @Get(':id/keys')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async getKeys(@Req() req: any, @Param('id') id: string) {
    this.validateAccess(req, id);
    return this.clientUserService.getKeys(id);
  }

  @Post('support')
  @Roles(UserRole.ORG_USER, UserRole.ORG_ADMIN, UserRole.ADMIN)
  async saveSupportTicket(@Req() req: any, @Body() payload: any) {
    return this.clientUserService.saveSupportTicket(req.user.user_id, payload);
  }
}
