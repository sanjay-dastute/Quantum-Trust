import { Controller, Get, Post, Body, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { DeploymentDto, TriggerDeploymentDto } from './dto/deployment.dto';

@Controller('api/deployment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post('config')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async saveConfig(@Req() req: any, @Body() body: DeploymentDto) {
    return this.deploymentService.saveDeploymentConfig(req.user.organisation_id, body.cloud_provider, body.kubeconfig);
  }

  @Get('status')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async getStatus(@Req() req: any) {
    return this.deploymentService.getDeploymentStatus(req.user.organisation_id);
  }

  @Post('deploy')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async triggerDeploy(@Req() req: any, @Body() body: TriggerDeploymentDto) {
    return this.deploymentService.triggerDeployment(req.user.organisation_id, body.cloud_provider);
  }
}
