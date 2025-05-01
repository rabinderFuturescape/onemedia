import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsUUID,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new organization
 */
export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corporation',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Organization website',
    example: 'https://acme.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL format' })
  @MaxLength(2048, { message: 'URL must be less than 2048 characters' })
  website?: string;
}

/**
 * DTO for updating an organization
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Organization website',
    example: 'https://acme.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL format' })
  @MaxLength(2048, { message: 'URL must be less than 2048 characters' })
  website?: string;
}

/**
 * DTO for inviting a user to an organization
 */
export class InviteUserDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Invalid organization ID format' })
  organizationId: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description: 'User role in the organization',
    enum: ['USER', 'ADMIN'],
    default: 'USER',
  })
  @IsEnum(['USER', 'ADMIN'], {
    message: 'Role must be one of: USER, ADMIN',
  })
  role: 'USER' | 'ADMIN';
}
