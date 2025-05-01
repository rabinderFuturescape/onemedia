'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { LoadingComponent } from '../layout/loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requiredTenant?: string;
  fallbackUrl?: string;
}

/**
 * Protected route component that checks authentication and authorization
 * 
 * @param children - The content to render if authorized
 * @param requiredRoles - Optional array of roles required to access the route
 * @param requiredPermissions - Optional array of permissions required to access the route
 * @param requiredTenant - Optional tenant ID required to access the route
 * @param fallbackUrl - URL to redirect to if unauthorized (defaults to /auth/login)
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requiredTenant,
  fallbackUrl = '/auth/login',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole, hasPermission, hasTenant } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until authentication state is determined
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(`${fallbackUrl}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
      router.push('/unauthorized?reason=role');
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => hasPermission(permission))) {
      router.push('/unauthorized?reason=permission');
      return;
    }

    // Check tenant requirement
    if (requiredTenant && !hasTenant(requiredTenant)) {
      router.push('/unauthorized?reason=tenant');
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    hasRole,
    hasPermission,
    hasTenant,
    requiredRoles,
    requiredPermissions,
    requiredTenant,
    router,
    fallbackUrl,
  ]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingComponent />;
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return null;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => hasPermission(permission))) {
    return null;
  }

  // Check tenant requirement
  if (requiredTenant && !hasTenant(requiredTenant)) {
    return null;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
}
