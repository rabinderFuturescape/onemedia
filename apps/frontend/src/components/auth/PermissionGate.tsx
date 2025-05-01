'use client';

import { ReactNode } from 'react';
import { useUser } from '../layout/user.context';
import { Permission, RBACService } from '@/services/rbac.service';

interface PermissionGateProps {
  /**
   * The permission(s) required to render the children
   */
  permissions: Permission | Permission[];
  /**
   * Whether all permissions are required (AND) or any permission is sufficient (OR)
   */
  requireAll?: boolean;
  /**
   * Content to render when the user has the required permissions
   */
  children: ReactNode;
  /**
   * Optional content to render when the user doesn't have the required permissions
   */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders content based on user permissions
 */
export function PermissionGate({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const user = useUser();
  
  // If user is not loaded yet, don't render anything
  if (!user) {
    return null;
  }
  
  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  const role = user.role || 'USER';
  const tier = user.tier?.name || 'FREE';
  
  const hasPermission = requireAll
    ? RBACService.hasAllPermissions(permissionsArray, role, tier)
    : RBACService.hasAnyPermission(permissionsArray, role, tier);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-order component that wraps a component with permission checking
 */
export function withPermission(
  Component: React.ComponentType<any>,
  permissions: Permission | Permission[],
  requireAll = false,
  FallbackComponent: React.ComponentType<any> | null = null
) {
  return function PermissionCheckedComponent(props: any) {
    return (
      <PermissionGate
        permissions={permissions}
        requireAll={requireAll}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}
