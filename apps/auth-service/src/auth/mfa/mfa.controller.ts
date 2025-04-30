import { Controller, Post, Body, UseGuards, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GenerateMfaDto } from './dto/generate-mfa.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';
import { VerifyBackupCodeDto } from './dto/verify-backup-code.dto';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

@ApiTags('Multi-Factor Authentication')
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly logger: LoggerService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate MFA secret and QR code' })
  @ApiResponse({ status: 201, description: 'MFA secret generated successfully' })
  async generateMfa(@Req() req, @Body() generateMfaDto: GenerateMfaDto) {
    try {
      const userId = req.user.id;
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Check if MFA is already enabled
      if (user.mfaEnabled) {
        throw new BadRequestException('MFA is already enabled for this user');
      }
      
      const { secret, qrCodeUrl } = await this.mfaService.generateMfaSecret(userId, user.email);
      
      return {
        secret,
        qrCodeUrl,
      };
    } catch (error) {
      this.logger.error(
        `Error generating MFA: ${error.message}`,
        error.stack,
        'MfaController',
      );
      throw error;
    }
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA token and enable MFA' })
  @ApiResponse({ status: 201, description: 'MFA enabled successfully' })
  async verifyAndEnableMfa(@Req() req, @Body() verifyMfaDto: VerifyMfaDto) {
    try {
      const userId = req.user.id;
      const { token, secret } = verifyMfaDto;
      
      // Verify the token
      const isValid = this.mfaService.verifyToken(token, secret);
      
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }
      
      // Enable MFA for the user
      const backupCodes = await this.mfaService.enableMfa(userId, secret);
      
      return {
        enabled: true,
        backupCodes,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying MFA: ${error.message}`,
        error.stack,
        'MfaController',
      );
      throw error;
    }
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 201, description: 'MFA disabled successfully' })
  async disableMfa(@Req() req, @Body() disableMfaDto: DisableMfaDto) {
    try {
      const userId = req.user.id;
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Check if MFA is enabled
      if (!user.mfaEnabled) {
        throw new BadRequestException('MFA is not enabled for this user');
      }
      
      // Verify the token or backup code
      let isValid = false;
      
      if (disableMfaDto.token) {
        isValid = this.mfaService.verifyToken(disableMfaDto.token, user.mfaSecret);
      } else if (disableMfaDto.backupCode) {
        isValid = await this.mfaService.verifyBackupCode(userId, disableMfaDto.backupCode);
      } else {
        throw new BadRequestException('Either token or backup code is required');
      }
      
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA token or backup code');
      }
      
      // Disable MFA for the user
      await this.mfaService.disableMfa(userId);
      
      return {
        disabled: true,
      };
    } catch (error) {
      this.logger.error(
        `Error disabling MFA: ${error.message}`,
        error.stack,
        'MfaController',
      );
      throw error;
    }
  }

  @Post('verify-backup')
  @ApiOperation({ summary: 'Verify backup code during login' })
  @ApiResponse({ status: 201, description: 'Backup code verified successfully' })
  async verifyBackupCode(@Body() verifyBackupCodeDto: VerifyBackupCodeDto) {
    try {
      const { userId, backupCode } = verifyBackupCodeDto;
      
      // Verify the backup code
      const isValid = await this.mfaService.verifyBackupCode(userId, backupCode);
      
      if (!isValid) {
        throw new UnauthorizedException('Invalid backup code');
      }
      
      return {
        verified: true,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying backup code: ${error.message}`,
        error.stack,
        'MfaController',
      );
      throw error;
    }
  }
}
