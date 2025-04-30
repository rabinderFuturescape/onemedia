import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupLogging();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database', 'PrismaService');

    // Enable soft delete middleware
    this.$use(async (params, next) => {
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database', 'PrismaService');
  }

  /**
   * Set up logging for Prisma queries
   */
  private setupLogging() {
    // Log queries that take longer than the threshold
    const SLOW_QUERY_THRESHOLD_MS = 100;

    // @ts-ignore - Prisma events are not properly typed
    this.$on('query', (e) => {
      if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
        this.logger.warn(
          `Slow query (${e.duration}ms): ${e.query}`,
          'PrismaService',
        );
      } else if (process.env.LOG_QUERIES === 'true') {
        this.logger.debug(
          `Query (${e.duration}ms): ${e.query}`,
          'PrismaService',
        );
      }
    });

    // @ts-ignore
    this.$on('error', (e) => {
      this.logger.error(
        `Database error: ${e.message}`,
        e.stack,
        'PrismaService',
      );
    });

    // @ts-ignore
    this.$on('info', (e) => {
      this.logger.log(
        `Database info: ${e.message}`,
        'PrismaService',
      );
    });

    // @ts-ignore
    this.$on('warn', (e) => {
      this.logger.warn(
        `Database warning: ${e.message}`,
        'PrismaService',
      );
    });
  }

  /**
   * Execute a transaction with automatic retries
   * @param fn Function to execute in transaction
   * @param maxRetries Maximum number of retries
   * @returns Result of the transaction
   */
  async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let retries = 0;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        // Check if error is retryable (e.g., deadlock, connection issue)
        const isRetryable =
          error.code === 'P2034' || // Transaction deadlock
          error.code === 'P2024' || // Connection lost
          error.code === 'P1001' || // Can't reach database server
          error.code === 'P1002';   // Database server terminated the connection

        if (!isRetryable || retries >= maxRetries) {
          throw error;
        }

        retries++;

        this.logger.warn(
          `Retrying database operation (${retries}/${maxRetries}) after error: ${error.message}`,
          'PrismaService',
        );

        // Exponential backoff
        const delay = Math.pow(2, retries) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
