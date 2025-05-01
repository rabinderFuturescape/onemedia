/**
 * Custom logger for the frontend
 * Provides consistent logging with different log levels
 * and integration with the logging service
 */

import { loggingService, LogLevel } from '@/services/logging.service';

// Log levels
type Level = 'debug' | 'info' | 'warn' | 'error';

// Logger interface
interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, error?: Error, ...args: any[]) => void;
}

/**
 * Create a logger with a specific context
 */
export function createLogger(context: string): Logger {
  return {
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[${context}] ${message}`, ...args);
      }
      loggingService.debug(message, args.length > 0 ? args : undefined, context);
    },
    
    info: (message: string, ...args: any[]) => {
      console.info(`[${context}] ${message}`, ...args);
      loggingService.info(message, args.length > 0 ? args : undefined, context);
    },
    
    warn: (message: string, ...args: any[]) => {
      console.warn(`[${context}] ${message}`, ...args);
      loggingService.warn(message, args.length > 0 ? args : undefined, context);
    },
    
    error: (message: string, error?: Error, ...args: any[]) => {
      console.error(`[${context}] ${message}`, error || '', ...args);
      loggingService.error(message, error, args.length > 0 ? args : undefined, context);
    },
  };
}

// Default logger
export const logger = createLogger('App');
