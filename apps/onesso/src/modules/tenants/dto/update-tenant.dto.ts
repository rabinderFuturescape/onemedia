import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({
    description: 'Tenant display name',
    example: 'ACME Corporation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  displayName: string;
}
