import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private challenges: Map<string, { challenge: string; timestamp: number }> = new Map();
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private readonly logger: LoggerService) {}

  /**
   * Generate a challenge for the wallet to sign
   * @param address Wallet address
   * @returns Challenge string
   */
  generateChallenge(address: string): string {
    this.logger.log(`Generating challenge for wallet: ${address}`, 'WalletService');
    
    // Generate a random challenge
    const challenge = `Sign this message to authenticate with our service: ${crypto.randomBytes(32).toString('hex')}`;
    
    // Store the challenge with a timestamp
    this.challenges.set(address.toLowerCase(), {
      challenge,
      timestamp: Date.now(),
    });
    
    return challenge;
  }

  /**
   * Verify a signed challenge
   * @param address Wallet address
   * @param signature Signed challenge
   * @returns Boolean indicating if the signature is valid
   */
  verifySignature(address: string, signature: string): boolean {
    const lowerCaseAddress = address.toLowerCase();
    this.logger.log(`Verifying signature for wallet: ${lowerCaseAddress}`, 'WalletService');
    
    // Get the challenge for this address
    const challengeData = this.challenges.get(lowerCaseAddress);
    
    if (!challengeData) {
      this.logger.warn(`No challenge found for wallet: ${lowerCaseAddress}`, 'WalletService');
      return false;
    }
    
    // Check if the challenge has expired
    if (Date.now() - challengeData.timestamp > this.CHALLENGE_EXPIRY) {
      this.logger.warn(`Challenge expired for wallet: ${lowerCaseAddress}`, 'WalletService');
      this.challenges.delete(lowerCaseAddress);
      return false;
    }
    
    try {
      // Recover the address from the signature
      const signerAddress = ethers.verifyMessage(challengeData.challenge, signature);
      
      // Clean up the challenge
      this.challenges.delete(lowerCaseAddress);
      
      // Check if the recovered address matches the provided address
      const isValid = signerAddress.toLowerCase() === lowerCaseAddress;
      
      if (isValid) {
        this.logger.log(`Signature verified for wallet: ${lowerCaseAddress}`, 'WalletService');
      } else {
        this.logger.warn(`Invalid signature for wallet: ${lowerCaseAddress}`, 'WalletService');
      }
      
      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`, error.stack, 'WalletService');
      return false;
    }
  }

  /**
   * Clean up expired challenges
   */
  cleanupExpiredChallenges(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [address, data] of this.challenges.entries()) {
      if (now - data.timestamp > this.CHALLENGE_EXPIRY) {
        this.challenges.delete(address);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.log(`Cleaned up ${expiredCount} expired challenges`, 'WalletService');
    }
  }
}
