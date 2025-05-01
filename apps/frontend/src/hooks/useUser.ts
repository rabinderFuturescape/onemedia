'use client';

import { useApiQuery } from './useApi';
import { useSession } from 'next-auth/react';
import { User } from '@prisma/client';
import { RBACService, Permission } from '@/services/rbac.service';

interface UserWithPermissions extends User {
  orgId: string;
  tier: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  permissions: Permission[];
}

/**
 * Hook for accessing the current user data with permissions
 */
export function useUser() {
  const { data: session, status } = useSession();
  
  const { data: userData, error, isLoading, mutate } = useApiQuery<UserWithPermissions>(
    status === 'authenticated' ? '/user/self' : null,
    {
      withAuth: true,
      skipErrorHandling: false,
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      onError: (error) => {
        console.error('Error fetching user data:', error);
      },
    }
  );
  
  // Combine session data with user data
  const user = userData ? {
    ...userData,
    // Add permissions based on role and tier
    permissions: RBACService.getUserPermissions(
      userData.role || 'USER',
      userData.tier as any || 'FREE'
    ),
  } : undefined;
  
  // Check if user has a specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };
  
  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  };
  
  return {
    user,
    isLoading: status === 'loading' || (status === 'authenticated' && isLoading),
    isAuthenticated: !!user,
    error,
    refreshUser: mutate,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
