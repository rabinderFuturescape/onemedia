/**
 * Structured Logging Service
 * 
 * This service provides structured logging with JSON format,
 * request correlation IDs for tracing, and integration with
 * log aggregation services.
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  correlationId?: string;
  userId?: string;
  data?: any;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}

export class LoggingService {
  private static instance: LoggingService;
  private correlationId: string = '';
  private userId: string = '';
  private enabled: boolean = true;
  private minLevel: LogLevel = LogLevel.INFO;
  private logHandlers: Array<(entry: LogEntry) => void> = [];

  // Singleton pattern
  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Initialize the logging service
   */
  initialize(options: {
    enabled?: boolean;
    minLevel?: LogLevel;
    correlationId?: string;
    userId?: string;
  } = {}): void {
    this.enabled = options.enabled ?? true;
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.correlationId = options.correlationId ?? this.generateCorrelationId();
    this.userId = options.userId ?? '';

    // Add console handler by default
    this.addHandler(this.consoleHandler);
  }

  /**
   * Set the correlation ID for request tracing
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Set the user ID for user-specific logging
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Add a log handler
   */
  addHandler(handler: (entry: LogEntry) => void): void {
    this.logHandlers.push(handler);
  }

  /**
   * Remove a log handler
   */
  removeHandler(handler: (entry: LogEntry) => void): void {
    this.logHandlers = this.logHandlers.filter(h => h !== handler);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, data?: any, context?: string): void {
    const errorData = error
      ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        }
      : undefined;

    this.log(LogLevel.ERROR, message, data, context, errorData);
  }

  /**
   * Log a message with the specified level
   */
  private log(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string,
    error?: {
      message: string;
      name: string;
      stack?: string;
    }
  ): void {
    // Skip logging if disabled or below minimum level
    if (!this.enabled || !this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      correlationId: this.correlationId,
      userId: this.userId,
      data,
      error,
    };

    // Process the log entry through all handlers
    this.logHandlers.forEach(handler => {
      try {
        handler(entry);
      } catch (e) {
        console.error('Error in log handler:', e);
      }
    });
  }

  /**
   * Check if the log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Generate a unique correlation ID
   */
  private generateCorrelationId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Default console handler
   */
  private consoleHandler = (entry: LogEntry): void => {
    const { level, message, context, correlationId, data, error } = entry;
    
    // Format the log message
    const formattedMessage = [
      `[${level.toUpperCase()}]`,
      context ? `[${context}]` : '',
      message,
      correlationId ? `(correlationId: ${correlationId})` : '',
    ].filter(Boolean).join(' ');

    // Log to console based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '', error || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '', error || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '', error || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '', error || '');
        break;
    }
  };
}

// Create a singleton instance
export const loggingService = LoggingService.getInstance();

// Initialize with default settings
loggingService.initialize({
  enabled: true,
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
});
