import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    // Mask sensitive data in request body
    const maskedBody = this.maskSensitiveData(body);

    this.logger.log(
      `Request: ${method} ${url} - Body: ${JSON.stringify(maskedBody)} - IP: ${ip} - User-Agent: ${userAgent}`,
      `${className}.${handlerName}`,
    );

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = this.maskSensitiveData(data);
          this.logger.log(
            `Response: ${method} ${url} - ${JSON.stringify(response)} - ${Date.now() - now}ms`,
            `${className}.${handlerName}`,
          );
        },
        error: (err) => {
          this.logger.error(
            `Error: ${method} ${url} - ${err.message}`,
            err.stack,
            `${className}.${handlerName}`,
          );
        },
      }),
    );
  }

  private maskSensitiveData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'jwt'];
    const masked = { ...data };
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }
    
    return masked;
  }
}
