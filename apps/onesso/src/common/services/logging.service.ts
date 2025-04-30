import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingService implements LoggerService {
  private context: string;
  private logLevels: { [key: string]: number } = {
    error: 0,
    warn: 1,
    log: 2,
    debug: 3,
    verbose: 4,
  };
  private currentLogLevel: number;

  constructor(private configService: ConfigService) {
    this.context = 'onesso';
    const configuredLevel = this.configService.get<string>('LOG_LEVEL') || 'info';
    this.currentLogLevel = this.logLevels[configuredLevel] || 2;
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  error(message: any, trace?: string, context?: string) {
    if (this.currentLogLevel >= this.logLevels.error) {
      console.error(`[${context || this.context}] ERROR: ${message}`, trace || '');
    }
  }

  warn(message: any, context?: string) {
    if (this.currentLogLevel >= this.logLevels.warn) {
      console.warn(`[${context || this.context}] WARN: ${message}`);
    }
  }

  log(message: any, context?: string) {
    if (this.currentLogLevel >= this.logLevels.log) {
      console.log(`[${context || this.context}] INFO: ${message}`);
    }
  }

  debug(message: any, context?: string) {
    if (this.currentLogLevel >= this.logLevels.debug) {
      console.debug(`[${context || this.context}] DEBUG: ${message}`);
    }
  }

  verbose(message: any, context?: string) {
    if (this.currentLogLevel >= this.logLevels.verbose) {
      console.log(`[${context || this.context}] VERBOSE: ${message}`);
    }
  }

  logAuthEvent(userId: string, event: string, success: boolean, details?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      event,
      success,
      details,
    };

    if (success) {
      this.log(`Auth event: ${event} for user ${userId} - Success`, 'AuthEvents');
    } else {
      this.warn(`Auth event: ${event} for user ${userId} - Failed`, 'AuthEvents');
    }

    // In a production environment, you might want to store these logs in a database or send them to a logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement production logging
    }
  }
}
