/**
 * Monitoring Service
 * 
 * This service provides integration with error monitoring services
 * like Sentry, performance monitoring, and real-time alerts for
 * critical errors.
 */

import { loggingService, LogLevel } from './logging.service';
import { ErrorResponse, ErrorCategory, ErrorSeverity } from './error.service';

// Performance metric types
export enum MetricType {
  PAGE_LOAD = 'page_load',
  API_REQUEST = 'api_request',
  RENDER_TIME = 'render_time',
  RESOURCE_LOAD = 'resource_load',
  USER_INTERACTION = 'user_interaction',
}

// Performance metric interface
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private initialized: boolean = false;
  private sentryEnabled: boolean = false;
  private performanceEnabled: boolean = false;
  private alertsEnabled: boolean = false;
  private alertHandlers: Array<(error: ErrorResponse) => void> = [];

  // Singleton pattern
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize the monitoring service
   */
  initialize(options: {
    sentryEnabled?: boolean;
    sentryDsn?: string;
    performanceEnabled?: boolean;
    alertsEnabled?: boolean;
  } = {}): void {
    if (this.initialized) {
      return;
    }

    this.sentryEnabled = options.sentryEnabled ?? false;
    this.performanceEnabled = options.performanceEnabled ?? false;
    this.alertsEnabled = options.alertsEnabled ?? false;

    // Initialize Sentry if enabled
    if (this.sentryEnabled && options.sentryDsn) {
      this.initializeSentry(options.sentryDsn);
    }

    // Initialize performance monitoring if enabled
    if (this.performanceEnabled) {
      this.initializePerformanceMonitoring();
    }

    this.initialized = true;
    loggingService.info('Monitoring service initialized', {
      sentryEnabled: this.sentryEnabled,
      performanceEnabled: this.performanceEnabled,
      alertsEnabled: this.alertsEnabled,
    }, 'MonitoringService');
  }

  /**
   * Track an error
   */
  trackError(error: Error | ErrorResponse, context?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('Monitoring service not initialized');
      return;
    }

    // Log the error
    if ('category' in error) {
      // ErrorResponse object
      loggingService.error(error.message, undefined, error, 'MonitoringService');
    } else {
      // Standard Error object
      loggingService.error(error.message, error, context, 'MonitoringService');
    }

    // Send to Sentry if enabled
    if (this.sentryEnabled && typeof window !== 'undefined' && window.Sentry) {
      this.captureException(error, context);
    }

    // Send alerts for critical errors
    if (this.alertsEnabled && 'severity' in error && error.severity === ErrorSeverity.CRITICAL) {
      this.sendAlert(error as ErrorResponse);
    }
  }

  /**
   * Track a performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.initialized || !this.performanceEnabled) {
      return;
    }

    loggingService.debug(`Performance metric: ${metric.type} - ${metric.name}: ${metric.value}ms`, metric, 'MonitoringService');

    // Send to Sentry performance monitoring if enabled
    if (this.sentryEnabled && typeof window !== 'undefined' && window.Sentry) {
      this.capturePerformance(metric);
    }
  }

  /**
   * Add an alert handler
   */
  addAlertHandler(handler: (error: ErrorResponse) => void): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Remove an alert handler
   */
  removeAlertHandler(handler: (error: ErrorResponse) => void): void {
    this.alertHandlers = this.alertHandlers.filter(h => h !== handler);
  }

  /**
   * Initialize Sentry
   */
  private initializeSentry(dsn: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Load Sentry dynamically
    import('@sentry/browser').then(Sentry => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_VERSION || 'development',
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.postiz\.app/],
          }),
          new Sentry.Replay(),
        ],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });

      // Attach to window for global access
      window.Sentry = Sentry;

      loggingService.info('Sentry initialized', { dsn }, 'MonitoringService');
    }).catch(error => {
      console.error('Failed to initialize Sentry:', error);
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Monitor page load performance
    window.addEventListener('load', () => {
      if (window.performance) {
        const pageLoadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        this.trackPerformance({
          type: MetricType.PAGE_LOAD,
          name: 'page_load_time',
          value: pageLoadTime,
        });

        // Track resource load times
        const resources = window.performance.getEntriesByType('resource');
        resources.forEach(resource => {
          const resourceData = resource as PerformanceResourceTiming;
          this.trackPerformance({
            type: MetricType.RESOURCE_LOAD,
            name: resourceData.name.split('/').pop() || resourceData.name,
            value: resourceData.duration,
            tags: {
              url: resourceData.name,
              initiatorType: resourceData.initiatorType,
            },
          });
        });
      }
    });

    // Set up PerformanceObserver for ongoing monitoring
    if ('PerformanceObserver' in window) {
      try {
        // Monitor navigation timing
        const navObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.trackPerformance({
                type: MetricType.PAGE_LOAD,
                name: 'navigation_timing',
                value: navEntry.duration,
                tags: {
                  url: navEntry.name,
                  type: navEntry.type,
                },
              });
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Monitor resource timing
        const resourceObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackPerformance({
              type: MetricType.RESOURCE_LOAD,
              name: resourceEntry.name.split('/').pop() || resourceEntry.name,
              value: resourceEntry.duration,
              tags: {
                url: resourceEntry.name,
                initiatorType: resourceEntry.initiatorType,
              },
            });
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });

        // Monitor user interactions
        const interactionObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this.trackPerformance({
              type: MetricType.USER_INTERACTION,
              name: entry.name,
              value: entry.duration,
            });
          });
        });
        interactionObserver.observe({ entryTypes: ['first-input', 'event'] });
      } catch (e) {
        console.error('Error setting up PerformanceObserver:', e);
      }
    }

    loggingService.info('Performance monitoring initialized', {}, 'MonitoringService');
  }

  /**
   * Capture an exception in Sentry
   */
  private captureException(error: Error | ErrorResponse, context?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.Sentry) {
      return;
    }

    // Add additional context
    if (context) {
      window.Sentry.setContext('additional', context);
    }

    // Set user context if available
    const userId = loggingService['userId'];
    if (userId) {
      window.Sentry.setUser({ id: userId });
    }

    // Set error category and severity if available
    if ('category' in error && 'severity' in error) {
      window.Sentry.setTag('error.category', error.category);
      window.Sentry.setTag('error.severity', error.severity);
    }

    // Capture the exception
    window.Sentry.captureException(error);
  }

  /**
   * Capture a performance metric in Sentry
   */
  private capturePerformance(metric: PerformanceMetric): void {
    if (typeof window === 'undefined' || !window.Sentry) {
      return;
    }

    // Create a transaction
    const transaction = window.Sentry.startTransaction({
      name: `${metric.type}:${metric.name}`,
      op: metric.type,
    });

    // Add tags
    if (metric.tags) {
      Object.entries(metric.tags).forEach(([key, value]) => {
        transaction.setTag(key, value);
      });
    }

    // Set transaction data
    transaction.setData('value', metric.value);
    
    // Finish the transaction
    transaction.finish();
  }

  /**
   * Send an alert for a critical error
   */
  private sendAlert(error: ErrorResponse): void {
    // Notify all alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in alert handler:', e);
      }
    });

    // Log the alert
    loggingService.warn(`Alert sent for critical error: ${error.message}`, error, 'MonitoringService');
  }
}

// Create a singleton instance
export const monitoringService = MonitoringService.getInstance();

// Initialize with default settings
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  monitoringService.initialize({
    sentryEnabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    performanceEnabled: process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING_ENABLED === 'true',
    alertsEnabled: true,
  });
}

// Declare Sentry on window
declare global {
  interface Window {
    Sentry?: any;
  }
}
