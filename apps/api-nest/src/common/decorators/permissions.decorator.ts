import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify which permissions are required to access a route
 * @param permissions - Array of permission names that are required
 * @example
 * ```typescript
 * @RequirePermissions('tenant.users.create', 'tenant.users.read')
 * @Post('users')
 * async createUser() { }
 * ```
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Alias for RequirePermissions decorator
 */
export const Permissions = RequirePermissions;

/**
 * Common permission constants for type safety
 */
export const CommonPermissions = {
  // Platform permissions
  PLATFORM_TENANTS_CREATE: 'platform.tenants.create',
  PLATFORM_TENANTS_READ: 'platform.tenants.read',
  PLATFORM_TENANTS_UPDATE: 'platform.tenants.update',
  PLATFORM_TENANTS_DELETE: 'platform.tenants.delete',
  
  // Tenant permissions
  TENANT_ACCOUNTS_CREATE: 'tenant.accounts.create',
  TENANT_ACCOUNTS_READ: 'tenant.accounts.read',
  TENANT_ACCOUNTS_UPDATE: 'tenant.accounts.update',
  TENANT_ACCOUNTS_DELETE: 'tenant.accounts.delete',
  
  TENANT_USERS_CREATE: 'tenant.users.create',
  TENANT_USERS_READ: 'tenant.users.read',
  TENANT_USERS_UPDATE: 'tenant.users.update',
  TENANT_USERS_DELETE: 'tenant.users.delete',
  
  // Account permissions
  ACCOUNT_USERS_CREATE: 'account.users.create',
  ACCOUNT_USERS_READ: 'account.users.read',
  ACCOUNT_USERS_UPDATE: 'account.users.update',
  ACCOUNT_USERS_DELETE: 'account.users.delete',
  
  ACCOUNT_SETTINGS_READ: 'account.settings.read',
  ACCOUNT_SETTINGS_UPDATE: 'account.settings.update',
  
  // User permissions
  USER_PROFILE_READ: 'user.profile.read',
  USER_PROFILE_UPDATE: 'user.profile.update',
  USER_PROFILE_DELETE: 'user.profile.delete',
  
  USER_PREFERENCES_READ: 'user.preferences.read',
  USER_PREFERENCES_UPDATE: 'user.preferences.update',
  
  // Public permissions
  PUBLIC_CONTENT_READ: 'public.content.read',
  PUBLIC_AUTH_REGISTER: 'public.register',
  PUBLIC_AUTH_LOGIN: 'public.login',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin.access',
} as const;

export type Permission = typeof CommonPermissions[keyof typeof CommonPermissions];