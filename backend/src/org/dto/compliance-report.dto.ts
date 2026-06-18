import { IsString, IsNotEmpty } from 'class-validator';

export class ComplianceReportDto {
  @IsNotEmpty()
  @IsString()
  start_date: string;

  @IsNotEmpty()
  @IsString()
  end_date: string;
}

export class ComplianceScheduleDto {
  @IsNotEmpty()
  enabled: boolean;

  @IsString()
  frequency: string;
}
