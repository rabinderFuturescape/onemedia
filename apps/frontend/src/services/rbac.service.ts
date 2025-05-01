/**
 * Role-Based Access Control (RBAC) Service
 * 
 * This service provides centralized permission management for the application.
 * It handles role-based access control, permission checking, and UI component rendering
 * based on user permissions.
 */

// Define permission types
export type Permission = 
  | 'posts:read'
  | 'posts:write'
  | 'posts:delete'
  | 'analytics:view'
  | 'settings:view'
  | 'settings:edit'
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'integrations:view'
  | 'integrations:create'
  | 'integrations:edit'
  | 'integrations:delete'
  | 'billing:view'
  | 'billing:manage';

// Define role types
export type Role = 'USER' | 'ADMIN' | 'SUPERADMIN';

// Define role-permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  USER: [
    'posts:read',
    'posts:write',
    'analytics:view',
    'settings:view',
    'integrations:view',
    'billing:view',
  ],
  ADMIN: [
    'posts:read',
    'posts:write',
    'posts:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'users:view',
    'users:create',
    'users:edit',
    'integrations:view',
    'integrations:create',
    'integrations:edit',
    'integrations:delete',
    'billing:view',
    'billing:manage',
  ],
  SUPERADMIN: [
    'posts:read',
    'posts:write',
    'posts:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'integrations:view',
    'integrations:create',
    'integrations:edit',
    'integrations:delete',
    'billing:view',
    'billing:manage',
  ],
};

// Define subscription tier permissions
export type SubscriptionTier = 'FREE' | 'STANDARD' | 'PRO' | 'ULTIMATE' | 'TEAM';

const tierPermissions: Record<SubscriptionTier, Permission[]> = {
  FREE: [
    'posts:read',
    'posts:write',
    'analytics:view',
    'settings:view',
    'integrations:view',
  ],
  STANDARD: [
    'posts:read',
    'posts:write',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'integrations:view',
    'integrations:create',
    'billing:view',
  ],
  PRO: [
    'posts:read',
    'posts:write',
    'posts:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'integrations:view',
    'integrations:create',
    'integrations:edit',
    'billing:view',
    'billing:manage',
  ],
  ULTIMATE: [
    'posts:read',
    'posts:write',
    'posts:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'users:view',
    'users:create',
    'users:edit',
    'integrations:view',
    'integrations:create',
    'integrations:edit',
    'integrations:delete',
    'billing:view',
    'billing:manage',
  ],
  TEAM: [
    'posts:read',
    'posts:write',
    'posts:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'integrations:view',
    'integrations:create',
    'integrations:edit',
    'integrations:delete',
    'billing:view',
    'billing:manage',
  ],
};

export class RBACService {
  /**
   * Check if a user has a specific permission based on their role and subscription tier
   */
  static hasPermission(
    permission: Permission,
    role: Role = 'USER',
    tier: SubscriptionTier = 'FREE'
  ): boolean {
    // Check role-based permissions
    const roleHasPermission = rolePermissions[role]?.includes(permission) || false;
    
    // Check tier-based permissions
    const tierHasPermission = tierPermissions[tier]?.includes(permission) || false;
    
    // User must have permission from both role and tier
    return roleHasPermission && tierHasPermission;
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(
    permissions: Permission[],
    role: Role = 'USER',
    tier: SubscriptionTier = 'FREE'
  ): boolean {
    return permissions.some(permission => 
      this.hasPermission(permission, role, tier)
    );
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static hasAllPermissions(
    permissions: Permission[],
    role: Role = 'USER',
    tier: SubscriptionTier = 'FREE'
  ): boolean {
    return permissions.every(permission => 
      this.hasPermission(permission, role, tier)
    );
  }

  /**
   * Get all permissions for a user based on their role and subscription tier
   */
  static getUserPermissions(
    role: Role = 'USER',
    tier: SubscriptionTier = 'FREE'
  ): Permission[] {
    const rolePerms = rolePermissions[role] || [];
    const tierPerms = tierPermissions[tier] || [];
    
    // Return intersection of role and tier permissions
    return rolePerms.filter(perm => tierPerms.includes(perm));
  }
}
