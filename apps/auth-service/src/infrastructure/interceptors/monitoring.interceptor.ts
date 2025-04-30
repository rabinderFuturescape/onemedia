import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    
    // Skip monitoring for metrics endpoint to avoid circular references
    if (url === '/api/metrics') {
      return next.handle();
    }
    
    // Record authentication attempts
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      const provider = req.body.provider || 'LOCAL';
      this.monitoringService.recordAuthAttempt(provider);
    }
    
    // Record token validations
    if (url === '/api/auth/me') {
      this.monitoringService.recordTokenValidation('valid'); // Will be updated if invalid
    }
    
    const start = Date.now();
    
    return next.handle().pipe(
      tap((data) => {
        const res = context.switchToHttp().getResponse();
        const statusCode = res.statusCode;
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        
        // Record request duration
        this.monitoringService.recordRequestDuration(method, url, statusCode, duration);
        
        // Record authentication success
        if (url.includes('/auth/login') || url.includes('/auth/register')) {
          const provider = req.body.provider || 'LOCAL';
          if (statusCode < 400) {
            this.monitoringService.recordAuthSuccess(provider);
          }
        }
      }),
      catchError((err) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        
        // Record request duration and error
        this.monitoringService.recordRequestDuration(method, url, statusCode, duration);
        this.monitoringService.recordRequestError(method, url, statusCode);
        
        // Record authentication failure
        if (url.includes('/auth/login') || url.includes('/auth/register')) {
          const provider = req.body.provider || 'LOCAL';
          const reason = err.message || 'Unknown error';
          this.monitoringService.recordAuthFailure(provider, reason);
        }
        
        // Record token validation failure
        if (url === '/api/auth/me') {
          this.monitoringService.recordTokenValidation('invalid');
        }
        
        throw err;
      }),
    );
  }
}
