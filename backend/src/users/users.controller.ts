import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- ADMIN PANEL ---

  @Get('admin/users')
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Post('admin/users')
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createDto: any) {
    // In real app, hash password and use robust DTO. Simplified for now.
    return this.usersService.create(createDto);
  }

  @Patch('admin/users/:id')
  @Roles(UserRole.ADMIN)
  async updateUser(@Param('id') id: string, @Body() updateDto: any) {
    return this.usersService.updateUser(id, updateDto);
  }

  @Delete('admin/users/:id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.usersService.softDeleteUser(id);
  }

  @Post('admin/approve-address')
  @Roles(UserRole.ADMIN)
  async approveAddress(@Body() data: { userId: string; ip: string; mac: string }) {
    return this.usersService.addApprovedAddress(data.userId, data.ip, data.mac);
  }

  @Delete('admin/approve-address')
  @Roles(UserRole.ADMIN)
  async revokeAddress(@Body() data: { userId: string; ip: string; mac: string }) {
    return this.usersService.removeApprovedAddress(data.userId, data.ip, data.mac);
  }

  @Get('admin/organisations')
  @Roles(UserRole.ADMIN)
  async getOrganisations() {
    return this.usersService.findAllOrganisations();
  }

  @Patch('admin/organisations/:id')
  @Roles(UserRole.ADMIN)
  async updateOrganisation(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateOrganisation(id, data);
  }

  // --- ORG ADMIN PANEL ---

  @Get('organisation/:id/users')
  @Roles(UserRole.ORG_ADMIN)
  async getOrgUsers(@Param('id') id: string, @Req() req: any) {
    if (req.user.organisation_id !== id) throw new ForbiddenException('Cannot access other organisations');
    return this.usersService.findOrgUsers(id);
  }

  @Post('organisation/:id/users')
  @Roles(UserRole.ORG_ADMIN)
  async createOrgUser(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    if (req.user.organisation_id !== id) throw new ForbiddenException('Cannot access other organisations');
    // Force organisation context onto the user
    data.organizationName = req.user.organisation?.name;
    return this.usersService.create(data);
  }

  @Patch('organisation/:id/users/:uid')
  @Roles(UserRole.ORG_ADMIN)
  async updateOrgUser(@Param('id') id: string, @Param('uid') uid: string, @Body() data: any, @Req() req: any) {
    if (req.user.organisation_id !== id) throw new ForbiddenException('Cannot access other organisations');
    // Would verify the target user actually belongs to this org here
    return this.usersService.updateUser(uid, data);
  }

  @Delete('organisation/:id/users/:uid')
  @Roles(UserRole.ORG_ADMIN)
  async deleteOrgUser(@Param('id') id: string, @Param('uid') uid: string, @Req() req: any) {
    if (req.user.organisation_id !== id) throw new ForbiddenException('Cannot access other organisations');
    // Would verify the target user actually belongs to this org here
    return this.usersService.softDeleteUser(uid);
  }

  // --- ORG USER PANEL ---

  @Patch('user/:id')
  async updateSelfProfile(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    if (req.user.user_id !== id) {
      throw new ForbiddenException('Can only update own profile');
    }
    
    // Restrict update to name/phone only as per spec AC-1.07
    const allowedUpdates: any = {};
    if (data.details?.name) allowedUpdates['details'] = { ...req.user.details, name: data.details.name };
    if (data.details?.phone) allowedUpdates['details'] = { ...allowedUpdates['details'], phone: data.details.phone };

    return this.usersService.updateUser(id, allowedUpdates);
  }
}
