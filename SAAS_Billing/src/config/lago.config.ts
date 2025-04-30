/**
 * Lago API Configuration
 * 
 * This file contains the configuration for the Lago API client.
 * It includes the API key, base URL, and other settings needed to interact with the Lago API.
 */

export interface LagoConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default configuration values
const defaultConfig: LagoConfig = {
  apiKey: process.env.LAGO_API_KEY || '',
  baseUrl: process.env.LAGO_API_URL || 'https://api.getlago.com/api/v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Get the Lago API configuration
 * 
 * @param overrides - Optional configuration overrides
 * @returns The Lago API configuration
 */
export const getLagoConfig = (overrides: Partial<LagoConfig> = {}): LagoConfig => {
  return {
    ...defaultConfig,
    ...overrides,
  };
};

/**
 * Validate the Lago API configuration
 * 
 * @param config - The Lago API configuration to validate
 * @throws Error if the configuration is invalid
 */
export const validateLagoConfig = (config: LagoConfig): void => {
  if (!config.apiKey) {
    throw new Error('Lago API key is required');
  }

  if (!config.baseUrl) {
    throw new Error('Lago API base URL is required');
  }

  // Validate URL format
  try {
    new URL(config.baseUrl);
  } catch (error) {
    throw new Error(`Invalid Lago API base URL: ${config.baseUrl}`);
  }
};
