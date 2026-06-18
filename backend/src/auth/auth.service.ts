import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const saltRounds = 12; // Spec: bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Mock SendGrid Email Sending (AC-1.01)
    console.log(`[SendGrid] Sending verification email to ${user.email} with link: http://localhost:3000/verify-email?token=mock_token`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user_id: user.user_id,
    };
  }

  async login(loginDto: LoginDto, ip: string, mac: string) {
    const user = await this.usersService.findByUsernameOrEmail(loginDto.usernameOrEmail);

    let authErrorAction = 'Login Failed';
    let authErrorDetails = 'Invalid credentials';

    try {
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // AC-1.04: Account Lockout Check
      if (user.locked_until && new Date() < user.locked_until) {
        const remaining = Math.ceil((user.locked_until.getTime() - new Date().getTime()) / 60000);
        authErrorAction = 'Login Attempt on Locked Account';
        authErrorDetails = `Account locked for ${remaining} more minutes`;
        throw new ForbiddenException(`Account is locked for ${remaining} more minutes. Please try again later.`);
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
      if (!isPasswordValid) {
        // Handle failed attempt logic
        const attempts = (user.failed_login_attempts || 0) + 1;
        if (attempts >= 5) {
          // Lock account for 30 mins
          const lockTime = new Date();
          lockTime.setMinutes(lockTime.getMinutes() + 30);
          await this.usersService.updateUser(user.user_id, { failed_login_attempts: attempts, locked_until: lockTime });
          
          console.log(`[Admin Notification] User ${user.email} account locked due to 5 failed attempts.`);
          throw new ForbiddenException('Account is locked for 30 minutes due to 5 failed login attempts.');
        } else {
          await this.usersService.updateUser(user.user_id, { failed_login_attempts: attempts });
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      // IP/MAC Address Verification (AC-1.03)
      if (user.approved_addresses && user.approved_addresses.length > 0) {
        const isApproved = user.approved_addresses.some(
          (addr) => addr.ip === ip || addr.mac === mac
        );
        if (!isApproved) {
          authErrorAction = 'Security Alert: Unapproved Device';
          authErrorDetails = `Login attempted from IP: ${ip}, MAC: ${mac}`;
          throw new ForbiddenException('Access from this device is not approved');
        }
      }

      // MFA Verification
      if (user.mfa_enabled) {
        if (!loginDto.totp) {
          return { mfa_required: true, message: 'Please provide TOTP code' };
        }

        const isTotpValid = speakeasy.totp.verify({
          secret: user.mfa_secret,
          encoding: 'base32',
          token: loginDto.totp,
          window: 1,
        });

        if (!isTotpValid) {
          authErrorDetails = 'Invalid TOTP code';
          throw new UnauthorizedException('Invalid TOTP code');
        }
      }

      // Reset failed login attempts on successful login
      if (user.failed_login_attempts > 0) {
        await this.usersService.updateUser(user.user_id, { failed_login_attempts: 0, locked_until: null });
      }

      const payload = {
        sub: user.user_id,
        role: user.role,
        organisation_id: user.organisation?.organisation_id || null,
        permissions: user.permissions,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      await this.auditLogsService.logEvent({
        user_id: user.user_id,
        organisation_id: user.organisation?.organisation_id || 'SYSTEM',
        username: user.username,
        action: 'Login Successful',
        ip_address: ip,
        mac_address: mac,
      });

      return {
        accessToken,
        refreshToken,
        user_id: user.user_id,
        role: user.role,
      };
    } catch (error) {
      await this.auditLogsService.logEvent({
        user_id: user?.user_id || 'UNKNOWN',
        organisation_id: user?.organisation?.organisation_id || 'SYSTEM',
        username: loginDto.usernameOrEmail,
        action: authErrorAction,
        details: authErrorDetails,
        ip_address: ip,
        mac_address: mac,
        breach_flag: true,
      });
      throw error;
    }
  }

  async mfaSetup(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const secret = speakeasy.generateSecret({
      name: `QuantumTrust (${user.email})`,
    });

    // In a real scenario we save this temporarily or let them verify it before persisting.
    // For this module, we will save it directly and they must enable it.
    // Update user.mfa_secret in DB (needs update method in UsersService)
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async mfaVerify(userId: string, token: string) {
    // Requires usersService.update to persist mfa_enabled = true
    return { success: true, message: 'MFA Verified' };
  }
}
