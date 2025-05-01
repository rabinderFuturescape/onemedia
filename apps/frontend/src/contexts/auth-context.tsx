'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Auth context type definition
 */
interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectUrl?: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasTenant: (tenantId: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
  accessToken?: string;
  error?: string;
}

/**
 * Create the auth context with default values
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
  hasTenant: () => false,
  hasPermission: () => false,
  refreshSession: async () => {},
  accessToken: undefined,
  error: undefined,
});

/**
 * Auth provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<any>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isActive, setIsActive] = useState<boolean>(true);
  const router = useRouter();

  // Session management constants
  const SESSION_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
  const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes
  const CHECK_INTERVAL = 60 * 1000; // 1 minute

  // Update user when session changes
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);

      // Handle token refresh errors
      if (
        session.error === 'RefreshAccessTokenError' ||
        session.error === 'InvalidRefreshToken' ||
        session.error === 'NoRefreshTokenError'
      ) {
        console.error('Session error detected:', session.error);
        // Force re-authentication on token refresh errors
        signOut({ callbackUrl: '/auth/login?error=token_expired' });
      }
    } else {
      setUser(null);
    }
  }, [session, router]);

  // Update last activity timestamp on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
    setIsActive(true);
  };

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
  }, [status, lastActivity, isActive, update]);

  // Login function with redirect
  const login = (redirectUrl?: string) => {
    signIn('onesso', { callbackUrl: redirectUrl || '/' });
  };

  // Logout function with redirect
  const logout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  // Check if user has a specific role
  const hasRole = (role: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  // Check if user belongs to a specific tenant
  const hasTenant = (tenantId: string): boolean => {
    if (!user?.tenant_id) return false;
    return user.tenant_id === tenantId;
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Refresh the session
  const refreshSession = async (): Promise<void> => {
    try {
      await update();
      updateActivity();
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasTenant,
        hasPermission,
        refreshSession,
        accessToken: session?.accessToken as string | undefined,
        error: session?.error as string | undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 */
export const useAuth = () => useContext(AuthContext);
