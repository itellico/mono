/**
 * Enhanced Permission Engine for itellico Mono
 * 
 * This demonstrates a comprehensive permission system with:
 * - Fine-grained permissions
 * - Context-aware checking
 * - Permission inheritance
 * - Caching and performance optimization
 * - Multi-level enforcement
 */

import { LRUCache } from 'lru-cache';

// ============================================================================
// ENHANCED TYPES
// ============================================================================

export interface EnhancedPermissionCheck {
  subject: 'user' | 'account' | 'tenant' | 'platform';
  resource: string; // 'profiles', 'jobs', 'media', etc.
  action: string; // 'create', 'read', 'update', 'delete', 'approve', etc.
  context?: PermissionContext;
  resourceId?: string;
  conditions?: Record<string, any>;
}

export interface PermissionContext {
  tenantId?: string;
  accountId?: string;
  userId?: string;
  resourceOwnerId?: string;
  subscriptionTier?: string;
  geolocation?: string;
  timeContext?: Date;
  conditions?: Record<string, any>;
}

export interface PermissionGrant {
  permission: string;
  context?: PermissionContext;
  conditions?: PermissionCondition[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt' | 'contains' | 'matches';
  value: any;
}

export interface UserPermissionContext {
  userId: string;
  tenantId?: string;
  accountId?: string;
  roles: EnhancedRole[];
  directPermissions: PermissionGrant[];
  subscriptionTier?: string;
  isActive: boolean;
  lastUpdated: Date;
}

interface EnhancedRole {
  id: string;
  name: string;
  permissions?: string[];
  inheritsFrom?: string[];
  scope: string;
  isActive: boolean;
}

// ============================================================================
// PERMISSION CACHE
// ============================================================================

class PermissionCache {
  private cache = new LRUCache<string, boolean>({
    max: 10000,
    ttl: 1000 * 60 * 5 // 5 minutes
  });

  private userContextCache = new LRUCache<string, UserPermissionContext>({
    max: 1000,
    ttl: 1000 * 60 * 10 // 10 minutes
  });

  getCachedPermission(key: string): boolean | undefined {
    return this.cache.get(key);
  }

  setCachedPermission(key: string, result: boolean): void {
    this.cache.set(key, result);
  }

  getCachedUserContext(userId: string): UserPermissionContext | undefined {
    return this.userContextCache.get(userId);
  }

  setCachedUserContext(userId: string, context: UserPermissionContext): void {
    this.userContextCache.set(userId, context);
  }

  invalidateUser(userId: string): void {
    this.userContextCache.delete(userId);
    // Clear related permission checks
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.userContextCache.clear();
  }
}

// ============================================================================
// ENHANCED PERMISSION ENGINE
// ============================================================================

export class EnhancedPermissionEngine {
  private cache = new PermissionCache();

  /**
   * Check if user has specific permission with full context awareness
   */
  async hasPermission(
    userId: string,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): Promise<boolean> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(userId, check, context);

    // Check cache first
    const cached = this.cache.getCachedPermission(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Get user permission context
      const userContext = await this.getUserPermissionContext(userId);
      if (!userContext.isActive) {
        return false;
      }

      // Check permission through multiple layers
      const result = await this.evaluatePermission(userContext, check, context);

      // Cache the result
      this.cache.setCachedPermission(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false; // Fail closed
    }
  }

  /**
   * Evaluate permission through multiple layers
   */
  private async evaluatePermission(
    userContext: UserPermissionContext,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): Promise<boolean> {
    // 1. Check direct permissions
    if (await this.checkDirectPermissions(userContext, check, context)) {
      return true;
    }

    // 2. Check role-based permissions
    if (await this.checkRolePermissions(userContext, check, context)) {
      return true;
    }

    // 3. Check inherited permissions
    if (await this.checkInheritedPermissions(userContext, check, context)) {
      return true;
    }

    // 4. Check context-based permissions (ownership, delegation, etc.)
    if (await this.checkContextPermissions(userContext, check, context)) {
      return true;
    }

    return false;
  }

  /**
   * Check direct user permissions
   */
  private async checkDirectPermissions(
    userContext: UserPermissionContext,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): Promise<boolean> {
    for (const grant of userContext.directPermissions) {
      if (this.matchesPermission(grant.permission, check) &&
          this.matchesContext(grant.context, context) &&
          this.evaluateConditions(grant.conditions, check, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check role-based permissions with inheritance
   */
  private async checkRolePermissions(
    userContext: UserPermissionContext,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): Promise<boolean> {
    for (const role of userContext.roles) {
      // Check role's direct permissions
      for (const permission of role.permissions || []) {
        if (this.matchesPermission(permission, check)) {
          return true;
        }
      }

      // Check inherited role permissions
      if (role.inheritsFrom) {
        for (const parentRoleId of role.inheritsFrom) {
          const parentRole = await this.getRole(parentRoleId);
          if (parentRole && await this.checkRolePermissions(
            { ...userContext, roles: [parentRole] }, 
            check, 
            context
          )) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check context-based permissions (ownership, delegation)
   */
  private async checkContextPermissions(
    userContext: UserPermissionContext,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): Promise<boolean> {
    // Resource ownership check
    if (check.resourceId && context?.resourceOwnerId === userContext.userId) {
      const ownPermission = `${check.subject}.${check.resource}.${check.action}.own`;
      return await this.hasDirectPermission(userContext, ownPermission);
    }

    // Account-level access
    if (userContext.accountId && context?.accountId === userContext.accountId) {
      const accountPermission = `account.${check.resource}.${check.action}`;
      return await this.hasDirectPermission(userContext, accountPermission);
    }

    // Tenant-level access
    if (userContext.tenantId && context?.tenantId === userContext.tenantId) {
      const tenantPermission = `tenant.${check.resource}.${check.action}`;
      return await this.hasDirectPermission(userContext, tenantPermission);
    }

    return false;
  }

  /**
   * Generate cache key for permission check
   */
  private generateCacheKey(
    userId: string,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): string {
    const parts = [
      userId,
      check.subject,
      check.resource, 
      check.action,
      check.resourceId || '',
      context?.tenantId || '',
      context?.accountId || '',
      JSON.stringify(context?.conditions || {})
    ];
    return parts.join(':');
  }

  /**
   * Match permission string against check
   */
  private matchesPermission(permission: string, check: EnhancedPermissionCheck): boolean {
    // Handle wildcard permissions
    if (permission.endsWith('*')) {
      const prefix = permission.slice(0, -1);
      const checkString = `${check.subject}.${check.resource}.${check.action}`;
      return checkString.startsWith(prefix);
    }

    // Exact match
    const expectedPermission = `${check.subject}.${check.resource}.${check.action}`;
    return permission === expectedPermission;
  }

  /**
   * Check if contexts match
   */
  private matchesContext(
    grantContext?: PermissionContext,
    checkContext?: PermissionContext
  ): boolean {
    if (!grantContext && !checkContext) return true;
    if (!grantContext || !checkContext) return false;

    return (
      (!grantContext.tenantId || grantContext.tenantId === checkContext.tenantId) &&
      (!grantContext.accountId || grantContext.accountId === checkContext.accountId) &&
      (!grantContext.userId || grantContext.userId === checkContext.userId)
    );
  }

  /**
   * Evaluate permission conditions
   */
  private evaluateConditions(
    conditions?: PermissionCondition[],
    check?: EnhancedPermissionCheck,
    context?: PermissionContext
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = this.getConditionValue(condition.field, check, context);

      switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'ne': return value !== condition.value;
        case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
        case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(value);
        case 'gt': return value > condition.value;
        case 'lt': return value < condition.value;
        case 'contains': return String(value).includes(String(condition.value));
        case 'matches': return new RegExp(condition.value).test(String(value));
        default: return false;
      }
    });
  }

  /**
   * Get value for condition evaluation
   */
  private getConditionValue(
    field: string,
    check?: EnhancedPermissionCheck,
    context?: PermissionContext
  ): any {
    // Support dot notation for nested fields
    const fields = field.split('.');

    // Create combined object with all available data
    const combinedData: Record<string, any> = {};

    // Add check properties
    if (check) {
      Object.assign(combinedData, check);
    }

    // Add context properties
    if (context) {
      Object.assign(combinedData, context);
    }

    let value: any = combinedData;

    for (const f of fields) {
      value = value?.[f];
    }

    return value;
  }

  /**
   * Get user permission context (cached)
   */
  private async getUserPermissionContext(userId: string): Promise<UserPermissionContext> {
    // Check cache first
    const cached = this.cache.getCachedUserContext(userId);
    if (cached) {
      return cached;
    }

    // Fetch from database (implement based on your DB layer)
    const context = await this.fetchUserPermissionContext(userId);

    // Cache the result
    this.cache.setCachedUserContext(userId, context);

    return context;
  }

  /**
   * Fetch user permission context from database
   */
  private async fetchUserPermissionContext(userId: string): Promise<UserPermissionContext> {
    // This would integrate with your actual database layer
    // For now, returning a mock implementation
    throw new Error('Not implemented - integrate with your database layer');
  }

  /**
   * Helper methods for role and permission lookup
   */
  private async getRole(roleId: string): Promise<EnhancedRole | null> {
    // Implement role lookup
    throw new Error('Not implemented');
  }

  private async hasDirectPermission(userContext: UserPermissionContext, permission: string): Promise<boolean> {
    return userContext.directPermissions.some(grant => grant.permission === permission);
  }

  private async checkInheritedPermissions(
    userContext: UserPermissionContext,
    check: EnhancedPermissionCheck,
    context?: PermissionContext
  ): Promise<boolean> {
    // Implement permission inheritance logic
    return false;
  }

  /**
   * Permission management methods
   */
  async grantPermission(
    userId: string,
    permission: string,
    grantedBy: string,
    context?: PermissionContext,
    expiresAt?: Date
  ): Promise<void> {
    // Implement permission granting
    this.cache.invalidateUser(userId);
  }

  async revokePermission(
    userId: string,
    permission: string,
    revokedBy: string
  ): Promise<void> {
    // Implement permission revocation
    this.cache.invalidateUser(userId);
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    context?: PermissionContext
  ): Promise<void> {
    // Implement role assignment
    this.cache.invalidateUser(userId);
  }

  async removeRole(
    userId: string,
    roleId: string,
    removedBy: string
  ): Promise<void> {
    // Implement role removal
    this.cache.invalidateUser(userId);
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

export async function initializePermissionEngine(): Promise<EnhancedPermissionEngine> {
  const engine = new EnhancedPermissionEngine();

  // Example usage:
  // const canEdit = await engine.hasPermission('user123', {
  //   subject: 'user',
  //   resource: 'profiles',
  //   action: 'edit',
  //   resourceId: 'profile456'
  // }, {
  //   tenantId: 'tenant789',
  //   resourceOwnerId: 'user123'
  // });

  return engine;
} 