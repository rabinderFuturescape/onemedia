import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const { combine, timestamp, printf, colorize } = winston.format;

    // Custom log format
    const logFormat = printf(({ level, message, timestamp, context, trace }) => {
      return `${timestamp} [${context || 'Application'}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
    });

    // Transport for console logs
    const consoleTransport = new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat,
      ),
    });

    // Transport for file logs (daily rotation)
    const fileTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/auth-service-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp(),
        logFormat,
      ),
    });

    // Create logger with transports
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [
        consoleTransport,
        ...(process.env.NODE_ENV === 'production' ? [fileTransport] : []),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
