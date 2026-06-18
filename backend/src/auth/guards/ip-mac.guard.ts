import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import * as requestIp from 'request-ip';

@Injectable()
export class IpMacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Skip if user not authenticated (should be placed after JwtAuthGuard)
    if (!user) return true;

    // Zero-Trust Enforcement
    if (user.approved_addresses && user.approved_addresses.length > 0) {
      const ip = requestIp.getClientIp(req) || 'unknown';
      const mac = '00:00:00:00:00:00'; // Real extraction would be handled here
      
      const isApproved = user.approved_addresses.some(
        (addr: any) => addr.ip === ip || addr.mac === mac
      );

      if (!isApproved) {
        throw new ForbiddenException('Access from this device is not approved (IP/MAC Enforcement)');
      }
    }

    return true;
  }
}
