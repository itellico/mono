import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '@modules/permissions/permission.service';
import { MetricsService } from '../metrics/metrics.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private metricsService: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Support both old and new decorator keys for backward compatibility
    const requiredPermissions = 
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ||
      this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Use the new PermissionService for checking permissions
    const hasPermission = await this.permissionService.hasAnyPermission(user.id, requiredPermissions);

    // Extract tier for metrics
    const tier = this.extractTierFromRoute(request.url);
    
    // Get user permissions for metrics (use cache from PermissionService)
    const userPermissions = await this.permissionService.getUserPermissions(user.id);
    const userPermissionNames = userPermissions.map(p => p.name);
    
    // Record permission check metrics for each required permission
    requiredPermissions.forEach(permission => {
      const granted = userPermissionNames.includes(permission);
      this.metricsService.incrementPermissionChecks(permission, granted, tier);
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private extractTierFromRoute(url: string): string {
    if (url.includes('/api/v2/public/')) return 'public';
    if (url.includes('/api/v2/user/')) return 'user';
    if (url.includes('/api/v2/account/')) return 'account';
    if (url.includes('/api/v2/tenant/')) return 'tenant';
    if (url.includes('/api/v2/platform/')) return 'platform';
    return 'unknown';
  }
}