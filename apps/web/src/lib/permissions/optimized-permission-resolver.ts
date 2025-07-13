import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface Permission {
  pattern: string;
  resource: string;
  action: string;
  scope: string;
  isWildcard: boolean;
  priority: number;
}

export interface PermissionCheckResult {
  granted: boolean;
  source?: 'role' | 'direct' | 'cache' | 'inheritance';
  matchedPattern?: string;
  checkDurationMs?: number;
}

export interface PermissionContext {
  tenantId?: number;
  resourceType?: string;
  resourceId?: string;
  userId: number;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Optimized Permission Resolver with wildcard support and caching
 */
export class OptimizedPermissionResolver {
  private static instance: OptimizedPermissionResolver;
  private cacheExpirationMinutes: number = 15;
  private enableCaching: boolean = true;
  private enableAuditLog: boolean = true;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): OptimizedPermissionResolver {
    if (!OptimizedPermissionResolver.instance) {
      OptimizedPermissionResolver.instance = new OptimizedPermissionResolver();
    }
    return OptimizedPermissionResolver.instance;
  }

  private async loadConfig(): Promise<void> {
    try {
      const config = await prisma.rBACConfig.findUnique({ where: { id: 1 } });
      if (config) {
        this.cacheExpirationMinutes = config.cacheExpirationMinutes;
        this.enableCaching = config.enableCaching;
        this.enableAuditLog = config.enableAuditLog;
      }
    } catch (error) {
      logger.error('Failed to load RBAC config', { error });
    }
  }

  /**
   * Check if user has required permission
   */
  async hasPermission(
    context: PermissionContext,
    requiredPermission: string
  ): Promise<PermissionCheckResult> {
    const startTime = Date.now();
    let result: PermissionCheckResult = { granted: false };

    try {
      // Check cache first if enabled
      if (this.enableCaching) {
        const cached = await this.checkCache(context.userId, requiredPermission);
        if (cached !== null) {
          result = { granted: cached, source: 'cache' };
          await this.auditPermissionCheck(context, requiredPermission, result, startTime);
          return result;
        }
      }

      // Get user's effective permissions
      const userPermissions = await this.getUserPermissions(context.userId);

      // Check for direct match or wildcard match
      for (const permission of userPermissions) {
        if (this.matchesPermission(permission.pattern, requiredPermission)) {
          result = {
            granted: true,
            source: permission.source as 'role' | 'direct',
            matchedPattern: permission.pattern
          };
          break;
        }
      }

      // Cache the result
      if (this.enableCaching) {
        await this.cachePermissionCheck(context.userId, requiredPermission, result.granted);
      }

      // Audit the check
      await this.auditPermissionCheck(context, requiredPermission, result, startTime);

      return result;
    } catch (error) {
      logger.error('Permission check failed', { error, context, requiredPermission });
      result = { granted: false };
      await this.auditPermissionCheck(context, requiredPermission, result, startTime);
      return result;
    }
  }

  /**
   * Check if a permission pattern matches the required permission
   */
  private matchesPermission(pattern: string, required: string): boolean {
    // Direct match
    if (pattern === required) return true;

    // Wildcard match
    const patternParts = pattern.split('.');
    const requiredParts = required.split('.');

    if (patternParts.length !== requiredParts.length) return false;

    return patternParts.every((part, index) => 
      part === '*' || part === requiredParts[index]
    );
  }

  /**
   * Get all effective permissions for a user
   */
  private async getUserPermissions(userId: number): Promise<Array<{
    pattern: string;
    resource: string;
    action: string;
    scope: string;
    source: string;
  }>> {
    // Check permission cache first
    const cacheKey = `user:${userId}:permissions`;
    
    if (this.enableCaching) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Use the view for efficient permission retrieval
    const permissions = await prisma.$queryRaw<Array<{
      pattern: string;
      resource: string;
      action: string;
      scope: string;
      source: string;
    }>>`
      SELECT * FROM user_effective_permissions
      WHERE "userId" = ${userId}
      ORDER BY source DESC, pattern
    `;

    // Expand wildcards and add inherited permissions
    const expandedPermissions = await this.expandPermissions(permissions);

    // Cache the results
    if (this.enableCaching) {
      await redis.setex(
        cacheKey,
        this.cacheExpirationMinutes * 60,
        JSON.stringify(expandedPermissions)
      );

      // Also update the UserPermissionCache table
      await prisma.userPermissionCache.upsert({
        where: { userId },
        create: {
          userId,
          permissions: expandedPermissions.map(p => p.pattern),
          computedAt: new Date(),
          expiresAt: new Date(Date.now() + this.cacheExpirationMinutes * 60 * 1000),
          cacheVersion: 1
        },
        update: {
          permissions: expandedPermissions.map(p => p.pattern),
          computedAt: new Date(),
          expiresAt: new Date(Date.now() + this.cacheExpirationMinutes * 60 * 1000),
          cacheVersion: { increment: 1 }
        }
      });
    }

    return expandedPermissions;
  }

  /**
   * Expand permissions based on inheritance rules
   */
  private async expandPermissions(permissions: Array<any>): Promise<Array<any>> {
    const expanded = [...permissions];
    const patterns = new Set(permissions.map(p => p.pattern));

    // Get permission inheritance rules
    const inheritanceRules = await prisma.permissionInheritance.findMany({
      include: {
        child: true
      },
      where: {
        parentId: {
          in: permissions.map(p => p.id).filter(Boolean)
        }
      }
    });

    // Add inherited permissions
    for (const rule of inheritanceRules) {
      if (!patterns.has(rule.child.pattern)) {
        expanded.push({
          pattern: rule.child.pattern,
          resource: rule.child.resource,
          action: rule.child.action,
          scope: rule.child.scope,
          source: 'inheritance'
        });
        patterns.add(rule.child.pattern);
      }
    }

    // Apply scope inheritance (global > tenant > own)
    const scopeHierarchy: Record<string, string[]> = {
      global: ['global', 'tenant', 'own'],
      tenant: ['tenant', 'own'],
      own: ['own']
    };

    const additionalPermissions: Array<any> = [];
    
    for (const perm of expanded) {
      const inheritedScopes = scopeHierarchy[perm.scope] || [perm.scope];
      
      for (const scope of inheritedScopes) {
        if (scope !== perm.scope) {
          const newPattern = perm.pattern.replace(`.${perm.scope}`, `.${scope}`);
          if (!patterns.has(newPattern)) {
            additionalPermissions.push({
              ...perm,
              pattern: newPattern,
              scope: scope,
              source: 'inheritance'
            });
            patterns.add(newPattern);
          }
        }
      }
    }

    return [...expanded, ...additionalPermissions];
  }

  /**
   * Check cache for permission result
   */
  private async checkCache(userId: number, permission: string): Promise<boolean | null> {
    const cacheKey = `perm:${userId}:${permission}`;
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache permission check result
   */
  private async cachePermissionCheck(
    userId: number, 
    permission: string, 
    granted: boolean
  ): Promise<void> {
    const cacheKey = `perm:${userId}:${permission}`;
    await redis.setex(cacheKey, 300, JSON.stringify(granted)); // 5-minute cache
  }

  /**
   * Audit permission check
   */
  private async auditPermissionCheck(
    context: PermissionContext,
    permissionPattern: string,
    result: PermissionCheckResult,
    startTime: number
  ): Promise<void> {
    if (!this.enableAuditLog) return;

    try {
      const checkDurationMs = Date.now() - startTime;
      
      await prisma.permissionAudit.create({
        data: {
          userId: context.userId,
          permissionPattern,
          resource: context.resourceId,
          action: permissionPattern.split('.')[1] || 'unknown',
          granted: result.granted,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          checkDurationMs,
          tenantId: context.tenantId
        }
      });
    } catch (error) {
      logger.error('Failed to audit permission check', { error });
    }
  }

  /**
   * Clear cache for a user
   */
  async clearUserCache(userId: number): Promise<void> {
    const cacheKey = `user:${userId}:permissions`;
    await redis.del(cacheKey);
    
    // Clear all permission checks for this user
    const keys = await redis.keys(`perm:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Clear database cache
    await prisma.userPermissionCache.deleteMany({
      where: { userId }
    });
  }

  /**
   * Pre-expand wildcard patterns for performance
   */
  async expandWildcardPattern(pattern: string): Promise<string[]> {
    // Check expansion cache
    const cached = await prisma.permissionExpansion.findUnique({
      where: { pattern }
    });

    if (cached && cached.computedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return cached.expandedPatterns as string[];
    }

    // Compute expansions
    const expanded: string[] = [];
    const [resource, action, scope] = pattern.split('.');

    if (resource === '*') {
      // Get all resources
      const resources = await prisma.permission.findMany({
        select: { resource: true },
        distinct: ['resource']
      });
      
      for (const r of resources) {
        expanded.push(...await this.expandWildcardPattern(`${r.resource}.${action}.${scope}`));
      }
    } else if (action === '*') {
      // Get all actions for this resource
      const actions = await prisma.permission.findMany({
        where: { resource },
        select: { action: true },
        distinct: ['action']
      });
      
      for (const a of actions) {
        if (a.action !== '*') {
          expanded.push(`${resource}.${a.action}.${scope}`);
        }
      }
    } else {
      // No wildcard, return as is
      expanded.push(pattern);
    }

    // Cache the expansion
    await prisma.permissionExpansion.upsert({
      where: { pattern },
      create: {
        pattern,
        expandedPatterns: expanded,
        computedAt: new Date()
      },
      update: {
        expandedPatterns: expanded,
        computedAt: new Date()
      }
    });

    return expanded;
  }

  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: number,
    permissionPattern: string,
    grantedBy: number,
    options?: {
      validUntil?: Date;
      resourceType?: string;
      resourceId?: string;
      conditions?: any;
      reason?: string;
    }
  ): Promise<void> {
    // Find or create permission
    let permission = await prisma.permission.findFirst({
      where: { pattern: permissionPattern }
    });

    if (!permission) {
      const [resource, action, scope] = permissionPattern.split('.');
      permission = await prisma.permission.create({
        data: {
          name: permissionPattern,
          pattern: permissionPattern,
          resource,
          action,
          scope,
          isWildcard: permissionPattern.includes('*'),
          priority: 100
        }
      });
    }

    // Grant permission
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id
        }
      },
      create: {
        userId,
        permissionId: permission.id,
        granted: true,
        grantedBy,
        grantReason: options?.reason,
        validUntil: options?.validUntil,
        resourceType: options?.resourceType,
        resourceId: options?.resourceId,
        conditions: options?.conditions
      },
      update: {
        granted: true,
        grantedBy,
        grantReason: options?.reason,
        validUntil: options?.validUntil,
        updatedAt: new Date()
      }
    });

    // Clear cache
    await this.clearUserCache(userId);
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(
    userId: number,
    permissionPattern: string
  ): Promise<void> {
    const permission = await prisma.permission.findFirst({
      where: { pattern: permissionPattern }
    });

    if (permission) {
      await prisma.userPermission.update({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        data: {
          granted: false,
          updatedAt: new Date()
        }
      });
    }

    // Clear cache
    await this.clearUserCache(userId);
  }
}