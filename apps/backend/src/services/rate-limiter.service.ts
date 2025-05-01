import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Rate limit configuration by tier
 */
interface RateLimitTier {
  limit: number;
  ttl: number;
}

/**
 * Enhanced rate limiter service with tiered rate limiting
 */
@Injectable()
export class RateLimiterService extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimiterService.name);
  
  // Rate limit tiers
  private readonly tiers: Record<string, RateLimitTier> = {
    FREE: { limit: 100, ttl: 60 }, // 100 requests per minute
    STANDARD: { limit: 300, ttl: 60 }, // 300 requests per minute
    PRO: { limit: 600, ttl: 60 }, // 600 requests per minute
    ULTIMATE: { limit: 1200, ttl: 60 }, // 1200 requests per minute
    TEAM: { limit: 2000, ttl: 60 }, // 2000 requests per minute
  };
  
  // IP-based rate limits (more restrictive)
  private readonly ipLimits: RateLimitTier = { limit: 60, ttl: 60 }; // 60 requests per minute
  
  // Track consecutive violations for gradual backoff
  private readonly violations = new Map<string, { count: number; lastViolation: number }>();
  
  /**
   * Get throttler options based on user tier and IP
   */
  getThrottlerOptions(context: ExecutionContext): ThrottlerModuleOptions {
    const request = this.getRequest(context);
    const tier = this.getUserTier(request);
    const key = this.generateKey(context);
    
    // Get rate limit based on tier
    const tierLimit = this.tiers[tier] || this.tiers.FREE;
    
    // Apply backoff multiplier for repeated violations
    const backoffMultiplier = this.getBackoffMultiplier(key);
    
    // Calculate adjusted limits
    const limit = Math.floor(tierLimit.limit / backoffMultiplier);
    const ttl = Math.floor(tierLimit.ttl * backoffMultiplier);
    
    this.logger.debug(`Rate limit for ${key} (${tier}): ${limit} requests per ${ttl} seconds (backoff: ${backoffMultiplier}x)`);
    
    return {
      limit,
      ttl,
    };
  }
  
  /**
   * Handle rate limit exceeded
   */
  async handleRateLimit(context: ExecutionContext, next: () => Promise<any>): Promise<any> {
    const key = this.generateKey(context);
    
    // Record violation
    this.recordViolation(key);
    
    // Log the rate limit violation
    const request = this.getRequest(context);
    this.logger.warn(`Rate limit exceeded for ${key} (IP: ${this.getIp(request)})`);
    
    // Call parent implementation
    return super.handleRateLimit(context, next);
  }
  
  /**
   * Get the user's subscription tier
   */
  private getUserTier(request: Request): string {
    // Get user from request (implementation depends on your auth setup)
    const user = (request as any).user;
    
    // Return the user's tier or default to FREE
    return user?.tier || 'FREE';
  }
  
  /**
   * Record a rate limit violation for gradual backoff
   */
  private recordViolation(key: string): void {
    const now = Date.now();
    const violation = this.violations.get(key) || { count: 0, lastViolation: 0 };
    
    // Reset count if last violation was more than 1 hour ago
    if (now - violation.lastViolation > 60 * 60 * 1000) {
      violation.count = 0;
    }
    
    // Increment violation count
    violation.count += 1;
    violation.lastViolation = now;
    
    this.violations.set(key, violation);
  }
  
  /**
   * Get backoff multiplier based on violation history
   */
  private getBackoffMultiplier(key: string): number {
    const violation = this.violations.get(key);
    
    if (!violation) {
      return 1;
    }
    
    // Calculate backoff multiplier based on violation count
    // 1x for first violation, 2x for second, 4x for third, etc. (exponential backoff)
    return Math.min(Math.pow(2, violation.count - 1), 16);
  }
  
  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(context: ExecutionContext): string {
    const request = this.getRequest(context);
    const user = (request as any).user;
    
    // Use user ID if available, otherwise use IP
    return user?.id ? `user:${user.id}` : `ip:${this.getIp(request)}`;
  }
  
  /**
   * Get client IP address
   */
  private getIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.connection.remoteAddress ||
      'unknown'
    );
  }
}
