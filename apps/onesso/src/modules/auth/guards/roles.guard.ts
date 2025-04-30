import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin role
    if (user.isSuperAdmin) {
      return true;
    }

    // Check if user has tenant-admin role and is accessing their own tenant
    if (
      requiredRoles.includes('tenant-admin') &&
      user.roles?.includes('tenant-admin') &&
      this.isTenantResource(context, user.tenant_id)
    ) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private isTenantResource(context: ExecutionContext, userTenantId: string): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantName = request.params.name;

    // If no tenant name in params, this is not a tenant-specific resource
    if (!tenantName) {
      return false;
    }

    // Check if the tenant in the URL matches the user's tenant
    return tenantName === userTenantId;
  }
}
