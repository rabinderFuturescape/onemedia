import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

/**
 * Service for optimizing database queries
 */
@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  constructor(private readonly prisma: PrismaService) {}
  
  /**
   * Execute a query with caching
   */
  async executeWithCache<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number;
      invalidateOn?: string[];
    } = {}
  ): Promise<T> {
    const { ttl = 60000, invalidateOn = [] } = options; // Default TTL: 1 minute
    
    // Generate cache key
    const cacheKey = queryName;
    
    // Check if the query is cached and not expired
    const cachedResult = this.queryCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < cachedResult.ttl) {
      this.logger.debug(`Cache hit for query: ${queryName}`);
      return cachedResult.data;
    }
    
    // Execute the query
    this.logger.debug(`Cache miss for query: ${queryName}`);
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log query execution time
    this.logger.debug(`Query ${queryName} executed in ${duration}ms`);
    
    // Cache the result
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl,
    });
    
    // Register cache invalidation triggers
    for (const trigger of invalidateOn) {
      // Add this query to the list of queries to invalidate when the trigger is fired
      this.registerInvalidationTrigger(trigger, cacheKey);
    }
    
    return result;
  }
  
  /**
   * Invalidate cache entries by trigger
   */
  invalidateCache(trigger: string): void {
    this.logger.debug(`Invalidating cache for trigger: ${trigger}`);
    
    // Get all cache keys to invalidate for this trigger
    const keysToInvalidate = this.getKeysToInvalidate(trigger);
    
    // Invalidate each cache entry
    for (const key of keysToInvalidate) {
      this.queryCache.delete(key);
      this.logger.debug(`Invalidated cache for query: ${key}`);
    }
  }
  
  /**
   * Clear the entire query cache
   */
  clearCache(): void {
    this.logger.debug('Clearing entire query cache');
    this.queryCache.clear();
  }
  
  /**
   * Register a cache invalidation trigger
   */
  private registerInvalidationTrigger(trigger: string, queryKey: string): void {
    // Implementation would depend on how you want to track invalidation triggers
    // This is a simplified version
    this.logger.debug(`Registered invalidation trigger ${trigger} for query ${queryKey}`);
  }
  
  /**
   * Get all cache keys to invalidate for a trigger
   */
  private getKeysToInvalidate(trigger: string): string[] {
    // Implementation would depend on how you track invalidation triggers
    // This is a simplified version that invalidates all cache entries
    // that start with the trigger prefix
    return Array.from(this.queryCache.keys()).filter(key => key.startsWith(trigger));
  }
  
  /**
   * Optimize a Prisma query by analyzing and adding appropriate includes
   */
  optimizeQuery(query: any, includes: string[]): any {
    // Add includes to the query
    if (includes && includes.length > 0) {
      query = {
        ...query,
        include: this.buildIncludeObject(includes),
      };
    }
    
    return query;
  }
  
  /**
   * Build an include object from an array of include paths
   */
  private buildIncludeObject(includes: string[]): any {
    const includeObject = {};
    
    for (const include of includes) {
      const parts = include.split('.');
      let current = includeObject;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (i === parts.length - 1) {
          // Last part, set to true
          current[part] = true;
        } else {
          // Not the last part, create nested object if needed
          if (!current[part]) {
            current[part] = { include: {} };
          } else if (!current[part].include) {
            current[part] = { include: {}, ...current[part] };
          }
          
          current = current[part].include;
        }
      }
    }
    
    return includeObject;
  }
}
