'use client';

import { useSWRCache, useSWRMutationCache } from './useSWRCache';
import { api } from '@/services/api.service';
import { useSession } from 'next-auth/react';

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  apiKey?: string;
  users: Array<{
    id: string;
    role: string;
    disabled: boolean;
  }>;
}

interface CreateOrgData {
  name: string;
}

interface UpdateOrgData {
  id: string;
  name: string;
}

interface InviteUserData {
  organizationId: string;
  email: string;
  role: string;
}

interface RemoveUserData {
  organizationId: string;
  userId: string;
}

/**
 * Enhanced hook for fetching and managing organizations
 */
export function useOrganizationData() {
  const { status } = useSession();
  
  // Fetch organizations with SWR
  const {
    data: organizations,
    error,
    isLoading,
    mutate: refreshOrganizations,
  } = useSWRCache<Organization[]>(
    status === 'authenticated' ? '/user/organizations' : null,
    async (url) => {
      const response = await api.get<Organization[]>(url, {
        cache: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
      });
      return response.data;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Mutation hook for creating an organization
  const { 
    trigger: createOrganization, 
    isMutating: isCreating 
  } = useSWRMutationCache<Organization, Error, CreateOrgData>(
    '/user/organizations',
    async (url, { arg }) => {
      const response = await api.post<Organization>(url, arg);
      return response.data;
    },
    {
      onSuccess: () => {
        refreshOrganizations();
      },
    }
  );

  // Mutation hook for updating an organization
  const { 
    trigger: updateOrganization, 
    isMutating: isUpdating 
  } = useSWRMutationCache<Organization, Error, UpdateOrgData>(
    '/user/organizations',
    async (url, { arg }) => {
      const response = await api.put<Organization>(url, arg);
      return response.data;
    },
    {
      onSuccess: () => {
        refreshOrganizations();
      },
    }
  );

  // Mutation hook for deleting an organization
  const { 
    trigger: deleteOrganization, 
    isMutating: isDeleting 
  } = useSWRMutationCache<void, Error, { id: string }>(
    '/user/organizations',
    async (url, { arg }) => {
      const response = await api.delete<void>(`${url}/${arg.id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        refreshOrganizations();
      },
    }
  );

  // Mutation hook for inviting a user
  const { 
    trigger: inviteUser, 
    isMutating: isInviting 
  } = useSWRMutationCache<void, Error, InviteUserData>(
    '/user/organizations/invite',
    async (url, { arg }) => {
      const response = await api.post<void>(url, arg);
      return response.data;
    },
    {
      onSuccess: () => {
        refreshOrganizations();
      },
    }
  );

  // Mutation hook for removing a user
  const { 
    trigger: removeUser, 
    isMutating: isRemoving 
  } = useSWRMutationCache<void, Error, RemoveUserData>(
    '/user/organizations/user',
    async (url, { arg }) => {
      const response = await api.delete<void>(`${url}/${arg.organizationId}/${arg.userId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        refreshOrganizations();
      },
    }
  );

  return {
    organizations,
    error,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isInviting,
    isRemoving,
    refreshOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    inviteUser,
    removeUser,
  };
}
