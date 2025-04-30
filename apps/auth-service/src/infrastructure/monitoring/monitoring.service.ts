import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import * as prometheus from 'prom-client';

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly registry: prometheus.Registry;
  
  // Metrics
  private authAttempts: prometheus.Counter;
  private authSuccess: prometheus.Counter;
  private authFailure: prometheus.Counter;
  private tokenValidations: prometheus.Counter;
  private activeUsers: prometheus.Gauge;
  private requestDuration: prometheus.Histogram;
  private errorRate: prometheus.Counter;

  constructor(private readonly logger: LoggerService) {
    // Create a new registry
    this.registry = new prometheus.Registry();
    
    // Add default metrics (memory, CPU, etc.)
    prometheus.collectDefaultMetrics({ register: this.registry });
    
    // Create custom metrics
    this.authAttempts = new prometheus.Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['provider'],
    });
    
    this.authSuccess = new prometheus.Counter({
      name: 'auth_success_total',
      help: 'Total number of successful authentications',
      labelNames: ['provider'],
    });
    
    this.authFailure = new prometheus.Counter({
      name: 'auth_failure_total',
      help: 'Total number of failed authentications',
      labelNames: ['provider', 'reason'],
    });
    
    this.tokenValidations = new prometheus.Counter({
      name: 'token_validations_total',
      help: 'Total number of token validations',
      labelNames: ['result'],
    });
    
    this.activeUsers = new prometheus.Gauge({
      name: 'active_users',
      help: 'Number of active users',
    });
    
    this.requestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });
    
    this.errorRate = new prometheus.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status_code'],
    });
    
    // Register metrics
    this.registry.registerMetric(this.authAttempts);
    this.registry.registerMetric(this.authSuccess);
    this.registry.registerMetric(this.authFailure);
    this.registry.registerMetric(this.tokenValidations);
    this.registry.registerMetric(this.activeUsers);
    this.registry.registerMetric(this.requestDuration);
    this.registry.registerMetric(this.errorRate);
  }

  onModuleInit() {
    this.logger.log('Monitoring service initialized', 'MonitoringService');
  }

  // Get metrics in Prometheus format
  getMetrics(): string {
    return this.registry.metrics();
  }

  // Record authentication attempt
  recordAuthAttempt(provider: string): void {
    this.authAttempts.inc({ provider });
  }

  // Record successful authentication
  recordAuthSuccess(provider: string): void {
    this.authSuccess.inc({ provider });
  }

  // Record failed authentication
  recordAuthFailure(provider: string, reason: string): void {
    this.authFailure.inc({ provider, reason });
  }

  // Record token validation
  recordTokenValidation(result: 'valid' | 'invalid'): void {
    this.tokenValidations.inc({ result });
  }

  // Update active users count
  updateActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  // Record request duration
  recordRequestDuration(method: string, route: string, statusCode: number, duration: number): void {
    this.requestDuration.observe({ method, route, status_code: statusCode }, duration);
  }

  // Record request error
  recordRequestError(method: string, route: string, statusCode: number): void {
    this.errorRate.inc({ method, route, status_code: statusCode });
  }
}
