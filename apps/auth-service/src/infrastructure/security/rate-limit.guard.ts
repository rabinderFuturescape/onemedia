import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RateLimiterService } from './rate-limiter.service';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimiterService: RateLimiterService,
    private readonly logger: LoggerService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    const endpoint = request.route.path;
    
    return this.rateLimiterService.checkRateLimit(ip, endpoint)
      .then(result => {
        if (!result.success) {
          this.logger.warn(
            `Rate limit exceeded for IP: ${ip}, endpoint: ${endpoint}. Remaining time: ${result.msBeforeNext}ms`,
            'RateLimitGuard',
          );
          
          throw new HttpException({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil(result.msBeforeNext / 1000),
          }, HttpStatus.TOO_MANY_REQUESTS);
        }
        
        return true;
      })
      .catch(err => {
        if (err instanceof HttpException) {
          throw err;
        }
        
        this.logger.error(
          `Error checking rate limit: ${err.message}`,
          err.stack,
          'RateLimitGuard',
        );
        
        // Allow the request in case of error with the rate limiter
        return true;
      });
  }

  private getClientIp(request: any): string {
    // Get IP from various headers or from the connection
    const ip = 
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.connection.socket?.remoteAddress ||
      '0.0.0.0';
    
    return ip;
  }
}
