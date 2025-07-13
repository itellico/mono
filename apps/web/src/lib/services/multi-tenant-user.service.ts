/**
 * @fileoverview Multi-Tenant User Service - Cross-tenant user management for itellico Mono
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @description
 * This service manages multi-tenant user operations including:
 * - User memberships across multiple tenants/accounts
 * - Cross-tenant invitations and onboarding
 * - Permission inheritance across contexts
 * - Activity tracking and access management
 * - Redis caching for performance
 */

import { and, eq, sql, desc, asc, inArray, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import {
  userMemberships,
  invitations,
  userSubscriptions,
  type UserMembership,
  type Invitation,
  type UserSubscription
} from '@/lib/schemas/subscriptions';
import { users, accounts } from '@/lib/schemas/auth';
import { tenants } from '@/lib/schemas/tenants';
import { roles, userRoles, type Role } from '@/lib/schemas/permissions';
import { UnifiedPermissionService, type PermissionValidationResult } from './unified-permission.service';

/**
 * User membership filters
 */
export interface MembershipFilters {
  userId?: number;
  tenantId?: number | null;
  accountId?: number | null;
  roleId?: string;
  status?: string;
  search?: string;
}

/**
 * Invitation filters
 */
export interface InvitationFilters {
  inviterUserId?: number;
  inviteeEmail?: string;
  inviteeUserId?: number;
  targetTenantId?: number | null;
  targetAccountId?: number | null;
  invitationType?: string;
  status?: string;
}

/**
 * Complete user context across all tenants
 */
export interface MultiTenantUserContext {
  user: typeof users.$inferSelect;
  memberships: Array<UserMembership & {
    tenant?: typeof tenants.$inferSelect;
    account?: typeof accounts.$inferSelect;
    role?: Role;
  }>;
  subscriptions: Array<UserSubscription>;
  pendingInvitations: Array<Invitation>;
  permissions: Record<string, PermissionValidationResult>;
  primaryTenant?: typeof tenants.$inferSelect;
  totalTenants: number;
  totalAccounts: number;
}

/**
 * Invitation creation data
 */
export interface CreateInvitationData {
  inviterUserId: number;
  inviteeEmail: string;
  targetTenantId?: number | null;
  targetAccountId?: number | null;
  roleId: string;
  permissions?: string[];
  invitationType: 'tenant' | 'account' | 'project';
  message?: string;
  expiresAt?: Date;
  metadata?: any;
}

/**
 * Membership creation data
 */
export interface CreateMembershipData {
  userId: number;
  tenantId?: number | null;
  accountId?: number | null;
  roleId: string;
  permissions?: string[];
  status?: string;
  metadata?: any;
}

/**
 * Multi-Tenant User Service
 * 
 * @description Manages user operations across multiple tenants and accounts
 * with proper isolation, permissions, and caching.
 */
export class MultiTenantUserService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'multi_tenant_user:';
  private static readonly INVITATION_CACHE_PREFIX = 'invitation:';
  private static readonly DEFAULT_INVITATION_EXPIRY_DAYS = 7;

  /**
   * Get user's complete multi-tenant context
   */
  static async getUserContext(userId: number): Promise<MultiTenantUserContext> {
    const cacheKey = `${this.CACHE_PREFIX}context:${userId}`;

    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('User context cache hit', { userId });
        return JSON.parse(cached);
      }
    } catch (redisError) {
      logger.warn('Redis unavailable for user context', {
        error: redisError instanceof Error ? redisError.message : String(redisError)
      });
    }

    // Get user information
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new Error(`User ${userId} not found`);
    }

    // Get user memberships with related data
    const memberships = await db
      .select({
        membership: userMemberships,
        tenant: tenants,
        account: accounts,
        role: roles
      })
      .from(userMemberships)
      .leftJoin(tenants, eq(userMemberships.tenantId, tenants.id))
      .leftJoin(accounts, eq(userMemberships.accountId, accounts.id))
      .leftJoin(roles, eq(userMemberships.roleId, roles.id))
      .where(eq(userMemberships.userId, userId))
      .orderBy(desc(userMemberships.joinedAt));

    // Get user subscriptions
    const subscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    // Get pending invitations
    const pendingInvitations = await db
      .select()
      .from(invitations)
      .where(
        and(
          or(
            eq(invitations.inviteeEmail, user[0].email),
            eq(invitations.inviteeUserId, userId)
          ),
          eq(invitations.status, 'pending')
        )
      )
      .orderBy(desc(invitations.createdAt));

    // Get key permissions across contexts
    const permissions: Record<string, PermissionValidationResult> = {};
    const keyPermissions = [
      'users.manage.global',
      'users.manage.tenant',
      'accounts.manage.tenant',
      'profiles.manage.account',
      'subscriptions.manage.tenant'
    ];

    for (const permission of keyPermissions) {
      permissions[permission] = await UnifiedPermissionService.hasPermission(
        userId,
        permission,
        {} // Global context check
      );
    }

    // Determine primary tenant (most recent active membership)
    const activeMemberships = memberships.filter(m => m.membership.status === 'active');
    const primaryTenant = activeMemberships.length > 0 ? activeMemberships[0].tenant : undefined;

    const context: MultiTenantUserContext = {
      user: user[0],
      memberships: memberships.map(m => ({
        ...m.membership,
        tenant: m.tenant || undefined,
        account: m.account || undefined,
        role: m.role || undefined
      })),
      subscriptions,
      pendingInvitations,
      permissions,
      primaryTenant: primaryTenant || undefined,
      totalTenants: new Set(memberships.map(m => m.membership.tenantId).filter(Boolean)).size,
      totalAccounts: new Set(memberships.map(m => m.membership.accountId).filter(Boolean)).size
    };

    // Cache result
    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(context));
    } catch (redisError) {
      logger.warn('Failed to cache user context', {
        error: redisError instanceof Error ? redisError.message : String(redisError)
      });
    }

    return context;
  }

  /**
   * Get user memberships with filtering
   */
  static async getUserMemberships(
    filters: MembershipFilters = {},
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ memberships: UserMembership[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    // Build query conditions
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(userMemberships.userId, filters.userId));
    }

    if (filters.tenantId !== undefined) {
      if (filters.tenantId === null) {
        conditions.push(sql`${userMemberships.tenantId} IS NULL`);
      } else {
        conditions.push(eq(userMemberships.tenantId, filters.tenantId));
      }
    }

    if (filters.accountId !== undefined) {
      if (filters.accountId === null) {
        conditions.push(sql`${userMemberships.accountId} IS NULL`);
      } else {
        conditions.push(eq(userMemberships.accountId, filters.accountId));
      }
    }

    if (filters.roleId) {
      conditions.push(eq(userMemberships.roleId, filters.roleId));
    }

    if (filters.status) {
      conditions.push(eq(userMemberships.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userMemberships)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get memberships with pagination
    const membershipsResult = await db
      .select()
      .from(userMemberships)
      .where(whereClause)
      .orderBy(desc(userMemberships.joinedAt))
      .limit(limit)
      .offset(offset);

    return {
      memberships: membershipsResult,
      total
    };
  }

  /**
   * Create user membership
   */
  static async createMembership(data: CreateMembershipData): Promise<UserMembership> {
    const membership = await db
      .insert(userMemberships)
      .values({
        userId: data.userId,
        tenantId: data.tenantId,
        accountId: data.accountId,
        roleId: data.roleId,
        permissions: data.permissions || [],
        status: data.status || 'active',
        joinedAt: new Date(),
        metadata: data.metadata || {}
      })
      .returning();

    logger.info('User membership created', {
      userId: data.userId,
      tenantId: data.tenantId,
      accountId: data.accountId,
      roleId: data.roleId
    });

    // Invalidate user cache
    await this.invalidateUserCache(data.userId);

    return membership[0];
  }

  /**
   * Create invitation
   */
  static async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    const expiresAt = data.expiresAt || new Date(
      Date.now() + this.DEFAULT_INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const invitation = await db
      .insert(invitations)
      .values({
        inviterUserId: data.inviterUserId,
        inviteeEmail: data.inviteeEmail,
        targetTenantId: data.targetTenantId,
        targetAccountId: data.targetAccountId,
        roleId: data.roleId,
        permissions: data.permissions || [],
        invitationType: data.invitationType,
        status: 'pending',
        message: data.message,
        expiresAt,
        metadata: data.metadata || {}
      })
      .returning();

    logger.info('Invitation created', {
      inviterUserId: data.inviterUserId,
      inviteeEmail: data.inviteeEmail,
      targetTenantId: data.targetTenantId,
      targetAccountId: data.targetAccountId,
      invitationType: data.invitationType
    });

    // Invalidate invitation cache
    await this.invalidateInvitationCache(data.inviteeEmail);

    return invitation[0];
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(
    invitationId: string,
    acceptingUserId: number
  ): Promise<{ invitation: Invitation; membership: UserMembership }> {
    return await db.transaction(async (tx) => {
      // Get invitation
      const invitation = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      if (!invitation.length) {
        throw new Error('Invitation not found');
      }

      const inv = invitation[0];

      // Check if invitation is valid
      if (inv.status !== 'pending') {
        throw new Error('Invitation is not pending');
      }

      if (inv.expiresAt && new Date() > inv.expiresAt) {
        throw new Error('Invitation has expired');
      }

      // Update invitation status
      const [updatedInvitation] = await tx
        .update(invitations)
        .set({
          status: 'accepted',
          inviteeUserId: acceptingUserId,
          acceptedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(invitations.id, invitationId))
        .returning();

      // Create membership
      const [membership] = await tx
        .insert(userMemberships)
        .values({
          userId: acceptingUserId,
          tenantId: inv.targetTenantId,
          accountId: inv.targetAccountId,
          roleId: inv.roleId,
          permissions: inv.permissions,
          status: 'active',
          joinedAt: new Date(),
          metadata: { invitationId: invitationId }
        })
        .returning();

      logger.info('Invitation accepted', {
        invitationId,
        acceptingUserId,
        targetTenantId: inv.targetTenantId,
        targetAccountId: inv.targetAccountId
      });

      return { invitation: updatedInvitation, membership };
    });
  }

  /**
   * Get invitations with filtering
   */
  static async getInvitations(
    filters: InvitationFilters = {},
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ invitations: Invitation[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    // Build query conditions
    const conditions = [];

    if (filters.inviterUserId) {
      conditions.push(eq(invitations.inviterUserId, filters.inviterUserId));
    }

    if (filters.inviteeEmail) {
      conditions.push(eq(invitations.inviteeEmail, filters.inviteeEmail));
    }

    if (filters.inviteeUserId) {
      conditions.push(eq(invitations.inviteeUserId, filters.inviteeUserId));
    }

    if (filters.targetTenantId !== undefined) {
      if (filters.targetTenantId === null) {
        conditions.push(sql`${invitations.targetTenantId} IS NULL`);
      } else {
        conditions.push(eq(invitations.targetTenantId, filters.targetTenantId));
      }
    }

    if (filters.targetAccountId !== undefined) {
      if (filters.targetAccountId === null) {
        conditions.push(sql`${invitations.targetAccountId} IS NULL`);
      } else {
        conditions.push(eq(invitations.targetAccountId, filters.targetAccountId));
      }
    }

    if (filters.invitationType) {
      conditions.push(eq(invitations.invitationType, filters.invitationType));
    }

    if (filters.status) {
      conditions.push(eq(invitations.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get invitations with pagination
    const invitationsResult = await db
      .select()
      .from(invitations)
      .where(whereClause)
      .orderBy(desc(invitations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      invitations: invitationsResult,
      total
    };
  }

  /**
   * Update membership status
   */
  static async updateMembershipStatus(
    membershipId: string,
    status: string,
    metadata?: any
  ): Promise<UserMembership> {
    const [membership] = await db
      .update(userMemberships)
      .set({
        status,
        metadata: metadata || sql`${userMemberships.metadata}`,
        updatedAt: new Date()
      })
      .where(eq(userMemberships.id, membershipId))
      .returning();

    logger.info('Membership status updated', {
      membershipId,
      status,
      userId: membership.userId
    });

    // Invalidate user cache
    await this.invalidateUserCache(membership.userId);

    return membership;
  }

  /**
   * Remove user from tenant/account
   */
  static async removeMembership(membershipId: string): Promise<void> {
    const membership = await db
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.id, membershipId))
      .limit(1);

    if (!membership.length) {
      throw new Error('Membership not found');
    }

    await db
      .delete(userMemberships)
      .where(eq(userMemberships.id, membershipId));

    logger.info('Membership removed', {
      membershipId,
      userId: membership[0].userId,
      tenantId: membership[0].tenantId,
      accountId: membership[0].accountId
    });

    // Invalidate user cache
    await this.invalidateUserCache(membership[0].userId);
  }

  /**
   * Check if user has membership in specific context
   */
  static async hasMembership(
    userId: number,
    tenantId?: number | null,
    accountId?: number | null
  ): Promise<boolean> {
    const conditions = [
      eq(userMemberships.userId, userId),
      eq(userMemberships.status, 'active')
    ];

    if (tenantId !== undefined) {
      if (tenantId === null) {
        conditions.push(sql`${userMemberships.tenantId} IS NULL`);
      } else {
        conditions.push(eq(userMemberships.tenantId, tenantId));
      }
    }

    if (accountId !== undefined) {
      if (accountId === null) {
        conditions.push(sql`${userMemberships.accountId} IS NULL`);
      } else {
        conditions.push(eq(userMemberships.accountId, accountId));
      }
    }

    const membership = await db
      .select()
      .from(userMemberships)
      .where(and(...conditions))
      .limit(1);

    return membership.length > 0;
  }

  /**
   * Invalidate user cache
   */
  static async invalidateUserCache(userId: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}*:${userId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      // Also invalidate context cache
      await redis.del(`${this.CACHE_PREFIX}context:${userId}`);

      logger.debug('Multi-tenant user cache invalidated', { userId });
    } catch (error) {
      logger.error('Multi-tenant user cache invalidation failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Invalidate invitation cache
   */
  static async invalidateInvitationCache(email: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.INVITATION_CACHE_PREFIX}*:${email}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      logger.debug('Invitation cache invalidated', { email });
    } catch (error) {
      logger.error('Invitation cache invalidation failed', {
        email,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

/**
 * Convenience function for checking membership
 */
export async function hasUserMembership(
  userId: number,
  tenantId?: number | null,
  accountId?: number | null
): Promise<boolean> {
  return MultiTenantUserService.hasMembership(userId, tenantId, accountId);
}

/**
 * Convenience function for getting user context
 */
export async function getUserMultiTenantContext(userId: number): Promise<MultiTenantUserContext> {
  return MultiTenantUserService.getUserContext(userId);
} 