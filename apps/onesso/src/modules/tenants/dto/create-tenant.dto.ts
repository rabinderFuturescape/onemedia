import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name (used as identifier)',
    example: 'acme-corp',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tenant name is required' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Tenant name can only contain lowercase letters, numbers, and hyphens',
  })
  name: string;

  @ApiProperty({
    description: 'Tenant display name',
    example: 'ACME Corporation',
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}
