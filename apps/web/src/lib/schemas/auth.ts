// ============================
// AUTHENTICATION & AUTHORIZATION TYPES
// ============================
// 
// This file exports Prisma types for authentication and authorization models

import type { 
  User as PrismaUser,
  Account as PrismaAccount,
  Role as PrismaRole,
  Permission as PrismaPermission,
  UserRole as PrismaUserRole,
  RolePermission as PrismaRolePermission,
  AdminRole as PrismaAdminRole
} from '@prisma/client';

// Re-export Prisma types with our naming convention
export type User = PrismaUser;
export type Account = PrismaAccount;
export type Role = PrismaRole;
export type Permission = PrismaPermission;
export type UserRole = PrismaUserRole;
export type RolePermission = PrismaRolePermission;
export type AdminRole = PrismaAdminRole;

// Create types for inserts (without auto-generated fields)
export type NewUser = Omit<User, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;
export type NewAccount = Omit<Account, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;
export type NewRole = Omit<Role, 'id' | 'createdAt' | 'updatedAt'>;
export type NewPermission = Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>;
export type NewUserRole = UserRole; // No auto-generated fields
export type NewRolePermission = RolePermission; // No auto-generated fields
export type NewAdminRole = Omit<AdminRole, 'createdAt' | 'updatedAt'>;

// Export the centralized Prisma client
export { db as prisma } from '@/lib/db';

// Legacy exports for backward compatibility
// These will be removed in a future version
export const users = 'DEPRECATED: Use prisma.user instead';
export const accounts = 'DEPRECATED: Use prisma.account instead';
export const roles = 'DEPRECATED: Use prisma.role instead';
export const permissions = 'DEPRECATED: Use prisma.permission instead';
export const userRoles = 'DEPRECATED: Use prisma.userRole instead';
export const rolePermissions = 'DEPRECATED: Use prisma.rolePermission instead';
export const adminRoles = 'DEPRECATED: Use prisma.adminRole instead'; 