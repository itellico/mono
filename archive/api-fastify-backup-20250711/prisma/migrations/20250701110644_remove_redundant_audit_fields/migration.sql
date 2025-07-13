-- This is an empty migration.

-- Remove redundant audit fields from Tenant table
-- These fields violate normalization and are replaced by centralized audit system

-- Drop the problematic columns
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "createdBy";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "lastModifiedByName";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "lastChangeSummary";