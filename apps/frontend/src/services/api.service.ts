/**
 * API Client Service
 *
 * This service provides a centralized API client for making HTTP requests.
 * It includes request/response interceptors, automatic token refresh,
 * caching, and integration with the error handling service.
 */

import { getSession, signOut } from 'next-auth/react';
import { errorService } from './error.service';
import { cacheService } from './cache.service';
import { loggingService } from './logging.service';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  withAuth?: boolean;
  skipErrorHandling?: boolean;
  cache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';
  }

  // Singleton pattern
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Set the base URL for API requests
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    // Default to using cache for GET requests
    const useCache = options.cache !== false;

    if (useCache) {
      // Generate cache key
      const cacheKey = options.cacheKey || this.generateCacheKey(path, options);

      // Try to get from cache
      const cachedData = cacheService.get<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        loggingService.debug(`Cache hit for ${path}`, { cacheKey }, 'ApiService');
        return cachedData;
      }

      // If not in cache, make the request and cache the result
      const response = await this.request<T>(path, { ...options, method: 'GET' });

      // Cache the response
      cacheService.set(cacheKey, response, options.cacheTTL);

      return response;
    }

    // If cache is disabled, just make the request
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(path: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const response = await this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    // Invalidate cache for related resources
    this.invalidateRelatedCache(path);

    return response;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(path: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const response = await this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    // Invalidate cache for related resources
    this.invalidateRelatedCache(path);

    return response;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(path: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const response = await this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });

    // Invalidate cache for related resources
    this.invalidateRelatedCache(path);

    return response;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const response = await this.request<T>(path, { ...options, method: 'DELETE' });

    // Invalidate cache for related resources
    this.invalidateRelatedCache(path);

    return response;
  }

  /**
   * Generate a cache key for a request
   */
  private generateCacheKey(path: string, options: RequestOptions): string {
    const { params, withAuth } = options;

    // Create a key based on the path
    let key = `${path}`;

    // Add params to the key if present
    if (params) {
      const sortedParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      if (sortedParams) {
        key += `?${sortedParams}`;
      }
    }

    // Add auth status to the key
    key += `|auth=${withAuth}`;

    return key;
  }

  /**
   * Invalidate cache for related resources
   */
  private invalidateRelatedCache(path: string): void {
    // Extract the resource type from the path
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const resourceType = pathParts[0];

      // Invalidate all cache entries for this resource type
      cacheService.invalidateByPrefix(`/${resourceType}`);

      loggingService.debug(`Invalidated cache for resource type: ${resourceType}`, {}, 'ApiService');
    }
  }

  /**
   * Make a request with the given options
   */
  private async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      params,
      withAuth = true,
      skipErrorHandling = false,
      cache = false,
      cacheTTL,
      cacheKey,
      headers = {},
      ...restOptions
    } = options;

    // Build URL with query parameters
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    // Add default headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authentication header if required
    if (withAuth) {
      const session = await getSession();
      if (session?.accessToken) {
        requestHeaders['Authorization'] = `Bearer ${session.accessToken}`;
      }
    }

    try {
      // Make the request
      const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      });

      // Handle authentication errors
      if (response.status === 401) {
        // If the request was authenticated and failed, the token might be invalid
        if (withAuth) {
          // Try to get a fresh session
          const session = await getSession();

          // If we still have a session but the request failed, the token might be invalid
          if (session) {
            // Check if this is a token refresh error
            const responseData = await response.json().catch(() => ({}));

            if (
              responseData.error === 'invalid_token' ||
              responseData.error === 'invalid_grant'
            ) {
              // Sign out the user
              signOut({ callbackUrl: '/auth/login?error=session_expired' });
            }
          }
        }

        if (!skipErrorHandling) {
          throw new Error('Unauthorized');
        }
      }

      // Parse response body based on content type
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        data = await response.blob() as unknown as T;
      }

      // Handle error responses
      if (!response.ok && !skipErrorHandling) {
        const error = new Error(response.statusText);
        (error as any).response = {
          status: response.status,
          data,
          headers: response.headers,
        };
        throw error;
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      // Handle errors
      if (!skipErrorHandling) {
        errorService.handleApiError(error, path);
      }
      throw error;
    }
  }
}

// Create a singleton instance
export const apiService = ApiService.getInstance();

// Convenience functions
export const api = {
  get: <T = any>(path: string, options?: RequestOptions) => apiService.get<T>(path, options),
  post: <T = any>(path: string, data?: any, options?: RequestOptions) => apiService.post<T>(path, data, options),
  put: <T = any>(path: string, data?: any, options?: RequestOptions) => apiService.put<T>(path, data, options),
  patch: <T = any>(path: string, data?: any, options?: RequestOptions) => apiService.patch<T>(path, data, options),
  delete: <T = any>(path: string, options?: RequestOptions) => apiService.delete<T>(path, options),
};
