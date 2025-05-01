'use client';

import React, { useState, useEffect } from 'react';
import { securityService } from '@/services/security.service';

interface SecureFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, formData: FormData) => void;
  preventMultipleSubmits?: boolean;
}

/**
 * Secure form component with CSRF protection and other security features
 */
export function SecureForm({
  children,
  onSubmit,
  preventMultipleSubmits = true,
  ...props
}: SecureFormProps) {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Get CSRF token on mount
  useEffect(() => {
    // Get CSRF token from meta tag or cookie
    const token = securityService.getCsrfToken();
    
    // If no token exists, generate a new one
    if (!token) {
      const newToken = securityService.generateRandomString(32);
      setCsrfToken(newToken);
      
      // Store the token in a cookie or meta tag
      const metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      metaTag.content = newToken;
      document.head.appendChild(metaTag);
    } else {
      setCsrfToken(token);
    }
  }, []);
  
  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (preventMultipleSubmits && isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Get form data
    const formData = new FormData(event.currentTarget);
    
    // Add CSRF token to form data
    formData.append('_csrf', csrfToken);
    
    // Call the onSubmit handler
    onSubmit(event, formData);
    
    // Reset submission state after a delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <form {...props} onSubmit={handleSubmit}>
      {/* Hidden CSRF token field */}
      <input type="hidden" name="_csrf" value={csrfToken} />
      
      {/* Form content */}
      {children}
      
      {/* Honeypot field to catch bots */}
      <div style={{ display: 'none' }}>
        <label htmlFor="honeypot">Leave this field empty</label>
        <input
          type="text"
          id="honeypot"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    </form>
  );
}
