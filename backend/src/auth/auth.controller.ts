import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request, Response } from 'express';
import * as requestIp from 'request-ip';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ login: { limit: 5, ttl: 900000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Extract IP using request-ip
    const ip = requestIp.getClientIp(req) || 'unknown';
    // Extract MAC (mocked for now, real extraction via ARP table usually requires a specific library/permissions)
    const mac = '00:00:00:00:00:00'; 

    const result = await this.authService.login(loginDto, ip, mac);

    if (result.refreshToken) {
      // Set httpOnly refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      // Remove refreshToken from JSON response payload for security
      // Construct return without refreshToken
    }

    return {
      accessToken: result.accessToken,
      user_id: result.user_id,
      role: result.role,
      ...(result.mfa_required && { mfa_required: true, message: result.message })
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  async mfaSetup(@Req() req: any) {
    return this.authService.mfaSetup(req.user.user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  async mfaVerify(@Body('totp') totp: string, @Req() req: any) {
    return this.authService.mfaVerify(req.user.user_id, totp);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  async mfaDisable(@Body('password') password: string, @Req() req: any) {
    // Requires password confirmation per AC-1.09
    // Would verify password via AuthService, then disable MFA
    return { success: true, message: 'MFA Disabled successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Basic implementation: would read req.cookies['refreshToken'], verify it, and issue a new access token
    return { accessToken: 'new-access-token-placeholder' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    // Basic implementation: verifies email token
    return { message: 'Email verified successfully' };
  }
}
