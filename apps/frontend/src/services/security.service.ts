/**
 * Security Service
 * 
 * This service provides security utilities for the frontend,
 * including XSS protection, CSRF protection, and secure storage.
 */

import { loggingService } from './logging.service';

export class SecurityService {
  private static instance: SecurityService;
  
  // Singleton pattern
  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }
  
  /**
   * Sanitize a string to prevent XSS attacks
   */
  sanitizeString(input: string): string {
    if (!input) return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Sanitize an object's string properties
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized as T;
  }
  
  /**
   * Validate a CSRF token
   */
  validateCsrfToken(token: string): boolean {
    // Get the CSRF token from the cookie or meta tag
    const csrfToken = this.getCsrfToken();
    
    // Compare the tokens
    return token === csrfToken;
  }
  
  /**
   * Get the CSRF token from the cookie or meta tag
   */
  getCsrfToken(): string {
    // Try to get from meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content') || '';
    }
    
    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    
    return '';
  }
  
  /**
   * Store sensitive data securely
   */
  secureStore(key: string, value: string, expiresInMinutes: number = 60): void {
    try {
      // Create a storage object with expiration
      const storageObj = {
        value,
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      };
      
      // Store in sessionStorage (cleared when browser is closed)
      sessionStorage.setItem(key, JSON.stringify(storageObj));
    } catch (error) {
      loggingService.error('Error storing secure data', error as Error);
    }
  }
  
  /**
   * Retrieve sensitive data
   */
  secureRetrieve(key: string): string | null {
    try {
      // Get from sessionStorage
      const storedData = sessionStorage.getItem(key);
      if (!storedData) return null;
      
      // Parse the stored object
      const storageObj = JSON.parse(storedData);
      
      // Check if expired
      if (storageObj.expires < Date.now()) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return storageObj.value;
    } catch (error) {
      loggingService.error('Error retrieving secure data', error as Error);
      return null;
    }
  }
  
  /**
   * Clear sensitive data
   */
  secureClear(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      loggingService.error('Error clearing secure data', error as Error);
    }
  }
  
  /**
   * Generate a secure random string
   */
  generateRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Check if the current connection is secure (HTTPS)
   */
  isSecureConnection(): boolean {
    return window.location.protocol === 'https:';
  }
  
  /**
   * Warn if the connection is not secure
   */
  warnIfNotSecure(): void {
    if (!this.isSecureConnection()) {
      loggingService.warn('Connection is not secure (HTTPS). Sensitive data may be at risk.');
      
      // Show a warning to the user in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn('%c⚠️ WARNING: Insecure Connection ⚠️', 'color: red; font-size: 16px; font-weight: bold;');
        console.warn('This application is running over HTTP, not HTTPS. Sensitive data may be at risk.');
      }
    }
  }
}

// Create a singleton instance
export const securityService = SecurityService.getInstance();
