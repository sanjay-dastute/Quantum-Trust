import { IsString, IsNotEmpty, ValidateIf, IsOptional, IsNumber, Min, Max, IsUrl, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StorageCredentialsDto {
  // AWS S3
  @ValidateIf((o, val) => o._type === 'AWS S3')
  @IsNotEmpty({ message: 'bucket_name is required for AWS S3' })
  @IsString()
  bucket_name?: string;

  @ValidateIf((o, val) => o._type === 'AWS S3')
  @IsNotEmpty({ message: 'access_key_id is required for AWS S3' })
  @IsString()
  access_key_id?: string;

  @ValidateIf((o, val) => o._type === 'AWS S3')
  @IsNotEmpty({ message: 'secret_access_key is required for AWS S3' })
  @IsString()
  secret_access_key?: string;

  @ValidateIf((o, val) => o._type === 'AWS S3')
  @IsNotEmpty({ message: 'region is required for AWS S3' })
  @IsString()
  region?: string;

  // Azure Data Lake
  @ValidateIf((o, val) => o._type === 'Azure Data Lake')
  @IsNotEmpty({ message: 'account_name is required for Azure Data Lake' })
  @IsString()
  account_name?: string;

  @ValidateIf((o, val) => o._type === 'Azure Data Lake')
  @IsNotEmpty({ message: 'account_key is required for Azure Data Lake' })
  @IsString()
  account_key?: string;

  @ValidateIf((o, val) => o._type === 'Azure Data Lake')
  @IsNotEmpty({ message: 'container_name is required for Azure Data Lake' })
  @IsString()
  container_name?: string;

  // SQL & NoSQL Database & On-Premises
  @ValidateIf((o, val) => ['SQL Database', 'NoSQL Database', 'On-Premises Instance'].includes(o._type))
  @IsNotEmpty({ message: 'server_name is required for Database and On-Premises destinations' })
  @IsString() // Add FQDN or IP validation if strictly necessary, but string accommodates both standard hostnames and internal domain names
  server_name?: string;

  @ValidateIf((o, val) => ['SQL Database', 'NoSQL Database'].includes(o._type))
  @IsNotEmpty({ message: 'database_name is required for Databases' })
  @IsString()
  database_name?: string;

  @ValidateIf((o, val) => ['SQL Database', 'On-Premises Instance'].includes(o._type))
  @IsNotEmpty({ message: 'username is required for SQL/On-Premises' })
  @IsString()
  username?: string;

  @ValidateIf((o, val) => ['SQL Database', 'On-Premises Instance'].includes(o._type))
  @IsNotEmpty({ message: 'password is required for SQL/On-Premises' })
  @IsString()
  password?: string;

  @ValidateIf((o, val) => ['SQL Database', 'On-Premises Instance'].includes(o._type))
  @IsNotEmpty({ message: 'port is required' })
  @IsNumber({}, { message: 'port must be a number' })
  @Min(1, { message: 'port must be between 1 and 65535' })
  @Max(65535, { message: 'port must be between 1 and 65535' })
  port?: number;

  @ValidateIf((o, val) => o._type === 'NoSQL Database')
  @IsNotEmpty({ message: 'collection_name is required for NoSQL Database' })
  @IsString()
  collection_name?: string;

  @ValidateIf((o, val) => o._type === 'On-Premises Instance')
  @IsNotEmpty({ message: 'path is required for On-Premises Instance' })
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  auth_token?: string;

  @IsOptional()
  @IsString()
  connection_string?: string;

  @IsOptional()
  @IsString()
  secret_key?: string;

  // Custom Endpoint
  @ValidateIf((o, val) => o._type === 'Custom Endpoint')
  @IsNotEmpty({ message: 'endpoint_url is required for Custom Endpoint' })
  @IsUrl({ require_tld: false }, { message: 'endpoint_url must be a valid URL' })
  endpoint_url?: string;
}

export class StorageConfigDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty({ message: 'Storage type is required' })
  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsNotEmpty({ message: 'Credentials object is required' })
  @ValidateNested()
  @Type(() => StorageCredentialsDto)
  credentials: StorageCredentialsDto;
}
