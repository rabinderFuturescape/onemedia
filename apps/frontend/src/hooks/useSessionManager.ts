'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook for managing session state with additional features:
 * - Session expiration handling
 * - Session keep-alive for active users
 * - Session status monitoring
 */
export function useSessionManager() {
  const { data: session, status, update } = useSession();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isActive, setIsActive] = useState<boolean>(true);
  const router = useRouter();

  // Session expiration time in milliseconds (default: 30 minutes of inactivity)
  const SESSION_EXPIRATION_TIME = 30 * 60 * 1000;
  // Keep-alive interval in milliseconds (default: 5 minutes)
  const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000;
  // Warning time before expiration in milliseconds (default: 5 minutes)
  const WARNING_TIME = 5 * 60 * 1000;
  // Check interval in milliseconds (default: 1 minute)
  const CHECK_INTERVAL = 60 * 1000;

  // Update last activity timestamp on user interaction
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setIsActive(true);
  }, []);

  // Handle session errors
  useEffect(() => {
    if (session?.error) {
      console.error('Session error:', session.error);
      
      // Handle different error types
      if (
        session.error === 'RefreshAccessTokenError' ||
        session.error === 'InvalidRefreshToken'
      ) {
        // Force re-authentication on token refresh errors
        signOut({ callbackUrl: '/auth/login?error=session_expired' });
      }
    }
  }, [session]);

  // Set up activity listeners
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => updateActivity();

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check session status periodically
    const checkInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      
      // If user has been inactive for too long, mark as inactive
      if (inactiveTime > SESSION_EXPIRATION_TIME - WARNING_TIME) {
        setIsActive(false);
      }
      
      // If session is about to expire, show warning
      if (inactiveTime > SESSION_EXPIRATION_TIME - WARNING_TIME && isActive) {
        // Show session expiration warning
        const shouldExtend = window.confirm(
          'Your session is about to expire due to inactivity. Would you like to stay signed in?'
        );
        
        if (shouldExtend) {
          updateActivity();
          // Refresh the session
          update();
        }
      }
      
      // If session has expired, log out
      if (inactiveTime > SESSION_EXPIRATION_TIME) {
        signOut({ callbackUrl: '/auth/login?error=session_expired' });
      }
    }, CHECK_INTERVAL);

    // Keep session alive for active users
    const keepAliveInterval = setInterval(() => {
      if (isActive) {
        // Silently refresh the session
        update();
      }
    }, KEEP_ALIVE_INTERVAL);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInterval);
      clearInterval(keepAliveInterval);
    };
  }, [status, lastActivity, isActive, update, updateActivity]);

  // Login function with redirect
  const login = useCallback((callbackUrl = '/') => {
    signIn('onesso', { callbackUrl });
  }, []);

  // Logout function with redirect
  const logout = useCallback(() => {
    signOut({ callbackUrl: '/auth/login' });
  }, []);

  return {
    session,
    status,
    isActive,
    login,
    logout,
    updateActivity,
  };
}
