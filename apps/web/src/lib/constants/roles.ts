/**
 * 🔒 FIXED ROLE CONSTANTS - IMMUTABLE SYSTEM ROLES
 * 
 * P0 Security Requirement: These role names CANNOT be changed by anyone,
 * including super admin. They are the source of truth for the permission system.
 * 
 * Only display names and descriptions can be modified in the database,
 * but these role identifiers remain constant.
 */

// ===== FIXED ROLE IDENTIFIERS =====
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin', 
  CONTENT_MODERATOR: 'content_moderator',
  USER_MANAGER: 'user_manager',
  ANALYTICS_VIEWER: 'analytics_viewer',
  USER: 'user'
} as const;

// ===== ROLE HIERARCHY (Order matters for inheritance) =====
export const ROLE_HIERARCHY = [
  ROLES.SUPER_ADMIN,      // Level 5: Universal access
  ROLES.TENANT_ADMIN,     // Level 4: Tenant-wide access  
  ROLES.CONTENT_MODERATOR, // Level 3: Content management
  ROLES.USER_MANAGER,     // Level 2: User management
  ROLES.ANALYTICS_VIEWER, // Level 1: Read-only analytics
  ROLES.USER             // Level 0: Basic user access
] as const;

// ===== ADMIN ROLES (Can access admin panel) =====
export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.TENANT_ADMIN,
  ROLES.CONTENT_MODERATOR,
  ROLES.USER_MANAGER,
  ROLES.ANALYTICS_VIEWER
] as const;

// ===== ROLE METADATA (Display info - CAN be modified) =====
export const ROLE_METADATA = {
  [ROLES.SUPER_ADMIN]: {
    displayName: 'Super Administrator',
    description: 'Universal access to all platform features and settings',
    level: 5,
    scope: 'global',
    capabilities: [
      'Universal access across all tenants',
      'System configuration and maintenance', 
      'Emergency access and break-glass procedures',
      'Cross-tenant operations and analytics'
    ]
  },
  [ROLES.TENANT_ADMIN]: {
    displayName: 'Tenant Administrator', 
    description: 'Complete administrative control within tenant boundaries',
    level: 4,
    scope: 'tenant',
    capabilities: [
      'Full tenant management and configuration',
      'User account creation and management',
      'Content moderation and approval',
      'Billing and subscription management'
    ]
  },
  [ROLES.CONTENT_MODERATOR]: {
    displayName: 'Content Moderator',
    description: 'Content review, moderation, and safety enforcement',
    level: 3, 
    scope: 'tenant',
    capabilities: [
      'Content review and moderation',
      'User profile approval and rejection',
      'Safety and compliance enforcement',
      'Community guidelines management'
    ]
  },
  [ROLES.USER_MANAGER]: {
    displayName: 'User Manager',
    description: 'User account management and support operations',
    level: 2,
    scope: 'tenant', 
    capabilities: [
      'User account management',
      'Password resets and account recovery',
      'User profile assistance',
      'Basic support operations'
    ]
  },
  [ROLES.ANALYTICS_VIEWER]: {
    displayName: 'Analytics Viewer',
    description: 'Read-only access to analytics and reporting',
    level: 1,
    scope: 'tenant',
    capabilities: [
      'View analytics dashboards',
      'Generate and export reports', 
      'Monitor platform metrics',
      'Access business intelligence data'
    ]
  },
  [ROLES.USER]: {
    displayName: 'User',
    description: 'Standard user with basic platform access',
    level: 0,
    scope: 'user',
    capabilities: [
      'Profile management',
      'Content creation and interaction', 
      'Marketplace participation',
      'Basic platform features'
    ]
  }
} as const;

// ===== TYPE DEFINITIONS =====
export type RoleIdentifier = typeof ROLES[keyof typeof ROLES];
export type AdminRole = typeof ADMIN_ROLES[number];

// ===== UTILITY FUNCTIONS =====

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Get role level (higher number = more permissions)
 */
export function getRoleLevel(role: string): number {
  return ROLE_METADATA[role as RoleIdentifier]?.level ?? -1;
}

/**
 * Check if role A has higher privileges than role B
 */
export function hasHigherPrivileges(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}

/**
 * Get all valid role identifiers
 */
export function getAllRoles(): RoleIdentifier[] {
  return Object.values(ROLES);
}

/**
 * Validate that a role identifier is valid and fixed
 */
export function isValidRole(role: string): role is RoleIdentifier {
  return getAllRoles().includes(role as RoleIdentifier);
}

/**
 * ✅ P0 SECURITY: Validate role immutability
 * This function ensures no code can accidentally use mutable role names
 */
export function validateRoleImmutability(roleInput: string): { 
  isValid: boolean; 
  fixedRole?: RoleIdentifier;
  error?: string;
} {
  // Direct match (preferred)
  if (isValidRole(roleInput)) {
    return { isValid: true, fixedRole: roleInput };
  }

  // Check for common variants that need to be fixed
  const normalizedRole = roleInput.toLowerCase().replace(/\s+/g, '_');
  if (isValidRole(normalizedRole)) {
    return { 
      isValid: false, 
      fixedRole: normalizedRole,
      error: `Role "${roleInput}" should be "${normalizedRole}"` 
    };
  }

  return { 
    isValid: false, 
    error: `Invalid role: "${roleInput}". Must be one of: ${getAllRoles().join(', ')}` 
  };
} 