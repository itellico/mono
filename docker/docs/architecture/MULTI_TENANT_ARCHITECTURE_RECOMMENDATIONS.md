# itellico Mono Multi-Tenant Architecture Recommendations

## Executive Summary

Based on your requirements for a multi-tenant SaaS platform supporting diverse business models (child models, fitness models, pet models, freelancers), I recommend a **Shared Database, Shared Schema** architecture with sophisticated metadata-driven schema management. This approach will provide the flexibility needed while maintaining performance and security.

## 1. Database Architecture Recommendations

### Core Hierarchy Enhancement

Your current hierarchy is solid:
```
Platform (Super Admin)
  └── Tenant (Platform Owner)
      └── Account (Business/Individual)
          └── User (Account Members)
              └── Profile (Model/Freelancer)
```

### Recommended Schema Enhancements

#### 1.1 Enhanced Tenant Model
```typescript
model Tenant {
  // ... existing fields ...
  
  // New fields for better multi-tenant support
  industryType        String      @db.VarChar(50)  // 'modeling', 'freelance', 'pets'
  subscriptionTier    String      @db.VarChar(20)  // 'starter', 'pro', 'enterprise'
  customDomain        String?     @unique
  whiteLabel          Json?       @db.JsonB        // Branding configuration
  moduleConfig        Json        @db.JsonB        // Enabled modules
  schemaOverrides     Json?       @db.JsonB        // Tenant-specific schema customizations
  dataRetentionDays   Int         @default(365)
  
  // Relations
  industryTemplates   TenantIndustryTemplate[]
  customFields        CustomFieldDefinition[]
  workflowTemplates   WorkflowTemplate[]
}
```

#### 1.2 Dynamic Schema System
```typescript
model EntitySchema {
  id                  String      @id @default(uuid())
  tenantId            String?     // NULL = global template
  entityType          String      // 'profile', 'job', 'application'
  entitySubtype       String      // 'fitness_model', 'child_model', 'pet_model'
  version             Int         @default(1)
  isActive           Boolean     @default(true)
  
  // Core schema definition
  baseSchema          Json        @db.JsonB  // JSON Schema format
  requiredFields      String[]    
  searchableFields    String[]
  filterableFields    String[]
  sortableFields      String[]
  
  // UI Configuration
  listViewConfig      Json        @db.JsonB  // Column definitions
  detailViewConfig    Json        @db.JsonB  // Layout definition
  formConfig          Json        @db.JsonB  // Form generation rules
  
  // Validation & Business Rules
  validationRules     Json        @db.JsonB
  computedFields      Json        @db.JsonB  // Calculated fields
  
  @@unique([tenantId, entityType, entitySubtype])
  @@index([entityType, isActive])
}
```

#### 1.3 Custom Fields Architecture
```typescript
model CustomFieldDefinition {
  id                  String      @id @default(uuid())
  tenantId            String
  entityType          String      // Which entity this applies to
  fieldName           String
  fieldType           String      // 'text', 'number', 'date', 'select', 'multiselect'
  dataType            String      // PostgreSQL data type
  
  // Configuration
  label               Json        @db.JsonB  // i18n labels
  description         Json        @db.JsonB  // i18n descriptions
  placeholder         Json        @db.JsonB  // i18n placeholders
  defaultValue        String?
  isRequired          Boolean     @default(false)
  isUnique            Boolean     @default(false)
  isSearchable        Boolean     @default(false)
  
  // Validation
  validationRules     Json        @db.JsonB
  optionSetId         String?     // For select fields
  
  // Display
  displayOrder        Int
  displayGroups       String[]    // Which UI groups show this field
  visibility          Json        @db.JsonB  // Conditional visibility rules
  
  tenant              Tenant      @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, entityType, fieldName])
  @@index([entityType, isSearchable])
}
```

#### 1.4 Profile System Enhancement
```typescript
model Profile {
  id                  String      @id @default(uuid())
  accountId           String
  profileType         String      // 'model', 'freelancer', 'pet'
  profileSubtype      String      // 'fitness', 'child', 'fashion'
  
  // Core fields (shared across all types)
  displayName         String
  slug                String      @unique
  status              String      // 'draft', 'pending', 'active', 'suspended'
  
  // Dynamic data based on EntitySchema
  structuredData      Json        @db.JsonB  // Validated against schema
  customFields        Json        @db.JsonB  // Tenant-specific fields
  
  // Media & Portfolio
  mediaAssets         MediaAsset[]
  portfolioItems      PortfolioItem[]
  
  // Categorization
  categories          ProfileCategory[]
  tags                ProfileTag[]
  
  // Search & Discovery
  searchVector        String?     // PostgreSQL tsvector for full-text search
  geoLocation         Geography?  // PostGIS point
  
  @@index([profileType, profileSubtype, status])
  @@index([accountId, status])
}
```

## 2. Subscription & Feature Management

### 2.1 Enhanced Subscription Architecture
```typescript
model SubscriptionPlan {
  id                  String      @id @default(uuid())
  name                String
  description         Json        @db.JsonB  // i18n
  
  // Pricing
  basePriceMonthly    Decimal     @db.Decimal(10,2)
  basePriceYearly     Decimal     @db.Decimal(10,2)
  setupFee            Decimal?    @db.Decimal(10,2)
  
  // Configuration
  billingModel        String      // 'flat', 'seat_based', 'usage_based', 'hybrid'
  trialDays           Int         @default(14)
  autoRenew           Boolean     @default(true)
  
  // What's included
  includedModules     String[]    // Module IDs
  includedFeatures    PlanFeature[]
  resourceLimits      ResourceLimit[]
  
  // Targeting
  targetIndustries    String[]    // Which industries this plan is for
  targetTenantSize    String      // 'startup', 'smb', 'enterprise'
  isPublic            Boolean     @default(true)
  
  @@index([targetIndustries, isPublic])
}

model ResourceLimit {
  id                  String      @id @default(uuid())
  planId              String
  resourceType        String      // 'users', 'profiles', 'storage_gb', 'api_calls'
  
  // Limits
  softLimit           Int         // Warning threshold
  hardLimit           Int         // Enforcement threshold
  periodType          String      // 'monthly', 'daily', 'total'
  
  // Overages
  allowOverage        Boolean     @default(false)
  overageRate         Decimal?    @db.Decimal(10,4)  // Cost per unit over limit
  
  plan                SubscriptionPlan @relation(fields: [planId], references: [id])
  
  @@unique([planId, resourceType])
}
```

### 2.2 Feature Flag System
```typescript
model FeatureFlag {
  id                  String      @id @default(uuid())
  key                 String      @unique
  name                String
  description         String?
  category            String      // 'core', 'beta', 'experimental'
  
  // Rollout configuration
  defaultEnabled      Boolean     @default(false)
  rolloutPercentage   Int?        // For gradual rollout
  
  // Targeting
  enabledPlans        String[]    // Plan IDs where this is enabled
  enabledTenants      String[]    // Specific tenant overrides
  disabledTenants     String[]    // Blacklist specific tenants
  
  // Dependencies
  requiredFeatures    String[]    // Other features that must be enabled
  incompatibleWith    String[]    // Features that conflict
  
  metadata            Json?       @db.JsonB
  
  @@index([category, defaultEnabled])
}
```

## 3. Industry Templates & Modules

### 3.1 Industry Template System
```typescript
model IndustryTemplate {
  id                  String      @id @default(uuid())
  industryCode        String      @unique  // 'modeling', 'freelance', 'pets'
  name                Json        @db.JsonB  // i18n
  description         Json        @db.JsonB  // i18n
  version             String
  
  // What's included
  entitySchemas       Json        @db.JsonB  // Profile schemas for this industry
  categoryTree        Json        @db.JsonB  // Default categories
  tagSets             Json        @db.JsonB  // Default tags
  workflowTemplates   Json        @db.JsonB  // Common workflows
  formTemplates       Json        @db.JsonB  // Standard forms
  
  // Configuration
  requiredModules     String[]    // Modules needed for this industry
  recommendedFeatures String[]    // Suggested features
  defaultSettings     Json        @db.JsonB  // Industry-specific settings
  
  // Customization rules
  customizationRules  Json        @db.JsonB  // What can be modified
  validationRules     Json        @db.JsonB  // Industry-specific validation
  
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}

model TenantIndustryTemplate {
  id                  String      @id @default(uuid())
  tenantId            String
  templateId          String
  
  // Customizations
  schemaOverrides     Json?       @db.JsonB  // Tenant-specific modifications
  additionalModules   String[]    // Extra modules added
  customSettings      Json?       @db.JsonB  // Tenant settings
  
  installedAt         DateTime    @default(now())
  installedBy         String?
  
  tenant              Tenant      @relation(fields: [tenantId], references: [id])
  template            IndustryTemplate @relation(fields: [templateId], references: [id])
  
  @@unique([tenantId, templateId])
}
```

## 4. Form Generation Strategy

### 4.1 Form Definition Storage
```typescript
model FormTemplate {
  id                  String      @id @default(uuid())
  tenantId            String?     // NULL = global template
  formType            String      // 'registration', 'profile_edit', 'search'
  entityType          String      // Which entity this form is for
  
  // Form structure
  formSchema          Json        @db.JsonB  // JSON Schema
  uiSchema            Json        @db.JsonB  // UI configuration
  
  // Behavior
  validationRules     Json        @db.JsonB
  conditionalLogic    Json        @db.JsonB  // Show/hide fields
  computedFields      Json        @db.JsonB  // Auto-calculated values
  
  // Multi-step support
  steps               Json?       @db.JsonB  // Step definitions
  progressIndicator   String?     // 'steps', 'percentage', 'none'
  
  // Submission
  submitActions       Json        @db.JsonB  // What happens on submit
  redirectUrl         String?
  
  @@unique([tenantId, formType, entityType])
}
```

### 4.2 Form Generation Approach
```typescript
// Use React Hook Form + Zod for runtime validation
const generateForm = (schema: EntitySchema, template: FormTemplate) => {
  // 1. Merge base schema with custom fields
  // 2. Apply tenant-specific overrides
  // 3. Generate Zod validation schema
  // 4. Create React components dynamically
  // 5. Apply conditional logic
  // 6. Handle multi-step if needed
};
```

## 5. Categories & Tags Enhancement

### 5.1 Hierarchical Category System
```typescript
model Category {
  id                  String      @id @default(uuid())
  tenantId            String?     // NULL = global
  parentId            String?
  
  slug                String      
  name                Json        @db.JsonB  // i18n
  description         Json?       @db.JsonB  // i18n
  
  // Configuration
  categoryType        String      // 'classification', 'navigation', 'filtering'
  allowedEntityTypes  String[]    // Which entities can use this
  maxDepth            Int?        // Limit nesting
  
  // Display
  icon                String?
  color               String?
  displayOrder        Int
  isActive            Boolean     @default(true)
  
  // Rules
  requiresApproval    Boolean     @default(false)
  autoAssignRules     Json?       @db.JsonB  // Auto-categorization rules
  
  @@unique([tenantId, slug])
  @@index([categoryType, isActive])
}
```

## 6. Implementation Priorities

### Phase 1: Foundation (Weeks 1-4)
1. Implement enhanced Tenant model with industry support
2. Build EntitySchema system for dynamic schemas
3. Create base Profile model with JSONB storage
4. Set up PostgreSQL RLS for tenant isolation

### Phase 2: Subscriptions (Weeks 5-8)
1. Implement subscription plans with resource limits
2. Build feature flag system
3. Create usage tracking infrastructure
4. Integrate with Stripe/payment provider

### Phase 3: Dynamic Content (Weeks 9-12)
1. Build form generation system
2. Implement custom fields architecture
3. Create industry template installer
4. Build schema validation layer

### Phase 4: Advanced Features (Weeks 13-16)
1. Implement workflow engine
2. Build advanced search with PostgreSQL FTS
3. Create reporting infrastructure
4. Add multi-language support

## 7. Key Technical Decisions

### Database Technologies
- **PostgreSQL 15+**: For JSONB, RLS, and advanced indexing
- **Redis**: For caching and real-time features
- **PostGIS**: For location-based features (optional)

### Caching Strategy
```typescript
// Three-layer caching
1. CDN: Static assets and public data
2. Redis: Session data, feature flags, hot data
3. PostgreSQL: Materialized views for reports
```

### Security Implementation
```typescript
// Row Level Security example
CREATE POLICY tenant_isolation ON profiles
  USING (
    tenant_id = current_setting('app.current_tenant')::uuid
    OR 
    EXISTS (
      SELECT 1 FROM tenant_permissions
      WHERE user_id = current_setting('app.current_user')::uuid
      AND tenant_id = profiles.tenant_id
    )
  );
```

## 8. Performance Optimizations

### JSONB Indexing
```sql
-- For searching within JSONB fields
CREATE INDEX idx_profile_data_gin ON profiles USING gin (structured_data);

-- For specific JSONB paths
CREATE INDEX idx_profile_email ON profiles ((structured_data->>'email'));
```

### Partitioning Strategy
```sql
-- Partition large tables by tenant_id for huge scale
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY HASH (tenant_id);
```

## Conclusion

This architecture provides:
- **Flexibility**: Dynamic schemas per tenant/industry
- **Scalability**: Shared database with proper isolation
- **Maintainability**: Centralized schema management
- **Performance**: Optimized JSONB storage with proper indexing
- **Security**: RLS and proper tenant isolation

The system can handle thousands of tenants with different business models while maintaining a single codebase and database infrastructure.