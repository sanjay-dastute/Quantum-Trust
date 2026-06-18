import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const orgApiKey = request.headers['x-org-api-key'];

    if (!apiKey || !orgApiKey) {
      throw new UnauthorizedException('Missing X-API-Key or X-Org-API-Key headers');
    }

    const orgId = request.user?.organisation_id;
    if (!orgId) {
      throw new UnauthorizedException('Missing JWT organisation context. Dual authentication requires a valid JWT.');
    }

    const isValid = await this.usersService.validateApiKeys(orgId, apiKey, orgApiKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key credentials');
    }

    return true;
  }
}
