import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import * as crypto from 'crypto';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

@Injectable()
export class MfaService {
  constructor(
    private readonly logger: LoggerService,
    private readonly userRepository: UserRepository,
  ) {
    // Configure authenticator
    authenticator.options = {
      window: 1, // Allow 1 step before and after current step
    };
  }

  /**
   * Generate a new MFA secret for a user
   * @param userId User ID
   * @param email User email
   * @returns Object containing secret and QR code data URL
   */
  async generateMfaSecret(userId: string, email: string): Promise<{ secret: string; qrCodeUrl: string }> {
    try {
      // Generate a new secret
      const secret = authenticator.generateSecret();
      
      // Generate QR code
      const serviceName = process.env.MFA_SERVICE_NAME || 'GitroomAuth';
      const otpauth = authenticator.keyuri(email, serviceName, secret);
      const qrCodeUrl = await toDataURL(otpauth);
      
      this.logger.log(`Generated MFA secret for user ${userId}`, 'MfaService');
      
      return { secret, qrCodeUrl };
    } catch (error) {
      this.logger.error(
        `Error generating MFA secret: ${error.message}`,
        error.stack,
        'MfaService',
      );
      throw error;
    }
  }

  /**
   * Verify a TOTP token against a user's secret
   * @param token TOTP token
   * @param secret User's MFA secret
   * @returns Boolean indicating if token is valid
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      this.logger.error(
        `Error verifying MFA token: ${error.message}`,
        error.stack,
        'MfaService',
      );
      return false;
    }
  }

  /**
   * Enable MFA for a user
   * @param userId User ID
   * @param secret MFA secret
   * @returns Array of backup codes
   */
  async enableMfa(userId: string, secret: string): Promise<string[]> {
    try {
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Update user in database
      await this.userRepository.update(userId, {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: backupCodes,
      });
      
      this.logger.log(`Enabled MFA for user ${userId}`, 'MfaService');
      
      return backupCodes;
    } catch (error) {
      this.logger.error(
        `Error enabling MFA: ${error.message}`,
        error.stack,
        'MfaService',
      );
      throw error;
    }
  }

  /**
   * Disable MFA for a user
   * @param userId User ID
   */
  async disableMfa(userId: string): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      });
      
      this.logger.log(`Disabled MFA for user ${userId}`, 'MfaService');
    } catch (error) {
      this.logger.error(
        `Error disabling MFA: ${error.message}`,
        error.stack,
        'MfaService',
      );
      throw error;
    }
  }

  /**
   * Verify a backup code
   * @param userId User ID
   * @param code Backup code
   * @returns Boolean indicating if code is valid
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user || !user.mfaEnabled || !user.mfaBackupCodes) {
        return false;
      }
      
      const backupCodes = user.mfaBackupCodes;
      const codeIndex = backupCodes.indexOf(code);
      
      if (codeIndex === -1) {
        return false;
      }
      
      // Remove the used backup code
      backupCodes.splice(codeIndex, 1);
      
      // Update user in database
      await this.userRepository.update(userId, {
        mfaBackupCodes: backupCodes,
      });
      
      this.logger.log(`Used backup code for user ${userId}`, 'MfaService');
      
      return true;
    } catch (error) {
      this.logger.error(
        `Error verifying backup code: ${error.message}`,
        error.stack,
        'MfaService',
      );
      return false;
    }
  }

  /**
   * Generate new backup codes for a user
   * @returns Array of backup codes
   */
  private generateBackupCodes(): string[] {
    const codes = [];
    
    for (let i = 0; i < 10; i++) {
      // Generate a random 8-character code
      const code = crypto.randomBytes(4).toString('hex');
      codes.push(code);
    }
    
    return codes;
  }
}
