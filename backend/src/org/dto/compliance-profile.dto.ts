import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class ComplianceProfileDto {
  @IsNotEmpty({ message: 'profile_name is required' })
  @IsString()
  @IsIn(['GDPR', 'HIPAA', 'SAMA', 'PDPA', 'NONE'], { message: 'Invalid profile name' })
  profile_name: string;
}
