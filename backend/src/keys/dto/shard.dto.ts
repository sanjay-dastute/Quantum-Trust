import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class RegisterShardHoldersDto {
  @IsArray()
  @ArrayMinSize(3)
  @IsString({ each: true })
  trusted_emails: string[];
}

export class InitiateRecoveryDto {
  @IsNotEmpty()
  @IsUUID()
  key_id: string;

  @IsNotEmpty()
  @IsString()
  totp_token: string;
}

export class ShardApprovalDto {
  @IsNotEmpty()
  @IsUUID()
  session_id: string;

  @IsNotEmpty()
  @IsString()
  holder_email: string;

  @IsNotEmpty()
  @IsString()
  shard_value: string;
}
