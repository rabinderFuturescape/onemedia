import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

interface RateLimitResult {
  success: boolean;
  msBeforeNext?: number;
  remainingPoints?: number;
}

@Injectable()
export class RateLimiterService implements OnModuleInit {
  private rateLimiters: Map<string, RateLimiterMemory> = new Map();
  
  // Default rate limit configurations
  private readonly defaultLimits = {
    // Login endpoint: 5 attempts per minute
    '/api/auth/login': {
      points: 5,
      duration: 60,
    },
    // Register endpoint: 3 attempts per minute
    '/api/auth/register': {
      points: 3,
      duration: 60,
    },
    // Forgot password endpoint: 3 attempts per minute
    '/api/auth/forgot-password': {
      points: 3,
      duration: 60,
    },
    // Reset password endpoint: 3 attempts per 5 minutes
    '/api/auth/reset-password': {
      points: 3,
      duration: 300,
    },
    // Wallet challenge endpoint: 10 attempts per minute
    '/api/auth/wallet/challenge': {
      points: 10,
      duration: 60,
    },
    // Wallet verify endpoint: 5 attempts per minute
    '/api/auth/wallet/verify': {
      points: 5,
      duration: 60,
    },
    // Default: 60 requests per minute
    'default': {
      points: 60,
      duration: 60,
    },
  };

  constructor(private readonly logger: LoggerService) {}

  onModuleInit() {
    // Initialize rate limiters for each endpoint
    for (const [endpoint, config] of Object.entries(this.defaultLimits)) {
      this.rateLimiters.set(endpoint, new RateLimiterMemory({
        points: config.points,
        duration: config.duration,
      }));
    }
    
    this.logger.log('Rate limiters initialized', 'RateLimiterService');
  }

  /**
   * Check if a request should be rate limited
   * @param ip Client IP address
   * @param endpoint API endpoint
   * @returns Promise with rate limit result
   */
  async checkRateLimit(ip: string, endpoint: string): Promise<RateLimitResult> {
    // Get the appropriate rate limiter for this endpoint
    const rateLimiter = this.rateLimiters.get(endpoint) || this.rateLimiters.get('default');
    
    try {
      // Consume a point from the rate limiter
      const rateLimiterRes = await rateLimiter.consume(ip);
      
      return {
        success: true,
        remainingPoints: rateLimiterRes.remainingPoints,
      };
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        // Rate limit exceeded
        return {
          success: false,
          msBeforeNext: error.msBeforeNext,
        };
      }
      
      // Unexpected error
      this.logger.error(
        `Error in rate limiter: ${error.message}`,
        error.stack,
        'RateLimiterService',
      );
      
      // Allow the request in case of error
      return { success: true };
    }
  }

  /**
   * Block an IP address for a specified duration
   * @param ip IP address to block
   * @param duration Duration in seconds
   */
  async blockIp(ip: string, duration: number = 3600): Promise<void> {
    try {
      // Create a special rate limiter for blocked IPs if it doesn't exist
      if (!this.rateLimiters.has('blocked')) {
        this.rateLimiters.set('blocked', new RateLimiterMemory({
          points: 0, // No points allowed
          duration: 24 * 60 * 60, // 24 hours
        }));
      }
      
      const blockedLimiter = this.rateLimiters.get('blocked');
      
      // Block the IP by consuming all points (which is 0)
      await blockedLimiter.block(ip, duration);
      
      this.logger.warn(`Blocked IP ${ip} for ${duration} seconds`, 'RateLimiterService');
    } catch (error) {
      this.logger.error(
        `Error blocking IP ${ip}: ${error.message}`,
        error.stack,
        'RateLimiterService',
      );
    }
  }

  /**
   * Check if an IP is blocked
   * @param ip IP address to check
   * @returns Promise with boolean indicating if IP is blocked
   */
  async isIpBlocked(ip: string): Promise<boolean> {
    if (!this.rateLimiters.has('blocked')) {
      return false;
    }
    
    try {
      await this.rateLimiters.get('blocked').consume(ip, 0);
      return false; // Not blocked
    } catch (error) {
      return true; // Blocked
    }
  }
}
