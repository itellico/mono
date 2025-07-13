// ============================
// PERMISSIONS & ROLES TYPES
// ============================
// 
// This file exports Prisma types for permissions and role management

import type { 
  Role as PrismaRole,
  Permission as PrismaPermission,
  UserRole as PrismaUserRole,
  RolePermission as PrismaRolePermission
} from '@prisma/client';

// Re-export Prisma types with our naming convention
export type Role = PrismaRole;
export type Permission = PrismaPermission;
export type UserRole = PrismaUserRole;
export type RolePermission = PrismaRolePermission;

// Create types for inserts (without auto-generated fields)
export type NewRole = Omit<Role, 'id' | 'createdAt' | 'updatedAt'>;
export type NewPermission = Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>;
export type NewUserRole = UserRole; // No auto-generated fields
export type NewRolePermission = RolePermission; // No auto-generated fields

// Export the centralized Prisma client
export { db as prisma } from '@/lib/db';

// Legacy exports for backward compatibility
// These will be removed in a future version
export const permissions = 'DEPRECATED: Use prisma.permission instead';
export const roles = 'DEPRECATED: Use prisma.role instead';
export const rolePermissions = 'DEPRECATED: Use prisma.rolePermission instead';
export const userRoles = 'DEPRECATED: Use prisma.userRole instead';
export const userPermissions = 'DEPRECATED: Use prisma.userPermission instead'; 