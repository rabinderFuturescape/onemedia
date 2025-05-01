/**
 * Error Handling Service
 *
 * This service provides centralized error handling for the application.
 * It includes error categorization, standardized error responses, and
 * integration with monitoring services.
 */

import { signOut } from 'next-auth/react';

// Define error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

// Define error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Define standardized error response
export interface ErrorResponse {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  details?: any;
  timestamp: number;
  path?: string;
}

export class ErrorService {
  private static instance: ErrorService;
  private errorListeners: Array<(error: ErrorResponse) => void> = [];

  // Singleton pattern
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Handle API errors with standardized responses
   */
  handleApiError(error: any, path?: string): ErrorResponse {
    const response = error.response;
    const status = response?.status;

    // Create base error response
    const errorResponse: ErrorResponse = {
      message: error.message || 'An unexpected error occurred',
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      timestamp: Date.now(),
      path,
    };

    // Categorize error based on status code
    if (status) {
      if (status === 401) {
        errorResponse.category = ErrorCategory.AUTHENTICATION;
        errorResponse.message = 'Authentication failed';
        errorResponse.code = 'AUTH_ERROR';

        // Handle session expiration
        if (response?.data?.code === 'token_expired') {
          errorResponse.message = 'Your session has expired. Please sign in again.';
          errorResponse.code = 'SESSION_EXPIRED';

          // Sign out the user
          signOut({ callbackUrl: '/auth/login?error=session_expired' });
        }
      } else if (status === 403) {
        errorResponse.category = ErrorCategory.AUTHORIZATION;
        errorResponse.message = 'You do not have permission to perform this action';
        errorResponse.code = 'FORBIDDEN';
      } else if (status === 400 || status === 422) {
        errorResponse.category = ErrorCategory.VALIDATION;
        errorResponse.severity = ErrorSeverity.WARNING;
        errorResponse.message = response?.data?.message || 'Invalid request';
        errorResponse.details = response?.data?.errors;
        errorResponse.code = 'VALIDATION_ERROR';
      } else if (status >= 500) {
        errorResponse.category = ErrorCategory.SERVER;
        errorResponse.severity = ErrorSeverity.CRITICAL;
        errorResponse.message = 'Server error occurred';
        errorResponse.code = 'SERVER_ERROR';
      } else if (status === 429) {
        errorResponse.category = ErrorCategory.SERVER;
        errorResponse.severity = ErrorSeverity.WARNING;
        errorResponse.message = 'Too many requests. Please try again later.';
        errorResponse.code = 'RATE_LIMIT_EXCEEDED';
      }
    } else if (error.request) {
      // Network error (no response received)
      errorResponse.category = ErrorCategory.NETWORK;
      errorResponse.message = 'Network error. Please check your connection.';
      errorResponse.code = 'NETWORK_ERROR';
    }

    // Log the error
    this.logError(errorResponse);

    // Notify listeners
    this.notifyErrorListeners(errorResponse);

    return errorResponse;
  }

  /**
   * Log error to console and monitoring services
   */
  private logError(error: ErrorResponse): void {
    // Import services dynamically to avoid circular dependencies
    import('./logging.service').then(({ loggingService, LogLevel }) => {
      // Log using the logging service
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.ERROR:
          loggingService.error(error.message, new Error(error.message), error, error.category);
          break;
        case ErrorSeverity.WARNING:
          loggingService.warn(error.message, error, error.category);
          break;
        default:
          loggingService.info(error.message, error, error.category);
      }
    }).catch(e => {
      // Fallback to console logging if import fails
      if (error.severity === ErrorSeverity.CRITICAL) {
        console.error(`[${error.category.toUpperCase()}] ${error.message}`, error);
      } else if (error.severity === ErrorSeverity.ERROR) {
        console.error(`[${error.category}] ${error.message}`, error);
      } else if (error.severity === ErrorSeverity.WARNING) {
        console.warn(`[${error.category}] ${error.message}`, error);
      } else {
        console.info(`[${error.category}] ${error.message}`, error);
      }
    });

    // Send to monitoring service
    import('./monitoring.service').then(({ monitoringService }) => {
      monitoringService.trackError(error);
    }).catch(e => {
      console.error('Failed to send error to monitoring service:', e);
    });
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: ErrorResponse) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: ErrorResponse) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * Notify all error listeners
   */
  private notifyErrorListeners(error: ErrorResponse): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener', e);
      }
    });
  }
}

// Create a singleton instance
export const errorService = ErrorService.getInstance();

/**
 * Wrapper for API calls with standardized error handling
 */
export async function apiCall<T>(
  fn: () => Promise<T>,
  path?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    errorService.handleApiError(error, path);
    throw error;
  }
}

/**
 * Global error handler for API requests with custom error handling
 * Returns a standardized response object instead of throwing
 */
export async function apiErrorHandler<T = any, E = any>(
  fn: () => Promise<T>,
  errorHandler?: (error: any) => E
): Promise<{ data?: T; error?: E | ErrorResponse }> {
  try {
    const result = await fn();
    return { data: result };
  } catch (error) {
    // Log and handle the error
    const errorResponse = errorService.handleApiError(error);

    // Custom error handling if provided
    if (errorHandler) {
      try {
        const customError = errorHandler(error);
        return { error: customError };
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
        // Fall back to default error handling
      }
    }

    return { error: errorResponse };
  }
}

/**
 * Create a typed API error handler for specific data types
 */
export function createTypedErrorHandler<T = any, E = any>() {
  return (fn: () => Promise<T>, errorHandler?: (error: any) => E) =>
    apiErrorHandler<T, E>(fn, errorHandler);
}
