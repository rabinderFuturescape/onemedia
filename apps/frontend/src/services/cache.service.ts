/**
 * Cache Service
 * 
 * This service provides a caching layer for API requests.
 * It includes cache invalidation strategies and TTL (Time To Live) support.
 */

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private maxCacheSize: number = 100; // Maximum number of cache entries

  // Singleton pattern
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set cache configuration
   */
  configure(options: { defaultTTL?: number; maxCacheSize?: number } = {}): void {
    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL;
    }
    if (options.maxCacheSize !== undefined) {
      this.maxCacheSize = options.maxCacheSize;
    }
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | undefined {
    // Clean expired entries
    this.cleanExpiredEntries();

    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if the entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Clean expired entries
    this.cleanExpiredEntries();

    // Check if we need to evict entries
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntry();
    }

    // Add the new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries from the cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Create a singleton instance
export const cacheService = CacheService.getInstance();

// Configure the cache service
cacheService.configure({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
});
