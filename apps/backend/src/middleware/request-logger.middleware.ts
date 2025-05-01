import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware for logging HTTP requests and responses
 * Adds correlation IDs for request tracing
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Generate a correlation ID if not present
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    
    // Add correlation ID to request and response headers
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    
    // Get request details
    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] || '';
    
    // Log the request
    this.logger.log(
      `Request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent} - CorrelationID: ${correlationId}`
    );
    
    // Get start time
    const startTime = Date.now();
    
    // Add response listener
    res.on('finish', () => {
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Get response details
      const { statusCode } = res;
      const contentLength = res.getHeader('content-length') || 0;
      
      // Determine log level based on status code
      if (statusCode >= 500) {
        this.logger.error(
          `Response: ${statusCode} - ${method} ${originalUrl} - ${duration}ms - ${contentLength} bytes - CorrelationID: ${correlationId}`
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `Response: ${statusCode} - ${method} ${originalUrl} - ${duration}ms - ${contentLength} bytes - CorrelationID: ${correlationId}`
        );
      } else {
        this.logger.log(
          `Response: ${statusCode} - ${method} ${originalUrl} - ${duration}ms - ${contentLength} bytes - CorrelationID: ${correlationId}`
        );
      }
    });
    
    // Continue with the request
    next();
  }
}
