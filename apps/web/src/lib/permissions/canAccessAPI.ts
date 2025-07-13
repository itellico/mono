import { auth } from '@/lib/auth';
import { PermissionsService } from '@/lib/services/permissions.service';
import { ROLES, isAdminRole, validateRoleImmutability } from '@/lib/constants/roles';
import { logger } from '@/lib/logger';

/**
 * 🔐 UNIFIED PERMISSION SYSTEM - SINGLE SOURCE OF TRUTH
 * 
 * P0 Security Requirement: ALL API routes and components MUST use this function
 * for permission checking. NO hardcoded role checks anywhere else.
 * 
 * Features:
 * ✅ Tenant isolation (always enforced)
 * ✅ Fixed role validation (immutable role system)
 * ✅ Three-layer caching (Next.js + Redis + TanStack Query)
 * ✅ Super admin universal access
 * ✅ Comprehensive audit logging
 * ✅ Graceful degradation
 */

export interface AccessContext {
  /** The specific action being attempted */
  action: string;
  /** The resource being accessed (e.g., 'user', 'tenant', 'content') */
  resource: string;
  /** Specific resource ID (for granular permissions) */
  resourceId?: string | number;
  /** Tenant ID for tenant isolation (required for non-global operations) */
  tenantId?: number;
  /** Whether to allow read-only access as fallback */
  allowReadOnly?: boolean;
  /** Additional context for logging and audit */
  metadata?: Record<string, unknown>;
}

export interface AccessResult {
  /** Whether access is granted */
  allowed: boolean;
  /** The user ID who requested access */
  userId?: string;
  /** The tenant ID for this request */
  tenantId?: number;
  /** User's roles (validated against fixed role constants) */
  roles?: string[];
  /** Specific reason for access grant/denial */
  reason: string;
  /** Whether this was a super admin bypass */
  isSuperAdminBypass?: boolean;
  /** Whether access is read-only (when allowReadOnly: true) */
  isReadOnly?: boolean;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
}

/**
 * ✅ UNIFIED PERMISSION CHECKER - Use this EVERYWHERE
 * 
 * @param context - Access context with action, resource, and optional parameters
 * @returns Promise<AccessResult> - Detailed access result with audit information
 */
export async function canAccessAPI(context: AccessContext): Promise<AccessResult> {
  const startTime = Date.now();
  
  try {
    // ===== STEP 1: Authentication Check =====
    const session = await auth();
    
    if (!session?.user?.id) {
      const result: AccessResult = {
        allowed: false,
        reason: 'Authentication required',
        context: { action: context.action, resource: context.resource }
      };
      
      logger.warn('🔒 Unauthenticated access attempt', {
        ...context,
        duration: Date.now() - startTime
      });
      
      return result;
    }

    const userId = session.user.id;

    // ===== STEP 2: Load User Permissions (with caching) =====
    const permissionsService = PermissionsService.getInstance();
    const userPermissions = await permissionsService.getUserPermissions(userId);

    if (!userPermissions) {
      const result: AccessResult = {
        allowed: false,
        userId,
        reason: 'User permissions not found',
        context: { action: context.action, resource: context.resource }
      };
      
      logger.error('❌ User permissions not found', {
        userId,
        ...context,
        duration: Date.now() - startTime
      });
      
      return result;
    }

    // ===== STEP 3: Validate Role Immutability =====
    const validatedRoles: string[] = [];
    const roleValidationErrors: string[] = [];

    for (const role of userPermissions.roles) {
      // Use role code for validation (role codes match constants)
      const validation = validateRoleImmutability(role.code);
      if (validation.isValid && validation.fixedRole) {
        validatedRoles.push(validation.fixedRole);
      } else {
        roleValidationErrors.push(validation.error || `Invalid role: ${role.name} (code: ${role.code})`);
      }
    }

    if (roleValidationErrors.length > 0) {
      logger.error('❌ Role validation failed', {
        userId,
        errors: roleValidationErrors,
        userRoles: userPermissions.roles.map(r => r.name)
      });
    }

    // ===== STEP 4: Emergency Access Check =====
    const user = session;
    if (user?.user?.emergencyUntil && new Date(user.user.emergencyUntil) > new Date()) {
      const result: AccessResult = {
        allowed: true,
        userId,
        tenantId: userPermissions.tenantId,
        roles: validatedRoles,
        reason: 'Emergency access active',
        isSuperAdminBypass: true,
        context: { 
          action: context.action, 
          resource: context.resource,
          emergencyMode: true,
          emergencyUntil: user.user.emergencyUntil
        }
      };

      logger.warn('🚨 EMERGENCY ACCESS GRANTED', {
        userId,
        emergencyUntil: user.user.emergencyUntil,
        ...context,
        duration: Date.now() - startTime
      });

      return result;
    }

    // ===== STEP 5: Super Admin Universal Access =====
    const isSuperAdmin = validatedRoles.includes(ROLES.SUPER_ADMIN);
    
    if (isSuperAdmin) {
      const result: AccessResult = {
        allowed: true,
        userId,
        tenantId: userPermissions.tenantId,
        roles: validatedRoles,
        reason: 'Super admin universal access',
        isSuperAdminBypass: true,
        context: { action: context.action, resource: context.resource }
      };

      logger.info('🔥 Super admin universal access granted', {
        userId,
        ...context,
        duration: Date.now() - startTime
      });

      return result;
    }

    // ===== STEP 6: Tenant Isolation Check =====
    if (context.tenantId && userPermissions.tenantId !== context.tenantId) {
      const result: AccessResult = {
        allowed: false,
        userId,
        tenantId: userPermissions.tenantId,
        roles: validatedRoles,
        reason: `Tenant isolation violation. User tenant: ${userPermissions.tenantId}, requested tenant: ${context.tenantId}`,
        context: { action: context.action, resource: context.resource }
      };

      logger.error('🚫 Tenant isolation violation', {
        userId,
        userTenantId: userPermissions.tenantId,
        requestedTenantId: context.tenantId,
        ...context,
        duration: Date.now() - startTime
      });

      return result;
    }

    // ===== STEP 7: Permission-Based Access Check =====
    // Determine scope based on context
    let scope: 'global' | 'tenant' | 'own' = 'tenant';
    
    // If no tenantId provided, it might be a global operation
    if (!context.tenantId && context.resource === 'tenants') {
      scope = 'global';
    }
    // Check if this is an "own" resource operation
    else if (context.resourceId === userId || context.action === 'own') {
      scope = 'own';
    }
    // Admin resources like roles and permissions are global by default
    else if (['roles', 'permissions'].includes(context.resource)) {
      scope = 'global';
    }
    
    // Build permission patterns to check
    const permissionPatterns = [
      `${context.resource}.${context.action}.${scope}`, // Exact match
      `${context.resource}.*.${scope}`, // Wildcard action
      `${context.resource}.${context.action}.*`, // Wildcard scope
      `${context.resource}.*.*`, // Full wildcard
      // Also check platform-level permissions for admin resources
      ...((['roles', 'permissions'].includes(context.resource)) ? [
        'platform.*.global',
        'security.*.global',
        'admin.manage.global',
        'admin.full_access'
      ] : [])
    ];
    
    // Check each pattern
    for (const pattern of permissionPatterns) {
      const hasPermission = await permissionsService.hasPermission(
        userId, 
        pattern, 
        context.tenantId
      );

      if (hasPermission) {
        const result: AccessResult = {
          allowed: true,
          userId,
          tenantId: userPermissions.tenantId,
          roles: validatedRoles,
          reason: `Permission granted: ${pattern}`,
          context: { 
            action: context.action, 
            resource: context.resource, 
            permission: pattern,
            scope 
          }
        };

        logger.info('✅ Permission-based access granted', {
          userId,
          permission: pattern,
          scope,
          ...context,
          duration: Date.now() - startTime
        });

        return result;
      }
    }

    // ===== STEP 8: Read-Only Fallback (if allowed) =====
    if (context.allowReadOnly && context.action !== 'read') {
      const readPermission = `${context.resource}.read`;
      const hasReadPermission = await permissionsService.hasPermission(
        userId,
        readPermission,
        context.tenantId
      );

      if (hasReadPermission) {
        const result: AccessResult = {
          allowed: true,
          userId,
          tenantId: userPermissions.tenantId,
          roles: validatedRoles,
          reason: `Read-only access granted: ${readPermission}`,
          isReadOnly: true,
          context: { action: context.action, resource: context.resource, fallbackPermission: readPermission }
        };

        logger.info('📖 Read-only fallback access granted', {
          userId,
          originalAction: context.action,
          fallbackPermission: readPermission,
          ...context,
          duration: Date.now() - startTime
        });

        return result;
      }
    }

    // ===== STEP 9: Admin Role Fallback =====
    const hasAdminRole = validatedRoles.some(role => isAdminRole(role));
    
    if (hasAdminRole && (context.resource === 'admin' || context.action === 'view')) {
      const result: AccessResult = {
        allowed: true,
        userId,
        tenantId: userPermissions.tenantId,
        roles: validatedRoles,
        reason: `Admin role access: ${validatedRoles.filter(r => isAdminRole(r)).join(', ')}`,
        context: { action: context.action, resource: context.resource }
      };

      logger.info('👨‍💼 Admin role access granted', {
        userId,
        adminRoles: validatedRoles.filter(r => isAdminRole(r)),
        ...context,
        duration: Date.now() - startTime
      });

      return result;
    }

    // ===== STEP 10: Access Denied =====
    const requiredPermission = `${context.resource}.${context.action}`;
    const result: AccessResult = {
      allowed: false,
      userId,
      tenantId: userPermissions.tenantId,
      roles: validatedRoles,
      reason: `Insufficient permissions. Required: ${requiredPermission}`,
      context: { 
        action: context.action, 
        resource: context.resource, 
        requiredPermission,
        userPermissions: userPermissions.permissions
      }
    };

    logger.warn('🚫 Access denied', {
      userId,
      requiredPermission,
      userPermissions: userPermissions.permissions,
      userRoles: validatedRoles,
      ...context,
      duration: Date.now() - startTime
    });

    return result;

  } catch (error) {
    const result: AccessResult = {
      allowed: false,
      reason: 'Permission check failed',
      context: { 
        action: context.action, 
        resource: context.resource, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    logger.error('❌ Permission check failed', {
      ...context,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    return result;
  }
}

/**
 * ✅ Simplified helper for common permission checks
 */
export async function hasPermission(
  action: string, 
  resource: string, 
  options: {
    resourceId?: string | number;
    tenantId?: number;
    allowReadOnly?: boolean;
  } = {}
): Promise<boolean> {
  const result = await canAccessAPI({
    action,
    resource,
    ...options
  });
  
  return result.allowed;
}

/**
 * ✅ Admin panel access check (commonly used)
 */
export async function canAccessAdmin(tenantId?: number): Promise<AccessResult> {
  return canAccessAPI({
    action: 'view',
    resource: 'admin',
    tenantId,
    allowReadOnly: true
  });
}

/**
 * ✅ Specific resource access check with ID
 */
export async function canAccessResource(
  action: string,
  resource: string, 
  resourceId: string | number,
  tenantId?: number
): Promise<AccessResult> {
  return canAccessAPI({
    action,
    resource,
    resourceId,
    tenantId
  });
} 