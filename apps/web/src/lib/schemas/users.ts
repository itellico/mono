// ============================
// USER TYPES
// ============================
// 
// This file exports Prisma types for user models

import type { 
  User as PrismaUser
} from '@prisma/client';

// Re-export Prisma types with our naming convention
export type User = PrismaUser;

// Create types for inserts (without auto-generated fields)
export type NewUser = Omit<User, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;

// Export the centralized Prisma client
export { db as prisma } from '@/lib/db';

// Legacy exports for backward compatibility
// These will be removed in a future version
export const users = 'DEPRECATED: Use prisma.user instead'; 