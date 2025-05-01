import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor for logging controller method execution
 * Logs method calls, parameters, and execution time
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    
    // Get correlation ID from request headers
    const correlationId = request.headers['x-correlation-id'] as string;
    
    // Get controller and handler names
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    
    // Mask sensitive data in request body
    const maskedBody = this.maskSensitiveData(request.body);
    
    // Log method call
    this.logger.log(
      `${controllerName}.${handlerName} - Request: ${JSON.stringify(maskedBody)} - CorrelationID: ${correlationId}`
    );
    
    // Process the request and log the response
    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now;
          
          // Mask sensitive data in response
          const maskedResponse = this.maskSensitiveData(data);
          
          // Log successful response
          this.logger.log(
            `${controllerName}.${handlerName} - Response: ${JSON.stringify(maskedResponse)} - ${duration}ms - CorrelationID: ${correlationId}`
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          
          // Log error response
          this.logger.error(
            `${controllerName}.${handlerName} - Error: ${error.message} - ${duration}ms - CorrelationID: ${correlationId}`,
            error.stack
          );
        },
      })
    );
  }

  /**
   * Mask sensitive data in objects
   */
  private maskSensitiveData(data: any): any {
    if (!data) return data;
    
    // Clone the data to avoid modifying the original
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // List of sensitive fields to mask
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'authorization',
      'credit_card',
      'cardNumber',
      'cvv',
    ];
    
    // Recursively mask sensitive fields
    const maskRecursively = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '***MASKED***';
        } else if (typeof obj[key] === 'object') {
          maskRecursively(obj[key]);
        }
      });
    };
    
    maskRecursively(clonedData);
    return clonedData;
  }
}
