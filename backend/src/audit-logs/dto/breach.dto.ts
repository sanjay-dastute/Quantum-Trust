import { IsString, IsNotEmpty, IsOptional, IsIP } from 'class-validator';

export class DetectBreachDto {
  @IsIP()
  @IsNotEmpty()
  ip_address: string;

  @IsString()
  @IsNotEmpty()
  mac_address: string;

  @IsString()
  @IsNotEmpty()
  file_name: string;

  @IsString()
  @IsNotEmpty()
  data_id: string;

  @IsString()
  @IsOptional()
  timestamp?: string;
}
