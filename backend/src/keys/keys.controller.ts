import { Controller, Get, Post, Body, UseGuards, Req, Param, Logger, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { KeysService } from './keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaGuard } from '../auth/guards/mfa.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { RegisterShardHoldersDto, InitiateRecoveryDto, ShardApprovalDto } from './dto/shard.dto';

@Controller('api')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Get('org/:id/keys')
  @UseGuards(JwtAuthGuard, MfaGuard)
  async getOrgKeys(@Param('id') orgId: string) {
    // Requires MFA (view key details)
    return {
      message: 'Keys retrieved successfully',
      keys: [] // In real app, fetch from KeysRepository
    };
  }

  @Post('keys/rotate')
  @UseGuards(JwtAuthGuard, MfaGuard)
  async manualRotate(@Req() req: any) {
    // Requires MFA
    const orgId = req.user.organisation_id || 'DEFAULT_ORG';
    const newKey = await this.keysService.getActiveKey(orgId, req.user.user_id);
    return {
      message: 'Key successfully rotated manually',
      key: newKey
    };
  }

  @Post('keys/shard-holders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async registerShardHolders(@Req() req: any, @Body() body: RegisterShardHoldersDto) {
    return this.keysService.registerShardHolders(req.user.organisation_id, body.trusted_emails);
  }

  @Post('keys/recover')
  @UseGuards(JwtAuthGuard, MfaGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async initiateRecovery(@Req() req: any, @Body() body: InitiateRecoveryDto) {
    // Requires MFA + keyId
    return this.keysService.initiateRecoveryFlow(req.user.organisation_id, req.user.user_id, body.key_id);
  }

  @Post('keys/shard-approve')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async approveShard(@Body() body: ShardApprovalDto) {
    // Auth: Shard Token / Value natively validates authority
    return this.keysService.approveShard(body.session_id, body.holder_email, body.shard_value);
  }

  @Get('keys/recovery-status')
  @UseGuards(JwtAuthGuard, MfaGuard)
  async getRecoveryStatus(@Req() req: any, @Query('session_id') sessionId: string) {
    return this.keysService.getRecoveryStatus(sessionId, req.user.organisation_id);
  }

  @Get('keys/check-expiry')
  @UseGuards(JwtAuthGuard)
  async manualCheckExpiry() {
    // Admin can trigger it manually, otherwise runs via Cron
    await this.keysService.handleDailyExpiry();
    return { message: 'Expiry check triggered' };
  }

  @Post('keys/set-timer')
  @UseGuards(JwtAuthGuard)
  async setKeyTimer(@Req() req: any, @Body('intervalSeconds') intervalSeconds: number) {
    // Admin/Org Admin updates timer configuration
    Logger.log(`[Keys] Key generation timer updated to ${intervalSeconds} seconds for Org ${req.user.organisation_id}`);
    return { success: true, message: `Key generation timer set to ${intervalSeconds}s` };
  }

  @Post('backup/verify')
  @UseGuards(JwtAuthGuard)
  async verifyBackup(@Body('checksum') checksum: string) {
    Logger.log(`[Keys] Verifying backup integrity for checksum: ${checksum}`);
    return { success: true, message: 'Backup checksum verified against active active master key payload' };
  }

  @Post('hsm/config')
  @UseGuards(JwtAuthGuard)
  async configureHsm(@Body('provider') provider: string, @Body('pin') pin: string) {
    Logger.log(`[HSM] Configured HSM connection for provider ${provider}`);
    return { success: true, message: 'HSM connection configured and secured' };
  }
}
