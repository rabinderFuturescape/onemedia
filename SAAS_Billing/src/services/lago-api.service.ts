/**
 * Lago API Service
 * 
 * This service provides methods to interact with the Lago API.
 * It handles authentication, request formatting, and error handling.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LagoConfig, getLagoConfig, validateLagoConfig } from '../config/lago.config';

export class LagoApiService {
  private client: AxiosInstance;
  private config: LagoConfig;

  /**
   * Create a new Lago API service instance
   * 
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<LagoConfig>) {
    this.config = getLagoConfig(config);
    validateLagoConfig(this.config);

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      console.debug(`[LagoAPI] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response) {
          console.error(`[LagoAPI] Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          console.error('[LagoAPI] Error: No response received', error.request);
        } else {
          console.error('[LagoAPI] Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request to the Lago API
   * 
   * @param path - The API endpoint path
   * @param params - Optional query parameters
   * @returns The API response
   */
  public async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const config: AxiosRequestConfig = { params };
    return this.request<T>('GET', path, undefined, config);
  }

  /**
   * Make a POST request to the Lago API
   * 
   * @param path - The API endpoint path
   * @param data - The request body
   * @returns The API response
   */
  public async post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  /**
   * Make a PUT request to the Lago API
   * 
   * @param path - The API endpoint path
   * @param data - The request body
   * @returns The API response
   */
  public async put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>('PUT', path, data);
  }

  /**
   * Make a DELETE request to the Lago API
   * 
   * @param path - The API endpoint path
   * @returns The API response
   */
  public async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Make a request to the Lago API with retry logic
   * 
   * @param method - The HTTP method
   * @param path - The API endpoint path
   * @param data - Optional request body
   * @param config - Optional request configuration
   * @returns The API response
   */
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    let attempts = 0;
    let lastError: any;

    while (attempts < this.config.retryAttempts) {
      try {
        const response: AxiosResponse<T> = await this.client.request({
          method,
          url: path,
          data,
          ...config,
        });

        return response.data;
      } catch (error) {
        lastError = error;
        attempts++;

        // Don't retry for client errors (4xx)
        if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
          break;
        }

        // Wait before retrying
        if (attempts < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempts - 1);
          console.warn(`[LagoAPI] Retrying request (${attempts}/${this.config.retryAttempts}) in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
