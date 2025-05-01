'use client';

import { createContext, FC, ReactNode, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@prisma/client';
import {
  pricing,
  PricingInnerInterface,
} from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { useSession } from 'next-auth/react';
import { api } from '@/services/api.service';
import { useToast } from '@/components/ui/Toast';
import { Permission, RBACService } from '@/services/rbac.service';
import { useSessionManager } from '@/hooks/useSessionManager';

// Define the user context type
export interface UserContextType extends User {
  orgId: string;
  tier: PricingInnerInterface;
  publicApi: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  totalChannels: number;
  isLifetime?: boolean;
  impersonate: boolean;
  allowTrial: boolean;
  permissions: Permission[];
}

// Create the context with undefined as default value
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component that wraps the app and makes user data available
export const UserProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { session, status, updateActivity } = useSessionManager();
  const [user, setUser] = useState<UserContextType | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  // Fetch user data when session changes
  useEffect(() => {
    const fetchUser = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          setIsLoading(true);

          // Use the API service for fetching
          const { data: userData } = await api.get('/user/self');

          if (userData) {
            // Update activity timestamp
            updateActivity();

            // Map the user data to the expected format
            const mappedUser = {
              ...userData,
              id: userData.id || session.user.id,
              name: userData.name || session.user.name,
              email: userData.email || session.user.email,
              orgId: userData.orgId || userData.organizationId || 'default',
              tier: userData.tier || 'FREE',
              role: userData.role || (session.user.roles?.includes('admin') ? 'ADMIN' : 'USER'),
              publicApi: userData.publicApi || '',
              totalChannels: userData.totalChannels || 0,
              isLifetime: userData.isLifetime || false,
              impersonate: userData.impersonate || false,
              allowTrial: userData.allowTrial || true,
            };

            // Get permissions based on role and tier
            const permissions = RBACService.getUserPermissions(
              mappedUser.role,
              mappedUser.tier as any
            );

            // Set the user with pricing and permissions
            setUser({
              ...mappedUser,
              tier: pricing[mappedUser.tier] || pricing.FREE,
              permissions,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          addToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load user data. Please try refreshing the page.',
          });
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setUser(undefined);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [session, status, addToast, updateActivity]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => user, [user]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Legacy wrapper for backward compatibility
export const ContextWrapper: FC<{
  user: User & {
    orgId: string;
    tier: 'FREE' | 'STANDARD' | 'PRO' | 'ULTIMATE' | 'TEAM';
    role: 'USER' | 'ADMIN' | 'SUPERADMIN';
    publicApi: string;
    totalChannels: number;
  };
  children: ReactNode;
}> = ({ user, children }) => {
  // Get permissions based on role and tier
  const permissions = RBACService.getUserPermissions(
    user.role,
    user.tier
  );

  const values = user ? {
    ...user,
    tier: pricing[user.tier],
    permissions,
  } : ({} as any);

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    // Return a default value when context is not available
    // This helps prevent errors when the hook is used outside the provider
    return undefined;
  }

  return context;
};

// Hook for checking permissions
export const usePermissions = () => {
  const user = useUser();

  return {
    hasPermission: (permission: Permission): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },

    hasAnyPermission: (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.some(permission => user.permissions.includes(permission));
    },

    hasAllPermissions: (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.every(permission => user.permissions.includes(permission));
    },

    getUserPermissions: (): Permission[] => {
      return user?.permissions || [];
    },
  };
};
