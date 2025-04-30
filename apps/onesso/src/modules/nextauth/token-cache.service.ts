import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../common/services/logging.service';

/**
 * Service for caching tokens to improve performance and reduce load on Keycloak
 */
@Injectable()
export class TokenCacheService {
  private tokenCache: Map<string, any> = new Map();
  private jwksCache: any = null;
  private jwksCacheTime: number = 0;
  private readonly jwksCacheTTL: number;

  constructor(
    private configService: ConfigService,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setContext('TokenCacheService');
    this.jwksCacheTTL = parseInt(this.configService.get<string>('JWKS_CACHE_TTL') || '3600') * 1000; // Default: 1 hour
  }

  /**
   * Store a token in the cache
   * @param userId User ID
   * @param tokenData Token data
   * @param expiresIn Expiration time in seconds
   */
  storeToken(userId: string, tokenData: any, expiresIn: number): void {
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    this.tokenCache.set(userId, {
      ...tokenData,
      expiresAt,
    });
    
    this.loggingService.debug(`Stored token for user ${userId} in cache, expires in ${expiresIn} seconds`);
    
    // Schedule cleanup of expired token
    setTimeout(() => {
      this.removeToken(userId);
    }, expiresIn * 1000);
  }

  /**
   * Get a token from the cache
   * @param userId User ID
   * @returns Token data or null if not found or expired
   */
  getToken(userId: string): any {
    const cachedToken = this.tokenCache.get(userId);
    
    if (!cachedToken) {
      return null;
    }
    
    // Check if token is expired
    if (cachedToken.expiresAt < Date.now()) {
      this.removeToken(userId);
      return null;
    }
    
    this.loggingService.debug(`Retrieved token for user ${userId} from cache`);
    return cachedToken;
  }

  /**
   * Remove a token from the cache
   * @param userId User ID
   */
  removeToken(userId: string): void {
    this.tokenCache.delete(userId);
    this.loggingService.debug(`Removed token for user ${userId} from cache`);
  }

  /**
   * Store JWKS in the cache
   * @param jwks JWKS data
   */
  storeJwks(jwks: any): void {
    this.jwksCache = jwks;
    this.jwksCacheTime = Date.now();
    this.loggingService.debug('Stored JWKS in cache');
  }

  /**
   * Get JWKS from the cache
   * @returns JWKS data or null if not found or expired
   */
  getJwks(): any {
    if (!this.jwksCache) {
      return null;
    }
    
    // Check if JWKS is expired
    if (Date.now() - this.jwksCacheTime > this.jwksCacheTTL) {
      this.jwksCache = null;
      return null;
    }
    
    this.loggingService.debug('Retrieved JWKS from cache');
    return this.jwksCache;
  }

  /**
   * Clear the entire token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
    this.jwksCache = null;
    this.loggingService.debug('Cleared token cache');
  }

  /**
   * Get the number of tokens in the cache
   * @returns Number of tokens in the cache
   */
  getCacheSize(): number {
    return this.tokenCache.size;
  }
}
