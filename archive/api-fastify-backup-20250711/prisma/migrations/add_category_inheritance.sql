-- Create CategoryInheritance table for tracking inherited categories
CREATE TABLE IF NOT EXISTS "CategoryInheritance" (
  "id" SERIAL PRIMARY KEY,
  "sourceCategoryId" INT NOT NULL,
  "targetScope" VARCHAR(20) NOT NULL,
  "targetTenantId" INT,
  "targetAccountId" INT,
  "inheritedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "inheritedBy" INT,
  CONSTRAINT "CategoryInheritance_sourceCategoryId_fkey" FOREIGN KEY ("sourceCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE,
  CONSTRAINT "CategoryInheritance_targetTenantId_fkey" FOREIGN KEY ("targetTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "CategoryInheritance_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "Account"("id") ON DELETE CASCADE,
  CONSTRAINT "CategoryInheritance_inheritedBy_fkey" FOREIGN KEY ("inheritedBy") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create unique constraint to prevent duplicate inheritance
ALTER TABLE "CategoryInheritance" ADD CONSTRAINT "CategoryInheritance_unique_inheritance" 
  UNIQUE NULLS NOT DISTINCT ("sourceCategoryId", "targetScope", "targetTenantId", "targetAccountId");

-- Create indexes for CategoryInheritance
CREATE INDEX IF NOT EXISTS "CategoryInheritance_sourceCategoryId_idx" ON "CategoryInheritance"("sourceCategoryId");
CREATE INDEX IF NOT EXISTS "CategoryInheritance_targetTenantId_idx" ON "CategoryInheritance"("targetTenantId");
CREATE INDEX IF NOT EXISTS "CategoryInheritance_targetAccountId_idx" ON "CategoryInheritance"("targetAccountId");