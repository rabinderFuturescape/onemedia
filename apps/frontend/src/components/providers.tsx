'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { UserProvider } from './layout/user.context';
import { ToastProvider } from './ui/Toast';
import { ErrorBoundary } from './error/ErrorBoundary';
import { AuthProvider } from '../contexts/auth-context';

/**
 * Global providers for the application
 * Includes:
 * - SessionProvider: Manages authentication state
 * - AuthProvider: Provides authentication context and functions
 * - UserProvider: Provides user data and permissions
 * - ToastProvider: Manages toast notifications
 * - ErrorBoundary: Catches and handles errors
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <AuthProvider>
          <UserProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </UserProvider>
        </AuthProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
