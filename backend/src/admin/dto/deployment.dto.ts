import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class DeploymentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['AWS_EKS', 'AZURE_AKS', 'GCP_GKE', 'ON_PREMISES'])
  cloud_provider: string;

  @IsString()
  @IsNotEmpty()
  kubeconfig: string;
}

export class TriggerDeploymentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['AWS_EKS', 'AZURE_AKS', 'GCP_GKE', 'ON_PREMISES'])
  cloud_provider: string;
}
