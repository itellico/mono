// ============================
// TENANT MANAGEMENT TYPES
// ============================
// 
// This file exports Prisma types for tenant management models

import type { 
  Tenant as PrismaTenant
} from '@prisma/client';

// Re-export Prisma types with our naming convention
export type Tenant = PrismaTenant;

// Create types for inserts (without auto-generated fields)
export type NewTenant = Omit<Tenant, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;

// Export the centralized Prisma client
export { db as prisma } from '@/lib/db';

// Legacy exports for backward compatibility
// These will be removed in a future version
export const tenants = 'DEPRECATED: Use prisma.tenant instead';
export const tenantSubscriptions = 'DEPRECATED: Use prisma.tenantSubscription instead'; 