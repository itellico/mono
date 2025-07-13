import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PermissionCacheService } from '@/modules/cache/services/permission-cache.service';
import { CacheInvalidatorService } from '@/modules/cache/services/cache-invalidator.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreatePermissionDto, UpdatePermissionDto, AssignPermissionDto } from './dto';
import { Permission, Prisma } from '@prisma/client';

/**
 * Permission service with hierarchical permissions and caching
 */
@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionCache: PermissionCacheService,
    private readonly cacheInvalidator: CacheInvalidatorService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new permission
   */
  async create(
    dto: CreatePermissionDto,
    createdBy: number,
  ): Promise<Permission> {
    // Check if permission already exists
    const existing = await this.prisma.permission.findUnique({
      where: {
        name: `${dto.domain}.${dto.resource}.${dto.action}${dto.scope ? '.' + dto.scope : ''}`,
      },
    });

    if (existing) {
      throw new ConflictException('Permission already exists');
    }

    const permission = await this.prisma.permission.create({
      data: {
        domain: dto.domain,
        resource: dto.resource,
        action: dto.action,
        scope: dto.scope,
        name: `${dto.domain}.${dto.resource}.${dto.action}${dto.scope ? '.' + dto.scope : ''}`,
        displayName: dto.displayName,
        description: dto.description,
        category: dto.category || 'operations',
        isSystem: dto.isSystem || false,
        isDangerous: dto.isDangerous || false,
        requiresMfa: dto.requiresMfa || false,
        cacheTTL: dto.cacheTTL || 3600,
        createdBy,
      },
    });

    // Invalidate all permission caches
    await this.cacheInvalidator.invalidatePattern('perm:def:*');

    // Audit log
    await this.auditService.logEvent({
      category: 'PERMISSION',
      eventType: 'permission_created',
      entityType: 'permission',
      entityId: permission.uuid,
      userId: createdBy,
      operation: 'create_permission',
      metadata: {
        permissionName: permission.name,
      },
    });

    return permission;
  }

  /**
   * Get all permissions with filtering
   */
  async findAll(options?: {
    domain?: string;
    resource?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<Permission[]> {
    const where: Prisma.PermissionWhereInput = {};

    if (options?.domain) where.domain = options.domain;
    if (options?.resource) where.resource = options.resource;
    if (options?.category) where.category = options.category;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    return this.prisma.permission.findMany({
      where,
      orderBy: [
        { domain: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
        { scope: 'asc' },
      ],
    });
  }

  /**
   * Get permission hierarchy tree
   */
  async getPermissionTree(): Promise<any> {
    const permissions = await this.findAll({ isActive: true });
    
    const tree: any = {};

    for (const perm of permissions) {
      if (!tree[perm.domain]) {
        tree[perm.domain] = {};
      }
      if (!tree[perm.domain][perm.resource]) {
        tree[perm.domain][perm.resource] = {};
      }
      if (!tree[perm.domain][perm.resource][perm.action]) {
        tree[perm.domain][perm.resource][perm.action] = {};
      }
      
      const node = {
        id: perm.id,
        uuid: perm.uuid,
        name: perm.name,
        displayName: perm.displayName,
        description: perm.description,
        isDangerous: perm.isDangerous,
        requiresMfa: perm.requiresMfa,
      };

      if (perm.scope) {
        tree[perm.domain][perm.resource][perm.action][perm.scope] = node;
      } else {
        tree[perm.domain][perm.resource][perm.action]['_default'] = node;
      }
    }

    return tree;
  }

  /**
   * Assign permission to user
   */
  async assignToUser(
    dto: AssignPermissionDto,
    assignedBy: number,
    tenantId: number,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { uuid: dto.userUuid },
    });

    const permission = await this.prisma.permission.findFirst({
      where: { uuid: dto.permissionUuid },
    });

    if (!user || !permission) {
      throw new NotFoundException('User or permission not found');
    }

    // Check if already assigned
    const existing = await this.prisma.userPermission.findFirst({
      where: {
        userId: user.id,
        permissionId: permission.id,
        tenantId: dto.tenantId || tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to user');
    }

    // Create assignment
    await this.prisma.userPermission.create({
      data: {
        userId: user.id,
        permissionId: permission.id,
        granted: dto.granted ?? true,
        tenantId: dto.tenantId || tenantId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        conditions: dto.conditions,
        validFrom: dto.validFrom || new Date(),
        validUntil: dto.validUntil,
        grantedBy: assignedBy,
        grantReason: dto.reason,
        priority: dto.priority || 0,
      },
    });

    // Invalidate user's permission cache
    await this.permissionCache.invalidateUserPermissions(user.id, tenantId);

    // Audit log
    await this.auditService.logEvent({
      category: 'PERMISSION',
      eventType: 'permission_granted',
      severity: 'WARN',
      entityType: 'user',
      entityId: user.uuid,
      userId: assignedBy,
      tenantId,
      operation: 'grant_permission',
      metadata: {
        permissionId: permission.uuid,
        permissionName: permission.name,
        granted: dto.granted ?? true,
        conditions: dto.conditions,
      },
    });
  }

  /**
   * Revoke permission from user
   */
  async revokeFromUser(
    userUuid: string,
    permissionUuid: string,
    revokedBy: number,
    tenantId: number,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { uuid: userUuid },
    });

    const permission = await this.prisma.permission.findFirst({
      where: { uuid: permissionUuid },
    });

    if (!user || !permission) {
      throw new NotFoundException('User or permission not found');
    }

    const deleted = await this.prisma.userPermission.deleteMany({
      where: {
        userId: user.id,
        permissionId: permission.id,
        tenantId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Permission assignment not found');
    }

    // Invalidate user's permission cache
    await this.permissionCache.invalidateUserPermissions(user.id, tenantId);

    // Audit log
    await this.auditService.logEvent({
      category: 'PERMISSION',
      eventType: 'permission_revoked',
      severity: 'WARN',
      entityType: 'user',
      entityId: user.uuid,
      userId: revokedBy,
      tenantId,
      operation: 'revoke_permission',
      metadata: {
        permissionId: permission.uuid,
        permissionName: permission.name,
      },
    });
  }

  /**
   * Check if user has permission
   */
  async checkPermission(
    userId: number,
    tenantId: number,
    permission: string,
    context?: {
      resourceType?: string;
      resourceId?: string;
      conditions?: Record<string, any>;
    },
  ): Promise<boolean> {
    // Use cached check
    const hasPermission = await this.permissionCache.checkPermission(
      userId,
      tenantId,
      permission,
    );

    // Log permission check for audit
    await this.auditService.logEvent({
      category: 'PERMISSION',
      eventType: 'permission_check',
      entityType: 'user',
      entityId: userId.toString(),
      userId,
      tenantId,
      operation: 'check_permission',
      metadata: {
        permission,
        granted: hasPermission,
        context,
      },
      severity: hasPermission ? 'DEBUG' : 'INFO',
    });

    return hasPermission;
  }

  /**
   * Get user's effective permissions
   */
  async getUserPermissions(
    userUuid: string,
    tenantId: number,
  ): Promise<{
    direct: string[];
    fromRoles: string[];
    effective: string[];
    denied: string[];
  }> {
    const user = await this.prisma.user.findFirst({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get direct permissions
    const directPerms = await this.prisma.userPermission.findMany({
      where: {
        userId: user.id,
        tenantId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      include: {
        permission: true,
      },
    });

    const direct = directPerms
      .filter(up => up.granted)
      .map(up => up.permission.name);

    const denied = directPerms
      .filter(up => !up.granted)
      .map(up => up.permission.name);

    // Get all permissions (cached)
    const effective = await this.permissionCache.getUserPermissions(
      user.id,
      tenantId,
    );

    // Calculate from roles (effective - direct)
    const fromRoles = effective.filter(p => !direct.includes(p));

    return {
      direct,
      fromRoles,
      effective,
      denied,
    };
  }

  /**
   * Sync permissions from configuration
   */
  async syncPermissions(
    permissions: Array<{
      domain: string;
      resource: string;
      action: string;
      scope?: string;
      displayName: string;
      description?: string;
      category?: string;
      isDangerous?: boolean;
    }>,
    syncedBy: number,
  ): Promise<{
    created: number;
    updated: number;
    unchanged: number;
  }> {
    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const perm of permissions) {
      const name = `${perm.domain}.${perm.resource}.${perm.action}${perm.scope ? '.' + perm.scope : ''}`;
      
      const existing = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (!existing) {
        await this.create(
          {
            ...perm,
            isSystem: true,
          },
          syncedBy,
        );
        created++;
      } else {
        // Check if update needed
        const needsUpdate = 
          existing.displayName !== perm.displayName ||
          existing.description !== perm.description ||
          existing.category !== perm.category ||
          existing.isDangerous !== (perm.isDangerous ?? false);

        if (needsUpdate) {
          await this.prisma.permission.update({
            where: { id: existing.id },
            data: {
              displayName: perm.displayName,
              description: perm.description,
              category: perm.category,
              isDangerous: perm.isDangerous,
              updatedAt: new Date(),
            },
          });
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    // Invalidate permission definition cache
    await this.cacheInvalidator.invalidatePattern('perm:def:*');

    return { created, updated, unchanged };
  }

  /**
   * Get permission statistics
   */
  async getStats(tenantId?: number): Promise<any> {
    const [
      totalPermissions,
      totalRoles,
      totalAssignments,
      recentChecks,
    ] = await Promise.all([
      this.prisma.permission.count({ where: { isActive: true } }),
      this.prisma.role.count({ where: { isActive: true, tenantId } }),
      this.prisma.userPermission.count({ where: { tenantId } }),
      this.prisma.permissionAudit.count({
        where: {
          tenantId,
          checkTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Get cache stats
    const cacheStats = await this.permissionCache.getCacheStats();

    return {
      permissions: {
        total: totalPermissions,
        byDomain: await this.getPermissionsByDomain(),
      },
      roles: {
        total: totalRoles,
      },
      assignments: {
        total: totalAssignments,
      },
      usage: {
        checksLast24h: recentChecks,
      },
      cache: cacheStats,
    };
  }

  private async getPermissionsByDomain(): Promise<any> {
    const result = await this.prisma.permission.groupBy({
      by: ['domain'],
      _count: true,
      where: { isActive: true },
    });

    return result.reduce((acc, item) => {
      acc[item.domain] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }
}