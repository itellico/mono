import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '@modules/permissions/permission.service';
import { MetricsService } from '../metrics/metrics.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { FastifyRequest } from 'fastify';

/**
 * Enhanced Permission Guard with Wildcard Support
 * Follows NestJS best practices with Fastify integration
 */
@Injectable()
export class EnhancedPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private metricsService: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract required permissions from decorators
    const requiredPermissions = this.extractRequiredPermissions(context);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    // Get request and user from Fastify context
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as any).user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check permissions with wildcard support
    const hasPermission = await this.checkPermissionsWithWildcards(
      user.id,
      requiredPermissions,
    );

    // Record metrics
    this.recordMetrics(request, user.id, requiredPermissions, hasPermission);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Extract required permissions from multiple decorator sources
   */
  private extractRequiredPermissions(context: ExecutionContext): string[] {
    // Check handler-level permissions first, then class-level
    const permissions = 
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ||
      this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ||
      [];

    return permissions;
  }

  /**
   * Check permissions with enhanced wildcard support
   */
  private async checkPermissionsWithWildcards(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    // Get user's permissions and roles
    const userPermissions = await this.permissionService.getUserPermissions(userId);
    const userRoles = await this.permissionService.getUserRoles(userId);

    // Super admin bypass - has all permissions
    if (userRoles.some(r => r.code === 'super_admin')) {
      return true;
    }

    // Check each required permission
    for (const required of requiredPermissions) {
      const hasPermission = userPermissions.some(userPerm => 
        this.patternMatchesPermission(userPerm.name, required)
      );

      if (hasPermission) {
        return true; // Any match is sufficient
      }
    }

    return false;
  }

  /**
   * Enhanced pattern matching with wildcard support
   * Supports patterns like:
   * - "*" (matches everything)
   * - "platform.*" (matches all platform permissions)
   * - "*.users.*" (matches all user operations across modules)
   * - "*.*.read" (matches all read operations)
   * - "platform.*.manage" (matches all manage operations in platform)
   */
  private patternMatchesPermission(pattern: string, permission: string): boolean {
    // Exact match
    if (pattern === permission) {
      return true;
    }

    // Super wildcard
    if (pattern === '*') {
      return true;
    }

    const patternParts = pattern.split('.');
    const permissionParts = permission.split('.');

    // If lengths don't match, patterns like "platform.*" need special handling
    if (patternParts.length === 2 && patternParts[1] === '*') {
      // Module wildcard (e.g., "platform.*")
      return permission.startsWith(patternParts[0] + '.');
    }

    // Same length patterns
    if (patternParts.length === permissionParts.length) {
      return patternParts.every((part, index) => 
        part === '*' || part === permissionParts[index]
      );
    }

    return false;
  }

  /**
   * Record permission check metrics
   */
  private recordMetrics(
    request: FastifyRequest,
    userId: string,
    permissions: string[],
    granted: boolean,
  ): void {
    const tier = this.extractTierFromRoute(request.url);
    
    permissions.forEach(permission => {
      this.metricsService.incrementPermissionChecks(permission, granted, tier);
    });

    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Permission check:', {
        userId,
        permissions,
        granted,
        tier,
        url: request.url,
      });
    }
  }

  /**
   * Extract tier from request URL
   */
  private extractTierFromRoute(url: string): string {
    const tierMatch = url.match(/\/api\/v\d+\/(\w+)\//);
    return tierMatch ? tierMatch[1] : 'unknown';
  }
}