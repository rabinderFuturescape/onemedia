'use client';

import { useEffect, useState } from 'react';
import { securityService } from '@/services/security.service';
import { useToast } from '@/components/ui/Toast';

/**
 * Hook for security-related functionality
 */
export function useSecurity() {
  const [isSecure, setIsSecure] = useState<boolean>(true);
  const { addToast } = useToast();
  
  // Check if the connection is secure
  useEffect(() => {
    const secure = securityService.isSecureConnection();
    setIsSecure(secure);
    
    if (!secure && process.env.NODE_ENV === 'production') {
      addToast({
        type: 'warning',
        title: 'Insecure Connection',
        message: 'Your connection is not secure. Sensitive data may be at risk.',
        duration: 10000,
      });
    }
  }, [addToast]);
  
  /**
   * Sanitize a string to prevent XSS attacks
   */
  const sanitize = (input: string): string => {
    return securityService.sanitizeString(input);
  };
  
  /**
   * Sanitize an object's string properties
   */
  const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
    return securityService.sanitizeObject(obj);
  };
  
  /**
   * Store sensitive data securely
   */
  const storeSecurely = (key: string, value: string, expiresInMinutes?: number): void => {
    securityService.secureStore(key, value, expiresInMinutes);
  };
  
  /**
   * Retrieve sensitive data
   */
  const retrieveSecurely = (key: string): string | null => {
    return securityService.secureRetrieve(key);
  };
  
  /**
   * Clear sensitive data
   */
  const clearSecureData = (key: string): void => {
    securityService.secureClear(key);
  };
  
  /**
   * Generate a secure random string
   */
  const generateRandomString = (length?: number): string => {
    return securityService.generateRandomString(length);
  };
  
  return {
    isSecure,
    sanitize,
    sanitizeObject,
    storeSecurely,
    retrieveSecurely,
    clearSecureData,
    generateRandomString,
  };
}
