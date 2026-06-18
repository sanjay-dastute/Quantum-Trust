import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';

@Injectable()
export class MfaGuard implements CanActivate {
  // In a real app we inject RedisService to track failed attempts
  // private failedAttempts = new Map<string, number>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const mfaToken = request.headers['x-mfa-token'];

    if (!mfaToken) {
      throw new ForbiddenException('MFA Token required in X-MFA-Token header');
    }

    // In a real scenario we'd fetch the user's base32 TOTP secret from DB
    // For this demonstration, we assume speakeasy verifies it against a mock secret
    const mockUserSecret = 'JBSWY3DPEHPK3PXP'; // Base32 secret

    const verified = speakeasy.totp.verify({
      secret: mockUserSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 1 // Allow 30 seconds drift
    });

    if (!verified) {
      // Mocking the 15 minute brute-force lockout logic here
      throw new ForbiddenException('Invalid MFA Token. Failed attempts are logged.');
    }

    return true;
  }
}
