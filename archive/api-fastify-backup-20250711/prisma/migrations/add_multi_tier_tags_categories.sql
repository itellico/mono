-- Add multi-tier support for tags and categories

-- Update Category model to support multi-tenancy and scope
ALTER TABLE "Category" 
ADD COLUMN IF NOT EXISTS "tenantId" INT,
ADD COLUMN IF NOT EXISTS "scope" VARCHAR(20) DEFAULT 'tenant',
ADD COLUMN IF NOT EXISTS "accountId" INT,
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "createdBy" INT;

-- Add foreign key constraints for Category
ALTER TABLE "Category"
ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Category_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Category_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update unique constraints for Category to support multi-tenancy
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_slug_key";
ALTER TABLE "Category" ADD CONSTRAINT "Category_scope_tenantId_accountId_slug_key" 
  UNIQUE NULLS NOT DISTINCT ("scope", "tenantId", "accountId", "slug");

-- Create index for Category queries
CREATE INDEX IF NOT EXISTS "Category_tenantId_idx" ON "Category"("tenantId");
CREATE INDEX IF NOT EXISTS "Category_accountId_idx" ON "Category"("accountId");
CREATE INDEX IF NOT EXISTS "Category_scope_idx" ON "Category"("scope");

-- Update Tag model to support multi-tier scope
ALTER TABLE "Tag" 
ADD COLUMN IF NOT EXISTS "scope" VARCHAR(20) DEFAULT 'tenant',
ADD COLUMN IF NOT EXISTS "accountId" INT,
ADD COLUMN IF NOT EXISTS "parentTagId" INT;

-- Add foreign key constraints for Tag
ALTER TABLE "Tag"
ADD CONSTRAINT "Tag_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Tag_parentTagId_fkey" FOREIGN KEY ("parentTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update unique constraints for Tag to support multi-tier
ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_slug_key";
ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_tenantId_slug_key";
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_scope_tenantId_accountId_slug_key" 
  UNIQUE NULLS NOT DISTINCT ("scope", "tenantId", "accountId", "slug");

-- Create indexes for Tag queries
CREATE INDEX IF NOT EXISTS "Tag_accountId_idx" ON "Tag"("accountId");
CREATE INDEX IF NOT EXISTS "Tag_scope_idx" ON "Tag"("scope");
CREATE INDEX IF NOT EXISTS "Tag_parentTagId_idx" ON "Tag"("parentTagId");

-- Create TagInheritance table for tracking inherited tags
CREATE TABLE IF NOT EXISTS "TagInheritance" (
  "id" SERIAL PRIMARY KEY,
  "sourceTagId" INT NOT NULL,
  "targetScope" VARCHAR(20) NOT NULL,
  "targetTenantId" INT,
  "targetAccountId" INT,
  "inheritedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "inheritedBy" INT,
  CONSTRAINT "TagInheritance_sourceTagId_fkey" FOREIGN KEY ("sourceTagId") REFERENCES "Tag"("id") ON DELETE CASCADE,
  CONSTRAINT "TagInheritance_targetTenantId_fkey" FOREIGN KEY ("targetTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "TagInheritance_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "Account"("id") ON DELETE CASCADE,
  CONSTRAINT "TagInheritance_inheritedBy_fkey" FOREIGN KEY ("inheritedBy") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create unique constraint to prevent duplicate inheritance
ALTER TABLE "TagInheritance" ADD CONSTRAINT "TagInheritance_unique_inheritance" 
  UNIQUE NULLS NOT DISTINCT ("sourceTagId", "targetScope", "targetTenantId", "targetAccountId");

-- Create indexes for TagInheritance
CREATE INDEX IF NOT EXISTS "TagInheritance_sourceTagId_idx" ON "TagInheritance"("sourceTagId");
CREATE INDEX IF NOT EXISTS "TagInheritance_targetTenantId_idx" ON "TagInheritance"("targetTenantId");
CREATE INDEX IF NOT EXISTS "TagInheritance_targetAccountId_idx" ON "TagInheritance"("targetAccountId");

-- Update CategoryTag to support scope
ALTER TABLE "CategoryTag"
ADD COLUMN IF NOT EXISTS "id" SERIAL PRIMARY KEY,
ADD COLUMN IF NOT EXISTS "scope" VARCHAR(20) DEFAULT 'tenant',
ADD COLUMN IF NOT EXISTS "tenantId" INT,
ADD COLUMN IF NOT EXISTS "accountId" INT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "createdBy" INT;

-- Drop old composite primary key and add new unique constraint
ALTER TABLE "CategoryTag" DROP CONSTRAINT IF EXISTS "CategoryTag_pkey";
ALTER TABLE "CategoryTag" ADD CONSTRAINT "CategoryTag_unique_assignment" 
  UNIQUE NULLS NOT DISTINCT ("categoryId", "tagId", "scope", "tenantId", "accountId");

-- Add foreign keys for CategoryTag
ALTER TABLE "CategoryTag"
ADD CONSTRAINT "CategoryTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
ADD CONSTRAINT "CategoryTag_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE,
ADD CONSTRAINT "CategoryTag_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL;