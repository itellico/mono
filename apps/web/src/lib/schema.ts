// ============================
// 🚨 DEPRECATED: MONOLITHIC SCHEMA FILE
// ============================
// 
// This file has been split into modular domain-based schema files.
// 
// NEW STRUCTURE:
// - src/lib/schemas/_enums.ts           # All shared enums
// - src/lib/schemas/core.ts             # Countries, timezones, languages, site settings
// - src/lib/schemas/auth.ts             # Users, accounts, sessions, roles, permissions
// - src/lib/schemas/tenants.ts          # Tenants, tenant subscriptions, revenue
// - src/lib/schemas/agencies.ts         # Agencies, agency subscriptions, relationships
// - src/lib/schemas/[...other domains]  # Additional domain schemas
//
// MIGRATION OPTIONS:
// 1. Use domain-specific imports: import { users } from '@/lib/schemas/auth';
// 2. Use main index for compatibility: import { users } from '@/lib/schemas';
//
// This file now re-exports everything from the new modular structure
// to maintain backwards compatibility during migration.
//
// See: src/lib/schema-migration-guide.md for full migration instructions
// ============================

// Re-export everything from the new modular structure for backwards compatibility
export * from './schemas';

// For backwards compatibility with any code that might expect a default export
import * as schemaExports from './schemas';
export default schemaExports; 