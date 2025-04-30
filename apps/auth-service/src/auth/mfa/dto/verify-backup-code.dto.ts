import { IsString, IsNotEmpty, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyBackupCodeDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Backup code',
    example: 'a1b2c3d4',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  backupCode: string;
}
