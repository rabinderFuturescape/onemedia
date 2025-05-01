import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter for handling all exceptions
 * Provides standardized error responses and logging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    // Get correlation ID from request headers
    const correlationId = request.headers['x-correlation-id'] as string;
    
    // Determine HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Get error message
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
    
    // Get error details
    const details =
      exception instanceof HttpException
        ? exception.getResponse()
        : undefined;
    
    // Create error response
    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      ...(process.env.NODE_ENV !== 'production' && { details }),
    };
    
    // Log the error
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception.stack,
        'GlobalExceptionFilter'
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
        'GlobalExceptionFilter'
      );
    } else {
      this.logger.log(
        `${request.method} ${request.url} - ${status} - ${message}`,
        'GlobalExceptionFilter'
      );
    }
    
    // Send error response
    response.status(status).json(errorResponse);
  }
}
