import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles are allowed to access a route
 * @param roles - Array of role codes that are allowed
 * @example
 * ```typescript
 * @RequireRoles('super_admin', 'tenant_admin')
 * @Get('users')
 * async getUsers() { }
 * ```
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Alias for RequireRoles decorator
 */
export const Roles = RequireRoles;

/**
 * Common role constants for type safety
 */
export const UserRoles = {
  SUPER_ADMIN: 'super_admin',
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_MANAGER: 'tenant_manager',
  ACCOUNT_ADMIN: 'account_admin',
  ACCOUNT_MANAGER: 'account_manager',
  USER: 'user',
  GUEST: 'guest',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];