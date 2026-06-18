import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class HsmConfigDto {
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  library_path: string;

  @IsNotEmpty()
  @IsString()
  slot_id: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  port?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}
