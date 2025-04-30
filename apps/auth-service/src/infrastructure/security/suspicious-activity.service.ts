import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { RateLimiterService } from './rate-limiter.service';
import { PrismaService } from '../prisma/prisma.service';

interface ActivityLog {
  ip: string;
  endpoint: string;
  userId?: string;
  success: boolean;
  timestamp: number;
}

@Injectable()
export class SuspiciousActivityService implements OnModuleInit {
  private activityLogs: Map<string, ActivityLog[]> = new Map();
  private readonly MAX_LOGS_PER_IP = 100;
  private readonly FAILED_LOGIN_THRESHOLD = 5;
  private readonly FAILED_LOGIN_WINDOW = 10 * 60 * 1000; // 10 minutes
  private readonly BLOCK_DURATION = 30 * 60; // 30 minutes in seconds

  constructor(
    private readonly logger: LoggerService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Set up a periodic cleanup task
    setInterval(() => this.cleanupOldLogs(), 15 * 60 * 1000); // Every 15 minutes
    this.logger.log('Suspicious activity monitoring initialized', 'SuspiciousActivityService');
  }

  /**
   * Log an authentication activity
   * @param ip Client IP address
   * @param endpoint API endpoint
   * @param userId User ID (if available)
   * @param success Whether the authentication was successful
   */
  async logActivity(ip: string, endpoint: string, userId: string | undefined, success: boolean): Promise<void> {
    // Get or create activity log array for this IP
    if (!this.activityLogs.has(ip)) {
      this.activityLogs.set(ip, []);
    }
    
    const logs = this.activityLogs.get(ip);
    
    // Add new log
    logs.push({
      ip,
      endpoint,
      userId,
      success,
      timestamp: Date.now(),
    });
    
    // Limit the number of logs per IP
    if (logs.length > this.MAX_LOGS_PER_IP) {
      logs.shift(); // Remove oldest log
    }
    
    // Check for suspicious activity
    await this.checkForSuspiciousActivity(ip);
    
    // Log to database for long-term analysis
    try {
      await this.prisma.authLog.create({
        data: {
          ip,
          endpoint,
          userId,
          success,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error logging auth activity to database: ${error.message}`,
        error.stack,
        'SuspiciousActivityService',
      );
    }
  }

  /**
   * Check for suspicious activity patterns
   * @param ip IP address to check
   */
  private async checkForSuspiciousActivity(ip: string): Promise<void> {
    const logs = this.activityLogs.get(ip) || [];
    const now = Date.now();
    
    // Check for multiple failed login attempts
    const recentFailedLogins = logs.filter(log => 
      log.endpoint === '/api/auth/login' && 
      !log.success && 
      now - log.timestamp < this.FAILED_LOGIN_WINDOW
    );
    
    if (recentFailedLogins.length >= this.FAILED_LOGIN_THRESHOLD) {
      this.logger.warn(
        `Suspicious activity detected: ${recentFailedLogins.length} failed login attempts from IP ${ip} in the last ${this.FAILED_LOGIN_WINDOW / 60000} minutes`,
        'SuspiciousActivityService',
      );
      
      // Block the IP
      await this.rateLimiterService.blockIp(ip, this.BLOCK_DURATION);
      
      // Log the blocking event
      try {
        await this.prisma.securityEvent.create({
          data: {
            ip,
            eventType: 'IP_BLOCKED',
            reason: `${recentFailedLogins.length} failed login attempts in ${this.FAILED_LOGIN_WINDOW / 60000} minutes`,
            timestamp: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(
          `Error logging security event to database: ${error.message}`,
          error.stack,
          'SuspiciousActivityService',
        );
      }
    }
    
    // Additional checks could be added here:
    // - Multiple password reset attempts
    // - Access attempts from unusual locations
    // - Rapid account switching
    // - etc.
  }

  /**
   * Clean up old activity logs
   */
  private cleanupOldLogs(): void {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
    
    let cleanedCount = 0;
    
    for (const [ip, logs] of this.activityLogs.entries()) {
      const filteredLogs = logs.filter(log => log.timestamp >= cutoff);
      cleanedCount += logs.length - filteredLogs.length;
      
      if (filteredLogs.length === 0) {
        this.activityLogs.delete(ip);
      } else {
        this.activityLogs.set(ip, filteredLogs);
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old activity logs`, 'SuspiciousActivityService');
    }
  }
}
