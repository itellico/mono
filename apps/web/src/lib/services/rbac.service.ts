/**
 * RBAC Service - Complete 4-Tier Permission System
 * 
 * Implements the full RBAC architecture with:
 * - 4-tier hierarchy (Platform → Tenant → Account → User)
 * - Redis caching for performance
 * - Permission inheritance logic
 * - Domain-aware permission checking
 * - Audit logging integration
 * 
 * Integrates with the domain routing system for secure multi-tenant access.
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Types
export interface UserContext {
  userId: number;
  userUuid: string;
  tenantId?: number;
  tenantSlug?: string;
  accountId?: number;
  roles: string[];
  permissions?: string[];
  domainType?: 'admin' | 'tenant' | 'api';
  hostname?: string;
}

export interface PermissionCheck {
  permission: string;
  resource?: string;
  resourceId?: string;
  tenantId?: number;
  accountId?: number;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  source?: 'direct' | 'inherited' | 'wildcard' | 'super_admin';
  cached?: boolean;
  checkDuration?: number;
}

// Permission patterns following the 4-tier architecture
export const PERMISSION_PATTERNS = {
  // Platform tier - highest level
  PLATFORM: {
    SUPER_ADMIN: 'platform.*.global',
    SYSTEM_MANAGE: 'system.manage.global',
    TENANT_MANAGE: 'tenants.manage.global',
    PLATFORM_MONITOR: 'platform.monitor.global',
  },
  
  // Tenant tier - tenant-scoped
  TENANT: {
    ADMIN: 'tenant.*.manage',
    CONTENT_MODERATE: 'content.moderate.tenant',
    MARKETPLACE_MANAGE: 'marketplace.manage.tenant',
    USERS_MANAGE: 'users.manage.tenant',
    ANALYTICS_VIEW: 'analytics.view.tenant',
  },
  
  // Account tier - account-scoped
  ACCOUNT: {
    OWNER: 'account.*.own',
    PROFILES_MANAGE: 'profiles.manage.account',
    JOBS_MANAGE: 'jobs.manage.account',
    TEAM_MANAGE: 'team.manage.account',
    BILLING_VIEW: 'billing.view.account',
  },
  
  // User tier - individual resources
  USER: {
    PROFILE_EDIT: 'profiles.edit.own',
    PROFILE_VIEW: 'profiles.view.own',
    JOBS_APPLY: 'jobs.apply.own',
    MEDIA_UPLOAD: 'media.upload.own',
    SETTINGS_EDIT: 'settings.edit.own',
  }
} as const;

// Role hierarchy with inheritance
export const ROLE_HIERARCHY = {
  'super_admin': {
    level: 5,
    inherits: [],
    permissions: ['platform.*.global', 'system.*.global', 'tenants.*.global']
  },
  'tenant_admin': {
    level: 4,
    inherits: ['content_moderator', 'account_owner'],
    permissions: ['tenant.*.manage', 'content.*.tenant', 'marketplace.*.tenant']
  },
  'content_moderator': {
    level: 3,
    inherits: ['team_member'],
    permissions: ['content.moderate.tenant', 'content.view.tenant', 'media.moderate.tenant']
  },
  'account_owner': {
    level: 2,
    inherits: ['team_member'],
    permissions: ['account.*.own', 'profiles.*.account', 'jobs.*.account', 'team.*.account']
  },
  'team_member': {
    level: 1,
    inherits: [],
    permissions: ['profiles.view.account', 'jobs.view.account']
  },
  'user': {
    level: 0,
    inherits: [],
    permissions: ['profiles.*.own', 'settings.*.own']
  }
} as const;

export class RBACService {
  private static instance: RBACService;
  
  // Cache TTL: 5 minutes for permissions
  private readonly CACHE_TTL = 300;
  
  // Redis key patterns following platform standards
  private readonly REDIS_KEYS = {
    userPermissions: (userId: number, tenantId?: number) => 
      `tenant:${tenantId || 0}:user:${userId}:permissions`,
    roleCache: (roleId: number) => `platform:role:${roleId}:permissions`,
    permissionCache: (pattern: string) => `platform:permission:${pattern}`,
    userRoles: (userId: number, tenantId?: number) => 
      `tenant:${tenantId || 0}:user:${userId}:roles`,
  };

  private constructor() {}

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  /**
   * Check if user has permission - main entry point
   */
  async hasPermission(
    userContext: UserContext,
    check: PermissionCheck
  ): Promise<PermissionResult> {
    const startTime = Date.now();
    
    try {
      // Super admin bypass - they have all permissions
      if (userContext.roles?.includes('super_admin')) {
        return {
          allowed: true,
          source: 'super_admin',
          checkDuration: Date.now() - startTime
        };
      }

      // Get user permissions (cached)
      const permissions = await this.getUserPermissions(userContext);
      
      // Check direct permission match
      const directMatch = this.checkDirectPermission(permissions, check.permission);
      if (directMatch.allowed) {
        return {
          ...directMatch,
          checkDuration: Date.now() - startTime
        };
      }

      // Check wildcard permissions
      const wildcardMatch = this.checkWildcardPermissions(permissions, check);
      if (wildcardMatch.allowed) {
        return {
          ...wildcardMatch,
          checkDuration: Date.now() - startTime
        };
      }

      // Check inherited permissions
      const inheritedMatch = await this.checkInheritedPermissions(userContext, check);
      if (inheritedMatch.allowed) {
        return {
          ...inheritedMatch,
          checkDuration: Date.now() - startTime
        };
      }

      // Permission denied
      const result: PermissionResult = {
        allowed: false,
        reason: `User lacks permission: ${check.permission}`,
        checkDuration: Date.now() - startTime
      };

      // Audit the permission check
      await this.auditPermissionCheck(userContext, check, result);
      
      return result;
    } catch (error) {
      logger.error('Permission check failed', { error, userContext, check });
      return {
        allowed: false,
        reason: 'Permission check error',
        checkDuration: Date.now() - startTime
      };
    }
  }

  /**
   * Get user permissions with Redis caching
   */
  async getUserPermissions(userContext: UserContext): Promise<string[]> {
    const cacheKey = this.REDIS_KEYS.userPermissions(
      userContext.userId, 
      userContext.tenantId
    );

    try {
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from database
      const dbPermissions = await this.fetchUserPermissionsFromDB(userContext);
      
      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dbPermissions));
      
      return dbPermissions;
    } catch (error) {
      logger.error('Failed to get user permissions', { error, userContext });
      // Fallback to direct DB query
      return this.fetchUserPermissionsFromDB(userContext);
    }
  }

  /**
   * Fetch user permissions from database
   */
  private async fetchUserPermissionsFromDB(userContext: UserContext): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: userContext.userId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions: string[] = [];
    
    for (const userRole of userRoles) {
      // Add direct role permissions
      for (const rolePermission of userRole.role.permissions) {
        const permission = rolePermission.permission;
        if (permission.pattern) {
          permissions.push(permission.pattern);
        } else if (permission.name) {
          permissions.push(permission.name);
        }
      }
      
      // Add inherited permissions
      const inheritedPermissions = await this.getInheritedPermissions(userRole.role.code);
      permissions.push(...inheritedPermissions);
    }

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Get inherited permissions based on role hierarchy
   */
  private async getInheritedPermissions(roleCode: string): Promise<string[]> {
    const hierarchy = ROLE_HIERARCHY[roleCode as keyof typeof ROLE_HIERARCHY];
    if (!hierarchy || !hierarchy.inherits.length) {
      return [];
    }

    const inheritedPermissions: string[] = [];
    
    for (const inheritedRole of hierarchy.inherits) {
      const rolePermissions = await this.getRolePermissions(inheritedRole);
      inheritedPermissions.push(...rolePermissions);
      
      // Recursive inheritance
      const deepInherited = await this.getInheritedPermissions(inheritedRole);
      inheritedPermissions.push(...deepInherited);
    }

    return [...new Set(inheritedPermissions)];
  }

  /**
   * Get permissions for a specific role
   */
  private async getRolePermissions(roleCode: string): Promise<string[]> {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) return [];

    return role.permissions.map(rp => 
      rp.permission.pattern || rp.permission.name
    );
  }

  /**
   * Check direct permission match
   */
  private checkDirectPermission(permissions: string[], requiredPermission: string): PermissionResult {
    if (permissions.includes(requiredPermission)) {
      return { allowed: true, source: 'direct' };
    }
    return { allowed: false };
  }

  /**
   * Check wildcard permissions
   */
  private checkWildcardPermissions(permissions: string[], check: PermissionCheck): PermissionResult {
    for (const permission of permissions) {
      if (this.matchesWildcard(permission, check.permission)) {
        return { allowed: true, source: 'wildcard' };
      }
    }
    return { allowed: false };
  }

  /**
   * Check inherited permissions
   */
  private async checkInheritedPermissions(
    userContext: UserContext, 
    check: PermissionCheck
  ): Promise<PermissionResult> {
    // This would check permissions inherited through role hierarchy
    // Implementation depends on the specific inheritance rules
    return { allowed: false };
  }

  /**
   * Match wildcard patterns
   */
  private matchesWildcard(permissionPattern: string, requiredPermission: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = permissionPattern
      .replace(/\*/g, '[^.]*')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(requiredPermission);
  }

  /**
   * Invalidate user permission cache
   */
  async invalidateUserPermissions(userId: number, tenantId?: number): Promise<void> {
    const cacheKey = this.REDIS_KEYS.userPermissions(userId, tenantId);
    const rolesKey = this.REDIS_KEYS.userRoles(userId, tenantId);
    
    try {
      await redis.del(cacheKey, rolesKey);
      logger.info('User permission cache invalidated', { userId, tenantId });
    } catch (error) {
      logger.error('Failed to invalidate user permission cache', { error, userId, tenantId });
    }
  }

  /**
   * Audit permission check
   */
  private async auditPermissionCheck(
    userContext: UserContext,
    check: PermissionCheck,
    result: PermissionResult
  ): Promise<void> {
    try {
      await prisma.permissionAudit.create({
        data: {
          userid: userContext.userId,
          permissionpattern: check.permission,
          resource: check.resource,
          action: check.permission.split('.')[1] || 'unknown',
          granted: result.allowed,
          checkdurationms: result.checkDuration,
          tenantid: userContext.tenantId,
          requestid: null, // Would be set from request context
        }
      });
    } catch (error) {
      logger.error('Failed to audit permission check', { error, userContext, check });
    }
  }

  /**
   * Domain-aware permission checking
   * Integrates with the domain routing system
   */
  async checkDomainPermission(
    userContext: UserContext,
    permission: string,
    domainType: 'admin' | 'tenant' | 'api'
  ): Promise<PermissionResult> {
    // Admin domain requires admin permissions
    if (domainType === 'admin') {
      const adminPermissions = [
        'admin.access',
        'tenant.manage',
        'platform.access'
      ];
      
      for (const adminPerm of adminPermissions) {
        const result = await this.hasPermission(userContext, { permission: adminPerm });
        if (result.allowed) {
          return result;
        }
      }
      
      return { 
        allowed: false, 
        reason: 'Admin domain access denied - insufficient permissions' 
      };
    }

    // Tenant domain requires tenant context
    if (domainType === 'tenant' && !userContext.tenantId) {
      return { 
        allowed: false, 
        reason: 'Tenant domain access denied - missing tenant context' 
      };
    }

    // Check the specific permission
    return this.hasPermission(userContext, { permission });
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance();