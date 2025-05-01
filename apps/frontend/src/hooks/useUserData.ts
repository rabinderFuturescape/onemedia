'use client';

import { useSWRCache, useSWRMutationCache } from './useSWRCache';
import { User } from '@prisma/client';
import { RBACService, Permission } from '@/services/rbac.service';
import { useSession } from 'next-auth/react';
import { api } from '@/services/api.service';

interface UserWithPermissions extends User {
  orgId: string;
  tier: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  permissions: Permission[];
}

/**
 * Enhanced hook for accessing the current user data with permissions
 */
export function useUserData() {
  const { data: session, status } = useSession();
  
  // Fetch user data with SWR
  const { 
    data: userData, 
    error, 
    isLoading, 
    mutate 
  } = useSWRCache<UserWithPermissions>(
    status === 'authenticated' ? '/user/self' : null,
    async (url) => {
      const response = await api.get<UserWithPermissions>(url, {
        cache: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
      });
      return response.data;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      onError: (error) => {
        console.error('Error fetching user data:', error);
      },
    }
  );
  
  // Mutation hook for updating user data
  const { trigger: updateUser, isMutating: isUpdating } = useSWRMutationCache<UserWithPermissions, Error, Partial<User>>(
    '/user/self',
    async (url, { arg }) => {
      const response = await api.patch<UserWithPermissions>(url, arg);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update the cache with the new data
        mutate(data, false);
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
    isLoading,
    isUpdating,
    isAuthenticated: !!user,
    error,
    refreshUser: mutate,
    updateUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
