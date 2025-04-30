import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(
        `Error getting value from cache for key ${key}: ${error.message}`,
        error.stack,
        'CacheService',
      );
      return null;
    }
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, { ttl });
      this.logger.debug(`Cached value for key ${key}`, 'CacheService');
    } catch (error) {
      this.logger.error(
        `Error setting value in cache for key ${key}: ${error.message}`,
        error.stack,
        'CacheService',
      );
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted cache for key ${key}`, 'CacheService');
    } catch (error) {
      this.logger.error(
        `Error deleting value from cache for key ${key}: ${error.message}`,
        error.stack,
        'CacheService',
      );
    }
  }

  /**
   * Clear the entire cache
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cache cleared', 'CacheService');
    } catch (error) {
      this.logger.error(
        `Error clearing cache: ${error.message}`,
        error.stack,
        'CacheService',
      );
    }
  }

  /**
   * Get or set a value in the cache
   * @param key Cache key
   * @param factory Function to generate the value if not in cache
   * @param ttl Time to live in seconds (optional)
   * @returns Cached or generated value
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null && cachedValue !== undefined) {
      this.logger.debug(`Cache hit for key ${key}`, 'CacheService');
      return cachedValue;
    }
    
    this.logger.debug(`Cache miss for key ${key}`, 'CacheService');
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
}
