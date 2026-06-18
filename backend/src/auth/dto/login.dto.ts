import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Accepts either username or email
  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // Optional: TOTP code if MFA is enabled
  @IsString()
  @IsNotEmpty()
  totp?: string;
}
