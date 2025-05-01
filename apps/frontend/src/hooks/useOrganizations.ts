'use client';

import { useApiQuery, useApiMutation } from './useApi';

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

/**
 * Hook for fetching and managing organizations
 */
export function useOrganizations() {
  const {
    data: organizations,
    error,
    isLoading,
    mutate: refreshOrganizations,
  } = useApiQuery<Organization[]>(
    '/user/organizations',
    {
      withAuth: true,
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const { trigger: createOrganization, isMutating: isCreating } = useApiMutation<Organization>(
    '/user/organizations',
    'post'
  );

  const { trigger: updateOrganization, isMutating: isUpdating } = useApiMutation<Organization>(
    '/user/organizations',
    'put'
  );

  const { trigger: deleteOrganization, isMutating: isDeleting } = useApiMutation<void>(
    '/user/organizations',
    'delete'
  );

  const { trigger: inviteUser, isMutating: isInviting } = useApiMutation<void>(
    '/user/organizations/invite',
    'post'
  );

  const { trigger: removeUser, isMutating: isRemoving } = useApiMutation<void>(
    '/user/organizations/user',
    'delete'
  );

  const handleCreateOrganization = async (name: string) => {
    const newOrg = await createOrganization({ name });
    refreshOrganizations();
    return newOrg;
  };

  const handleUpdateOrganization = async (id: string, name: string) => {
    const updatedOrg = await updateOrganization({ id, name });
    refreshOrganizations();
    return updatedOrg;
  };

  const handleDeleteOrganization = async (id: string) => {
    await deleteOrganization({ id });
    refreshOrganizations();
  };

  const handleInviteUser = async (organizationId: string, email: string, role: string) => {
    await inviteUser({ organizationId, email, role });
    refreshOrganizations();
  };

  const handleRemoveUser = async (organizationId: string, userId: string) => {
    await removeUser({ organizationId, userId });
    refreshOrganizations();
  };

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
    createOrganization: handleCreateOrganization,
    updateOrganization: handleUpdateOrganization,
    deleteOrganization: handleDeleteOrganization,
    inviteUser: handleInviteUser,
    removeUser: handleRemoveUser,
  };
}
