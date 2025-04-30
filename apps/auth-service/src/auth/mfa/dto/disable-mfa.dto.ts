import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisableMfaDto {
  @ApiProperty({
    description: 'MFA token from authenticator app',
    example: '123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(6, 6)
  token?: string;

  @ApiProperty({
    description: 'Backup code',
    example: 'a1b2c3d4',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(8, 8)
  backupCode?: string;
}
