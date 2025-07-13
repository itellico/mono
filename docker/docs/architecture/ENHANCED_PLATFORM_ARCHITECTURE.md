# itellico Mono: Enhanced Multi-Tenant Architecture
## Complete System Design & Implementation Plan

---

## 📋 **Table of Contents**

1. [Enhanced Subscription Architecture](#enhanced-subscription-architecture)
2. [Industry Templates System](#industry-templates-system)
3. [Compiled Model Generation Pipeline](#compiled-model-generation-pipeline)
4. [Tenant CSS Theming & Media Spaces](#tenant-css-theming--media-spaces)
5. [Upload Directory Architecture](#upload-directory-architecture)
6. [Database Schema Changes](#database-schema-changes)
7. [Form Builder Integration](#form-builder-integration)
8. [Implementation Roadmap](#implementation-roadmap)

---

## 🏗️ **Enhanced Subscription Architecture**

### **Core Concept: Feature Sets + Industry Templates + Resource Limits**

The subscription system must support reusable capability bundles (Feature Sets) linked to industry-specific templates with enforced resource limits.

### **1. Feature Sets (Reusable Capability Bundles)**

```typescript
// Feature Sets - Reusable bundles of capabilities
interface FeatureSet {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'ai' | 'analytics' | 'media' | 'workflow';
  
  // Included capabilities
  features: Feature[];
  resourceLimits: ResourceLimit[];
  
  // Dependencies and conflicts
  requiredFeatureSets: string[];
  incompatibleWith: string[];
  
  // Targeting
  targetIndustries: string[];
  minimumPlan: 'starter' | 'pro' | 'enterprise';
  
  // Pricing (when sold separately)
  monthlyPrice?: number;
  yearlyPrice?: number;
  setupFee?: number;
}

// Example Feature Sets
const AI_TOOLS_SET: FeatureSet = {
  id: "ai_tools_professional",
  name: "AI Tools Professional",
  category: "ai",
  features: [
    { key: "ai_translation", name: "AI Translation" },
    { key: "content_generation", name: "Content Generation" },
    { key: "image_enhancement", name: "Image Enhancement" }
  ],
  resourceLimits: [
    { type: "ai_api_calls", softLimit: 5000, hardLimit: 10000, period: "monthly" },
    { type: "image_processing_minutes", softLimit: 100, hardLimit: 200, period: "monthly" }
  ],
  targetIndustries: ["modeling", "photography", "creative"],
  minimumPlan: "pro"
};

const ANALYTICS_SET: FeatureSet = {
  id: "analytics_advanced",
  name: "Advanced Analytics",
  category: "analytics",
  features: [
    { key: "custom_reports", name: "Custom Reports" },
    { key: "performance_insights", name: "Performance Insights" },
    { key: "data_export", name: "Data Export" }
  ],
  resourceLimits: [
    { type: "report_generations", softLimit: 50, hardLimit: 100, period: "monthly" },
    { type: "data_retention_days", softLimit: 365, hardLimit: 365, period: "total" }
  ],
  targetIndustries: ["all"],
  minimumPlan: "pro"
};
```

### **2. Enhanced Subscription Plans**

```typescript
interface EnhancedSubscriptionPlan {
  id: string;
  name: string;
  tier: 'starter' | 'pro' | 'enterprise' | 'custom';
  
  // Industry targeting
  targetIndustries: string[];
  industryTemplates: string[]; // Which templates can be installed
  
  // Feature composition
  includedFeatureSets: string[];
  availableAddOns: string[]; // Feature sets that can be purchased additionally
  
  // Core limits
  resourceLimits: ResourceLimit[];
  
  // Pricing
  basePrice: {
    monthly: number;
    yearly: number;
    setupFee?: number;
  };
  billingModel: 'flat' | 'per_user' | 'usage_based' | 'hybrid';
  
  // Customization rules
  allowCustomBranding: boolean;
  allowCustomDomains: boolean;
  allowCSS: boolean;
  maxCustomUsers: number;
  
  // Trial and contracts
  trialDays: number;
  minimumContract: 'monthly' | 'yearly' | 'custom';
}

// Example Plans
const MODELING_PRO_PLAN: EnhancedSubscriptionPlan = {
  id: "modeling_pro",
  name: "Modeling Pro",
  tier: "pro",
  targetIndustries: ["modeling"],
  industryTemplates: ["baby_models", "fitness_models", "fashion_models"],
  includedFeatureSets: ["core_features", "media_advanced", "analytics_basic"],
  availableAddOns: ["ai_tools_professional", "analytics_advanced"],
  resourceLimits: [
    { type: "storage_gb", softLimit: 100, hardLimit: 150, period: "total" },
    { type: "monthly_users", softLimit: 50, hardLimit: 75, period: "monthly" },
    { type: "api_calls", softLimit: 100000, hardLimit: 150000, period: "monthly" }
  ],
  basePrice: { monthly: 299, yearly: 2990, setupFee: 499 },
  allowCustomBranding: true,
  allowCustomDomains: true,
  allowCSS: true,
  maxCustomUsers: 10
};
```

### **3. Resource Limits & Usage Tracking**

```typescript
interface ResourceLimit {
  type: string; // 'storage_gb', 'monthly_users', 'api_calls', etc.
  softLimit: number; // Warning threshold
  hardLimit: number; // Enforcement threshold
  period: 'daily' | 'monthly' | 'yearly' | 'total';
  
  // Overage handling
  allowOverage: boolean;
  overageRate?: number; // Cost per unit over limit
  graceAmount?: number; // Free overage allowance
}

interface UsageTracking {
  tenantId: string;
  resourceType: string;
  period: string; // '2024-01', '2024-01-15', etc.
  
  currentUsage: number;
  softLimit: number;
  hardLimit: number;
  
  // Warnings and enforcement
  warningsSent: number;
  lastWarningAt?: Date;
  enforcementActive: boolean;
  enforcementStartedAt?: Date;
}
```

### **4. Subscription Management Workflow**

```typescript
// Super Admin Subscription Builder Workflow
class SubscriptionBuilder {
  // Step 1: Select Industry Templates
  selectIndustryTemplates(templates: string[]): this;
  
  // Step 2: Choose Base Feature Sets
  addFeatureSet(featureSetId: string, included: boolean = true): this;
  
  // Step 3: Set Resource Limits
  setResourceLimit(type: string, limits: ResourceLimit): this;
  
  // Step 4: Configure Pricing
  setPricing(pricing: PricingConfig): this;
  
  // Step 5: Set Customization Rules
  setCustomizationRules(rules: CustomizationRules): this;
  
  // Step 6: Generate Plan
  build(): EnhancedSubscriptionPlan;
}

// Tenant Installation Workflow  
class TenantInstaller {
  async installSubscription(
    tenantId: string, 
    planId: string, 
    selectedAddOns: string[] = []
  ): Promise<InstallationResult> {
    // 1. Validate plan and add-ons compatibility
    // 2. Install industry templates (schemas, option sets, categories)
    // 3. Configure feature flags based on included feature sets
    // 4. Set up resource limits and usage tracking
    // 5. Initialize tenant-specific settings
    // 6. Create default admin user
    // 7. Send welcome/onboarding materials
  }
}
```

---

## 🏭 **Industry Templates System**

### **Full-Stack Industry Templates**

Industry templates must include **everything** needed for a complete marketplace: schemas, UI components, workflows, and permissions.

### **1. Industry Template Structure**

```typescript
interface IndustryTemplate {
  // Metadata
  id: string;
  industryCode: string; // 'modeling', 'photography', 'pets', 'voice'
  name: Record<string, string>; // Multi-language names
  description: Record<string, string>;
  version: string;
  
  // Data Layer
  modelSchemas: CompiledModelSchema[];
  optionSets: OptionSetDefinition[];
  categories: CategoryTree[];
  tags: TagSet[];
  
  // UI Layer
  componentTemplates: UIComponentTemplate[];
  pageLayouts: PageLayoutTemplate[];
  formTemplates: FormTemplate[];
  
  // Business Logic Layer
  workflows: WorkflowTemplate[];
  permissions: PermissionTemplate[];
  validationRules: ValidationRuleSet[];
  
  // Configuration
  defaultSettings: Record<string, any>;
  requiredFeatureSets: string[];
  recommendedAddOns: string[];
  
  // Installation metadata
  installationSteps: InstallationStep[];
  migrationScripts: MigrationScript[];
  seedData: SeedDataSet[];
}
```

### **2. Compiled Model Schemas in Templates**

```typescript
interface CompiledModelSchema {
  entityType: string; // 'profile', 'application', 'job'
  entitySubtype: string; // 'baby_model', 'fitness_model', 'pet_model'
  
  // Compiled Prisma model definition
  prismaModel: string; // Generated Prisma schema code
  typescriptTypes: string; // Generated TypeScript interfaces
  validationSchemas: string; // Generated Zod schemas
  queryHelpers: string; // Generated query helper functions
  
  // Metadata for UI generation
  formConfig: FormGenerationConfig;
  listConfig: ListViewConfig;
  searchConfig: SearchConfig;
  
  // Database migration
  migrationSQL: string;
  indexDefinitions: IndexDefinition[];
}

// Example: Baby Model Schema in Modeling Template
const BABY_MODEL_SCHEMA: CompiledModelSchema = {
  entityType: "profile",
  entitySubtype: "baby_model",
  prismaModel: `
    model BabyModel {
      id              String  @id @default(uuid())
      profileId       String  @unique
      tenantId        String
      
      // Age and development
      age_months      Int
      developmental_stage String // "newborn", "infant", "toddler"
      
      // Physical measurements
      height_cm       Float?
      weight_kg       Float?
      head_circumference_cm Float?
      
      // Appearance
      eye_color       String?
      hair_color      String?
      skin_tone       String?
      
      // Clothing and sizing
      clothing_sizes  String[] // ["newborn", "0-3m", "3-6m"]
      shoe_size       String?
      
      // Experience and skills
      experience_level String // "first_time", "some_experience", "experienced"
      special_skills  String[] // ["smiles_on_cue", "sleeps_well", "calm_temperament"]
      
      // Guardian information
      guardian_consent Boolean @default(false)
      guardian_contact Json
      
      // Availability
      available_days  String[] // ["monday", "tuesday", "weekend"]
      max_shoot_hours Int @default(2)
      nap_schedule    Json?
      
      // Medical and safety
      allergies       String[]
      medical_notes   String?
      emergency_contact Json
      
      // Relations
      profile         Profile @relation(fields: [profileId], references: [id])
      
      @@index([tenantId, age_months])
      @@index([tenantId, developmental_stage])
      @@index([tenantId, experience_level])
    }
  `,
  // ... TypeScript types, validation, etc.
};
```

### **3. UI Component Templates**

```typescript
interface UIComponentTemplate {
  id: string;
  name: string;
  category: 'form' | 'list' | 'detail' | 'dashboard' | 'search';
  
  // React component generation
  componentCode: string; // Generated React/Next.js component
  stylesheets: string; // Component-specific CSS
  
  // Configuration
  entityTypes: string[]; // Which models this component works with
  customizable: boolean; // Can tenants modify this?
  
  // Dependencies
  requiredFeatureSets: string[];
  requiredPermissions: string[];
}

// Example: Baby Model Profile Card Component
const BABY_MODEL_PROFILE_CARD: UIComponentTemplate = {
  id: "baby_model_profile_card",
  name: "Baby Model Profile Card",
  category: "list",
  componentCode: `
    export function BabyModelProfileCard({ profile }: { profile: BabyModelProfile }) {
      return (
        <div className="baby-model-card">
          <ProfilePhoto src={profile.photos[0]} />
          <div className="baby-info">
            <h3>{profile.displayName}</h3>
            <div className="age-badge">
              {profile.babyModel.age_months} months old
            </div>
            <div className="development-stage">
              {profile.babyModel.developmental_stage}
            </div>
            <div className="sizes">
              Sizes: {profile.babyModel.clothing_sizes.join(', ')}
            </div>
            {profile.babyModel.special_skills.length > 0 && (
              <div className="skills">
                Skills: {profile.babyModel.special_skills.join(', ')}
              </div>
            )}
          </div>
        </div>
      );
    }
  `,
  entityTypes: ["baby_model"],
  customizable: true
};
```

### **4. Industry Template Installation Process**

```typescript
class IndustryTemplateInstaller {
  async installTemplate(
    tenantId: string,
    templateId: string,
    options: InstallationOptions
  ): Promise<InstallationResult> {
    
    const template = await this.getTemplate(templateId);
    
    // Phase 1: Database Setup
    await this.createCompiledModels(template.modelSchemas);
    await this.seedOptionSets(tenantId, template.optionSets);
    await this.createCategories(tenantId, template.categories);
    await this.createTags(tenantId, template.tags);
    
    // Phase 2: Code Generation & Deployment
    await this.generateComponents(template.componentTemplates);
    await this.generateForms(template.formTemplates);
    await this.generatePages(template.pageLayouts);
    
    // Phase 3: Business Logic Setup
    await this.installWorkflows(tenantId, template.workflows);
    await this.createPermissions(tenantId, template.permissions);
    await this.configureValidation(template.validationRules);
    
    // Phase 4: Configuration
    await this.applySettings(tenantId, template.defaultSettings);
    await this.enableFeatures(tenantId, template.requiredFeatureSets);
    
    // Phase 5: Testing & Validation
    await this.validateInstallation(tenantId, template);
    
    return {
      success: true,
      installedComponents: this.getInstalledComponents(),
      nextSteps: this.getOnboardingSteps()
    };
  }
}
```

---

## ⚙️ **Compiled Model Generation Pipeline**

### **Local Development Pipeline: Generate → Test → Commit → Deploy**

### **1. Schema Builder → Code Generation Workflow**

```typescript
// Super Admin Schema Builder
interface SchemaBuilder {
  // Step 1: Define model structure
  addField(name: string, type: FieldType, options: FieldOptions): this;
  addRelation(name: string, target: string, type: RelationType): this;
  addIndex(fields: string[], options?: IndexOptions): this;
  
  // Step 2: Configure validation
  addValidation(field: string, rules: ValidationRule[]): this;
  
  // Step 3: Set UI generation options
  configureForm(config: FormGenerationConfig): this;
  configureList(config: ListViewConfig): this;
  
  // Step 4: Generate code
  compile(): CompiledModelOutput;
}

interface CompiledModelOutput {
  prismaSchema: string;
  typescriptTypes: string;
  zodValidation: string;
  queryHelpers: string;
  formComponents: string;
  listComponents: string;
  migrationSQL: string;
}
```

### **2. Code Generation Engine**

```typescript
class ModelCodeGenerator {
  
  generatePrismaModel(schema: ModelSchema): string {
    // Convert schema definition to Prisma model
    return `
      model ${schema.name} {
        id              String  @id @default(uuid())
        profileId       String  @unique
        tenantId        String
        
        ${schema.fields.map(field => this.generatePrismaField(field)).join('\n')}
        
        // Generated relations
        profile         Profile @relation(fields: [profileId], references: [id])
        
        // Generated indexes
        ${schema.indexes.map(index => this.generatePrismaIndex(index)).join('\n')}
      }
    `;
  }
  
  generateTypeScriptTypes(schema: ModelSchema): string {
    // Generate TypeScript interfaces
    return `
      export interface ${schema.name} {
        id: string;
        profileId: string;
        tenantId: string;
        ${schema.fields.map(field => this.generateTSField(field)).join('\n')}
      }
      
      export interface Create${schema.name}Data {
        ${schema.fields.filter(f => !f.autoGenerated).map(field => 
          this.generateTSField(field, field.required)).join('\n')}
      }
    `;
  }
  
  generateZodValidation(schema: ModelSchema): string {
    // Generate Zod validation schemas
    return `
      export const ${schema.name}Schema = z.object({
        ${schema.fields.map(field => this.generateZodField(field)).join(',\n')}
      });
      
      export const Create${schema.name}Schema = ${schema.name}Schema.omit({
        id: true,
        profileId: true,
        tenantId: true
      });
    `;
  }
  
  generateQueryHelpers(schema: ModelSchema): string {
    // Generate optimized query functions
    return `
      export class ${schema.name}Service {
        
        async findByTenant(tenantId: string, filters?: ${schema.name}Filters) {
          return db.${schema.name.toLowerCase()}.findMany({
            where: { 
              tenantId,
              ...this.buildWhereClause(filters)
            },
            include: { profile: true }
          });
        }
        
        async searchProfiles(tenantId: string, searchTerm: string) {
          // Generated search logic based on searchable fields
          return db.${schema.name.toLowerCase()}.findMany({
            where: {
              tenantId,
              OR: [
                ${schema.searchableFields.map(field => 
                  `{ ${field}: { contains: searchTerm, mode: 'insensitive' } }`
                ).join(',\n')}
              ]
            }
          });
        }
        
        // More generated methods...
      }
    `;
  }
}
```

### **3. Development Workflow**

```bash
# Local Development Pipeline
# Step 1: Generate models from schema definitions
npm run generate:models

# Step 2: Run automated tests
npm run test:generated-models

# Step 3: Review generated code
git diff generated/

# Step 4: Commit changes
git add generated/ prisma/schema.prisma
git commit -m "Generate baby model schema v1.2"

# Step 5: Deploy to staging
git push origin feature/baby-model-schema

# Step 6: Run migration on staging
npm run migrate:staging

# Step 7: Test on staging
npm run test:integration:staging

# Step 8: Deploy to production (after approval)
npm run deploy:production
```

### **4. Generated Code Structure**

```
generated/
├── models/
│   ├── baby-model/
│   │   ├── baby-model.prisma
│   │   ├── baby-model.types.ts
│   │   ├── baby-model.validation.ts
│   │   ├── baby-model.service.ts
│   │   └── baby-model.queries.ts
│   ├── fitness-model/
│   └── pet-model/
├── components/
│   ├── baby-model/
│   │   ├── BabyModelForm.tsx
│   │   ├── BabyModelCard.tsx
│   │   └── BabyModelDetail.tsx
│   └── ...
└── migrations/
    ├── 001_create_baby_model.sql
    └── 002_add_baby_model_indexes.sql
```

---

## 🎨 **Tenant CSS Theming & Media Spaces**

### **File-Based Tenant Theming with Public/Private Media Spaces**

### **1. Tenant Media Space Architecture**

```typescript
interface TenantMediaSpace {
  tenantId: string;
  tenantHash: string; // For URL security
  
  // Storage spaces
  publicSpace: MediaSpace;   // Publicly accessible content
  privateSpace: MediaSpace;  // Tenant-only content
  brandingSpace: MediaSpace; // CSS, logos, brand assets
  
  // Configuration
  customDomain?: string;     // custom.example.com
  cdnEnabled: boolean;       // CloudFront/CDN integration
  maxStorage: number;        // Storage limit in GB
}

interface MediaSpace {
  basePath: string;          // /uploads/tenants/{tenantHash}/public/
  allowedTypes: string[];    // ['css', 'js', 'png', 'jpg', 'svg']
  maxFileSize: number;       // Max file size in MB
  indexing: boolean;         // Enable search indexing
  
  // Security
  accessControl: 'public' | 'tenant' | 'private';
  encryption: boolean;       // Encrypt files at rest
  
  // Processing
  imageProcessing: boolean;  // Auto-resize, WebP conversion
  cssProcessing: boolean;    // Minification, autoprefixer
}
```

### **2. CSS Theming System**

```typescript
// Tenant CSS Configuration
interface TenantBrandingConfig {
  tenantId: string;
  
  // CSS Variables (quick customization)
  cssVariables: {
    primaryColor: string;      // #3b82f6
    secondaryColor: string;    // #10b981
    accentColor: string;       // #f59e0b
    backgroundColor: string;   // #ffffff
    textColor: string;         // #1f2937
    fontFamily: string;        // "Inter, sans-serif"
    borderRadius: string;      // "0.5rem"
  };
  
  // Custom CSS (advanced styling)
  customCSS: string;           // Custom CSS rules
  
  // Brand assets
  logoUrl: string;             // /tenants/{hash}/branding/logo.svg
  faviconUrl: string;          // /tenants/{hash}/branding/favicon.ico
  customFonts: FontDefinition[];
  
  // Layout overrides
  headerTemplate?: string;     // Custom header component
  footerTemplate?: string;     // Custom footer component
  
  // Advanced features
  darkModeSupport: boolean;
  customDomainCSS?: string;    // Domain-specific styles
}

// CSS Generation Service
class TenantCSSGenerator {
  
  async generateTenantCSS(tenantId: string): Promise<string> {
    const config = await this.getBrandingConfig(tenantId);
    
    // Base CSS with variables
    const variablesCSS = this.generateCSSVariables(config.cssVariables);
    
    // Custom CSS with validation
    const customCSS = await this.validateAndSanitizeCSS(config.customCSS);
    
    // Font imports
    const fontsCSS = this.generateFontImports(config.customFonts);
    
    // Combine and minify
    const combinedCSS = `
      ${fontsCSS}
      
      :root {
        ${variablesCSS}
      }
      
      ${customCSS}
    `;
    
    return this.minifyCSS(combinedCSS);
  }
  
  async deployTenantCSS(tenantId: string): Promise<string> {
    const css = await this.generateTenantCSS(tenantId);
    const tenant = await this.getTenant(tenantId);
    
    // Save to tenant's branding space
    const cssPath = `/uploads/tenants/${tenant.hash}/branding/styles.css`;
    await this.saveFile(cssPath, css);
    
    // Invalidate CDN cache
    await this.invalidateCache(cssPath);
    
    return cssPath;
  }
}
```

### **3. Dynamic CSS Loading**

```typescript
// Client-side CSS injection
class TenantThemeProvider {
  
  async loadTenantTheme(tenantId: string): Promise<void> {
    const tenant = await this.getTenantInfo(tenantId);
    
    // Load tenant-specific CSS
    const cssUrl = `/tenants/${tenant.hash}/branding/styles.css`;
    
    // Check if CSS exists and is accessible
    if (await this.cssExists(cssUrl)) {
      this.injectCSS(cssUrl);
    }
    
    // Apply CSS variables for quick changes
    this.applyCSSVariables(tenant.brandingConfig.cssVariables);
  }
  
  private injectCSS(cssUrl: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.id = 'tenant-theme';
    
    // Remove existing tenant CSS
    const existing = document.getElementById('tenant-theme');
    if (existing) existing.remove();
    
    document.head.appendChild(link);
  }
  
  private applyCSSVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });
  }
}
```

### **4. Media Upload & Processing**

```typescript
// Enhanced media upload service
class TenantMediaService {
  
  async uploadBrandingAsset(
    tenantId: string, 
    file: File, 
    type: 'logo' | 'favicon' | 'css' | 'font'
  ): Promise<UploadResult> {
    
    const tenant = await this.getTenant(tenantId);
    
    // Validate file
    await this.validateFile(file, type);
    
    // Determine upload path
    const uploadPath = this.getUploadPath(tenant.hash, type, file.name);
    
    // Process file based on type
    const processedFile = await this.processFile(file, type);
    
    // Upload to storage
    const result = await this.uploadFile(uploadPath, processedFile);
    
    // Update tenant configuration
    if (type === 'css') {
      await this.updateTenantCSS(tenantId, result.url);
    } else if (type === 'logo') {
      await this.updateTenantLogo(tenantId, result.url);
    }
    
    return result;
  }
  
  private getUploadPath(tenantHash: string, type: string, filename: string): string {
    const sanitizedName = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const randomHash = this.generateRandomHash();
    
    return `/uploads/tenants/${tenantHash}/branding/${type}/${timestamp}-${randomHash}-${sanitizedName}`;
  }
  
  private async processFile(file: File, type: string): Promise<Buffer> {
    switch (type) {
      case 'css':
        return this.processCSSFile(file);
      case 'logo':
        return this.processImageFile(file, { maxWidth: 400, maxHeight: 200 });
      case 'favicon':
        return this.processImageFile(file, { maxWidth: 32, maxHeight: 32 });
      case 'font':
        return this.processFontFile(file);
      default:
        return Buffer.from(await file.arrayBuffer());
    }
  }
}
```

---

## 📁 **Upload Directory Architecture**

### **Secure Multi-Tenant File Organization**

### **1. Directory Structure**

```
uploads/
├── tenants/
│   ├── {tenantHash1}/
│   │   ├── public/              # Publicly accessible
│   │   │   ├── profiles/
│   │   │   │   ├── photos/
│   │   │   │   ├── portfolios/
│   │   │   │   └── thumbnails/
│   │   │   ├── media/
│   │   │   │   ├── images/
│   │   │   │   ├── videos/
│   │   │   │   └── documents/
│   │   │   └── assets/
│   │   │       ├── logos/
│   │   │       └── icons/
│   │   ├── private/             # Tenant-only access
│   │   │   ├── contracts/
│   │   │   ├── documents/
│   │   │   ├── backups/
│   │   │   └── reports/
│   │   ├── branding/            # CSS, logos, brand assets
│   │   │   ├── styles.css
│   │   │   ├── logo.svg
│   │   │   ├── favicon.ico
│   │   │   ├── fonts/
│   │   │   └── custom/
│   │   └── temp/                # Temporary uploads
│   │       ├── processing/
│   │       └── quarantine/
│   └── {tenantHash2}/
├── platform/                   # Platform-level assets
│   ├── templates/
│   ├── defaults/
│   └── system/
└── temp/                       # Global temporary storage
    ├── uploads/
    └── processing/
```

### **2. File Naming Convention**

```typescript
interface FileNamingStrategy {
  // Public files (SEO-friendly)
  public: '{timestamp}-{randomHash}-{sanitizedName}.{ext}';
  
  // Private files (security-focused)
  private: '{uuid}-{encryptionHash}.{ext}';
  
  // Branding files (cacheable)
  branding: '{type}-{version}-{hash}.{ext}';
  
  // Profile photos (optimized)
  profiles: '{profileId}-{size}-{timestamp}.{ext}';
}

class FilePathGenerator {
  
  generatePath(
    tenantHash: string,
    type: 'public' | 'private' | 'branding',
    category: string,
    filename: string,
    metadata?: Record<string, any>
  ): string {
    
    const sanitizedFilename = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const randomHash = this.generateSecureHash();
    
    switch (type) {
      case 'public':
        return `/uploads/tenants/${tenantHash}/public/${category}/${timestamp}-${randomHash}-${sanitizedFilename}`;
        
      case 'private':
        const uuid = this.generateUUID();
        const encryptionHash = this.generateEncryptionHash();
        return `/uploads/tenants/${tenantHash}/private/${category}/${uuid}-${encryptionHash}.${this.getExtension(filename)}`;
        
      case 'branding':
        const version = metadata?.version || '1';
        const contentHash = this.generateContentHash(filename);
        return `/uploads/tenants/${tenantHash}/branding/${category}-${version}-${contentHash}.${this.getExtension(filename)}`;
        
      default:
        throw new Error('Invalid file type');
    }
  }
}
```

### **3. Security & Access Control**

```typescript
class FileAccessController {
  
  async validateFileAccess(
    filePath: string,
    userId: string,
    tenantId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    
    const pathInfo = this.parseFilePath(filePath);
    
    // Validate tenant ownership
    if (!await this.validateTenantAccess(pathInfo.tenantHash, tenantId)) {
      return false;
    }
    
    // Check file type permissions
    switch (pathInfo.accessLevel) {
      case 'public':
        return action === 'read' || await this.hasUploadPermission(userId, tenantId);
        
      case 'private':
        return await this.hasPrivateFileAccess(userId, tenantId, pathInfo.category);
        
      case 'branding':
        return await this.hasBrandingPermission(userId, tenantId, action);
        
      default:
        return false;
    }
  }
  
  async cleanupExpiredFiles(): Promise<void> {
    // Clean up temp files older than 24 hours
    await this.cleanupTempFiles();
    
    // Clean up orphaned files
    await this.cleanupOrphanedFiles();
    
    // Clean up deleted tenant files
    await this.cleanupDeletedTenantFiles();
  }
}
```

---

## 🗄️ **Database Schema Changes**

### **New Tables Required**

### **1. IndustryTemplate Table**

```sql
CREATE TABLE industry_templates (
  id                    SERIAL PRIMARY KEY,
  uuid                  UUID DEFAULT gen_random_uuid() UNIQUE,
  
  -- Template identification
  industry_code         VARCHAR(50) UNIQUE NOT NULL,
  name                  JSONB NOT NULL,  -- Multi-language names
  description           JSONB,
  version              VARCHAR(20) NOT NULL,
  
  -- Content definition
  model_schemas         JSONB NOT NULL,  -- CompiledModelSchema[]
  option_sets          JSONB NOT NULL,  -- OptionSetDefinition[]
  categories           JSONB NOT NULL,  -- CategoryTree[]
  tags                 JSONB NOT NULL,  -- TagSet[]
  
  -- UI definition  
  component_templates   JSONB,          -- UIComponentTemplate[]
  page_layouts         JSONB,          -- PageLayoutTemplate[]
  form_templates       JSONB,          -- FormTemplate[]
  
  -- Business logic
  workflows            JSONB,          -- WorkflowTemplate[]
  permissions          JSONB,          -- PermissionTemplate[]
  validation_rules     JSONB,          -- ValidationRuleSet[]
  
  -- Configuration
  default_settings     JSONB,          -- Default tenant settings
  required_feature_sets TEXT[],        -- Required feature set IDs
  recommended_addons   TEXT[],         -- Recommended add-on IDs
  
  -- Installation
  installation_steps   JSONB,          -- InstallationStep[]
  migration_scripts    JSONB,          -- MigrationScript[]
  seed_data           JSONB,          -- SeedDataSet[]
  
  -- Metadata
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          INTEGER,
  
  CONSTRAINT fk_industry_template_creator 
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_industry_templates_code ON industry_templates(industry_code);
CREATE INDEX idx_industry_templates_active ON industry_templates(is_active);
CREATE INDEX idx_industry_templates_version ON industry_templates(industry_code, version);
```

### **2. FeatureSet Table**

```sql
CREATE TABLE feature_sets (
  id                    SERIAL PRIMARY KEY,
  uuid                  UUID DEFAULT gen_random_uuid() UNIQUE,
  
  -- Feature set identification
  name                  VARCHAR(100) NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL,
  description          TEXT,
  category             VARCHAR(50) NOT NULL, -- 'core', 'ai', 'analytics', 'media', 'workflow'
  
  -- Included capabilities
  features             JSONB NOT NULL,      -- Feature[]
  resource_limits      JSONB,              -- ResourceLimit[]
  
  -- Dependencies
  required_feature_sets TEXT[],            -- Required feature set slugs
  incompatible_with    TEXT[],            -- Incompatible feature set slugs
  
  -- Targeting
  target_industries    TEXT[],            -- Industry codes this applies to
  minimum_plan         VARCHAR(20),        -- 'starter', 'pro', 'enterprise'
  
  -- Pricing (when sold separately)
  monthly_price        DECIMAL(10,2),
  yearly_price         DECIMAL(10,2), 
  setup_fee           DECIMAL(10,2),
  
  -- Metadata
  is_active           BOOLEAN DEFAULT true,
  is_addon            BOOLEAN DEFAULT false, -- Can be purchased separately
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          INTEGER,
  
  CONSTRAINT fk_feature_set_creator 
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_feature_sets_slug ON feature_sets(slug);
CREATE INDEX idx_feature_sets_category ON feature_sets(category);
CREATE INDEX idx_feature_sets_active ON feature_sets(is_active);
CREATE INDEX idx_feature_sets_addon ON feature_sets(is_addon);
```

### **3. Enhanced SubscriptionPlan Table**

```sql
-- Extend existing table
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS target_industries TEXT[];
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS industry_templates TEXT[];
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS included_feature_sets TEXT[];
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS available_addons TEXT[];
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS resource_limits JSONB;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_model VARCHAR(20) DEFAULT 'flat';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10,2);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10,2);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allow_custom_branding BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allow_custom_domains BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allow_css BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_custom_users INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS minimum_contract VARCHAR(20) DEFAULT 'monthly';

-- Add indexes
CREATE INDEX idx_subscription_plans_industries ON subscription_plans USING gin(target_industries);
CREATE INDEX idx_subscription_plans_templates ON subscription_plans USING gin(industry_templates);
CREATE INDEX idx_subscription_plans_features ON subscription_plans USING gin(included_feature_sets);
```

### **4. UsageTracking Table**

```sql
CREATE TABLE usage_tracking (
  id                    SERIAL PRIMARY KEY,
  uuid                  UUID DEFAULT gen_random_uuid() UNIQUE,
  
  -- Tracking scope
  tenant_id            INTEGER NOT NULL,
  resource_type        VARCHAR(50) NOT NULL, -- 'storage_gb', 'monthly_users', etc.
  period               VARCHAR(20) NOT NULL, -- '2024-01', '2024-01-15', etc.
  
  -- Usage data
  current_usage        DECIMAL(12,2) DEFAULT 0,
  soft_limit          DECIMAL(12,2) NOT NULL,
  hard_limit          DECIMAL(12,2) NOT NULL,
  
  -- Warnings and enforcement
  warnings_sent        INTEGER DEFAULT 0,
  last_warning_at      TIMESTAMPTZ,
  enforcement_active   BOOLEAN DEFAULT false,
  enforcement_started_at TIMESTAMPTZ,
  
  -- Overage handling
  allow_overage        BOOLEAN DEFAULT false,
  overage_usage        DECIMAL(12,2) DEFAULT 0,
  overage_charges      DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_usage_tracking_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_usage_tracking_unique ON usage_tracking(tenant_id, resource_type, period);
CREATE INDEX idx_usage_tracking_enforcement ON usage_tracking(enforcement_active);
CREATE INDEX idx_usage_tracking_overage ON usage_tracking(allow_overage, overage_usage);
```

### **5. TenantBranding Table**

```sql
CREATE TABLE tenant_branding (
  id                    SERIAL PRIMARY KEY,
  uuid                  UUID DEFAULT gen_random_uuid() UNIQUE,
  tenant_id            INTEGER UNIQUE NOT NULL,
  
  -- CSS Variables
  primary_color        VARCHAR(7) DEFAULT '#3b82f6',
  secondary_color      VARCHAR(7) DEFAULT '#10b981', 
  accent_color         VARCHAR(7) DEFAULT '#f59e0b',
  background_color     VARCHAR(7) DEFAULT '#ffffff',
  text_color          VARCHAR(7) DEFAULT '#1f2937',
  font_family         VARCHAR(200) DEFAULT 'Inter, sans-serif',
  border_radius       VARCHAR(20) DEFAULT '0.5rem',
  
  -- Custom CSS
  custom_css          TEXT,
  
  -- Brand assets
  logo_url            VARCHAR(500),
  favicon_url         VARCHAR(500),
  custom_fonts        JSONB,              -- FontDefinition[]
  
  -- Layout overrides
  header_template     TEXT,
  footer_template     TEXT,
  
  -- Advanced features
  dark_mode_support   BOOLEAN DEFAULT false,
  custom_domain_css   TEXT,
  
  -- File tracking
  css_file_path       VARCHAR(500),       -- Generated CSS file path
  css_version         VARCHAR(20),        -- For cache invalidation
  css_generated_at    TIMESTAMPTZ,
  
  -- Metadata
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tenant_branding_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_tenant_branding_active ON tenant_branding(is_active);
CREATE INDEX idx_tenant_branding_css_version ON tenant_branding(css_version);
```

---

## 📝 **Form Builder Integration**

### **Schema-Driven Forms with Visual Editor Enhancement**

### **1. Enhanced Form Builder Architecture**

```typescript
// Form generation from model schemas
interface SchemaFormGenerator {
  generateForm(schema: CompiledModelSchema): FormDefinition;
  generateFormComponent(schema: CompiledModelSchema): string; // React component
  generateValidation(schema: CompiledModelSchema): string;   // Zod schema
  
  // Visual builder integration
  convertToVisualBuilderFormat(schema: CompiledModelSchema): VisualBuilderSchema;
  convertFromVisualBuilder(visualSchema: VisualBuilderSchema): FormDefinition;
}

// Visual builder working with schema JSON
interface EnhancedFormBuilder {
  // Load schema-driven forms into visual builder
  loadFromSchema(schema: CompiledModelSchema): void;
  
  // Allow visual customization of schema forms
  customizeSchemaForm(formId: string, customizations: FormCustomization[]): void;
  
  // Export enhanced form back to schema format  
  exportToSchema(): CompiledModelSchema;
  
  // Generate final form component
  generateComponent(): FormComponent;
}
```

### **2. Form Builder Workflow**

```typescript
// Workflow: Schema → Visual Builder → Customization → Generation
class FormBuilderWorkflow {
  
  // Step 1: Generate base form from schema
  async generateBaseForm(schemaId: string): Promise<FormDefinition> {
    const schema = await this.getModelSchema(schemaId);
    return this.schemaFormGenerator.generateForm(schema);
  }
  
  // Step 2: Load into visual builder for customization
  async loadIntoVisualBuilder(formDefinition: FormDefinition): Promise<VisualBuilderState> {
    return this.visualBuilder.loadFormDefinition(formDefinition);
  }
  
  // Step 3: Apply tenant customizations
  async applyTenantCustomizations(
    baseForm: VisualBuilderState,
    tenantId: string
  ): Promise<VisualBuilderState> {
    const customizations = await this.getTenantFormCustomizations(tenantId);
    return this.visualBuilder.applyCustomizations(baseForm, customizations);
  }
  
  // Step 4: Generate final form component
  async generateFinalForm(
    customizedForm: VisualBuilderState
  ): Promise<CompiledFormComponent> {
    return this.formCompiler.compile(customizedForm);
  }
}
```

### **3. Tenant Form Customization**

```typescript
interface TenantFormCustomization {
  tenantId: string;
  formType: string; // 'baby_model_profile', 'fitness_model_application'
  
  // Field customizations
  fieldCustomizations: {
    fieldName: string;
    hidden?: boolean;
    required?: boolean;
    label?: string;
    placeholder?: string;
    helpText?: string;
    order?: number;
    validationRules?: ValidationRule[];
  }[];
  
  // Tab/section customizations
  sectionCustomizations: {
    sectionName: string;
    hidden?: boolean;
    label?: string;
    order?: number;
  }[];
  
  // Custom fields (limited by subscription)
  customFields?: CustomField[];
  
  // Styling customizations
  styling?: {
    theme?: string;
    colors?: Record<string, string>;
    layout?: 'single-column' | 'two-column' | 'tabs';
  };
}

// Form customization UI
class TenantFormCustomizer {
  
  async customizeForm(
    tenantId: string,
    formType: string,
    customizations: TenantFormCustomization
  ): Promise<void> {
    
    // Validate customizations against subscription limits
    await this.validateCustomizations(tenantId, customizations);
    
    // Save customizations
    await this.saveFormCustomizations(tenantId, formType, customizations);
    
    // Regenerate form component
    await this.regenerateFormComponent(tenantId, formType);
    
    // Invalidate form cache
    await this.invalidateFormCache(tenantId, formType);
  }
}
```

---

## 🗓️ **Implementation Roadmap**

### **Phase 1: Foundation (Weeks 1-4)**

#### **Week 1-2: Database & Core Architecture**
- ✅ Create new database tables (IndustryTemplate, FeatureSet, UsageTracking, TenantBranding)
- ✅ Enhance SubscriptionPlan table with new columns
- ✅ Create database migrations and seed scripts
- ✅ Implement basic CRUD services for new entities

#### **Week 3-4: Industry Template System**
- ✅ Build IndustryTemplate management service
- ✅ Create Super Admin Industry Template Manager UI
- ✅ Implement template validation and testing
- ✅ Create sample modeling industry template

### **Phase 2: Subscription Enhancement (Weeks 5-8)**

#### **Week 5-6: Feature Sets & Enhanced Plans**
- ✅ Implement FeatureSet management system
- ✅ Build Enhanced Subscription Plan Builder UI
- ✅ Create feature set compatibility validation
- ✅ Implement resource limits framework

#### **Week 7-8: Usage Tracking & Enforcement**
- ✅ Build usage tracking system
- ✅ Implement resource limit enforcement
- ✅ Create usage monitoring dashboard
- ✅ Add overage handling and billing integration

### **Phase 3: Compiled Models (Weeks 9-12)**

#### **Week 9-10: Code Generation Pipeline**
- ✅ Build schema-to-Prisma code generator
- ✅ Implement TypeScript and Zod generation
- ✅ Create query helper generation
- ✅ Build local development workflow

#### **Week 11-12: Model Compilation & Deployment**
- ✅ Implement model compilation system
- ✅ Create database migration generation
- ✅ Build component generation from schemas
- ✅ Implement testing and validation pipeline

### **Phase 4: Tenant Theming (Weeks 13-16)**

#### **Week 13-14: CSS & Branding System**
- ✅ Implement tenant CSS generation service
- ✅ Build branding configuration UI
- ✅ Create file-based CSS serving
- ✅ Implement CSS validation and sanitization

#### **Week 15-16: Media Spaces & Advanced Features**
- ✅ Build tenant media space architecture
- ✅ Implement public/private file management
- ✅ Create brand asset upload system
- ✅ Add custom domain CSS support

### **Phase 5: Integration & Polish (Weeks 17-20)**

#### **Week 17-18: Form Builder Integration**
- ✅ Enhance visual form builder for schema integration
- ✅ Implement tenant form customization
- ✅ Create form generation from schemas
- ✅ Build form validation pipeline

#### **Week 19-20: Testing & Documentation**
- ✅ Comprehensive system testing
- ✅ Performance optimization
- ✅ Security audit and hardening
- ✅ Complete documentation and guides

### **Development Approach**
- **Manual Compilation**: Local development pipeline (generate → test → commit → deploy)
- **Staging Process**: Develop → stage → approve → production
- **Full Stack Templates**: Schemas + UI + workflows + permissions
- **File-Based CSS**: Tenant-specific CSS files with variables + custom injection

---

## 🎯 **Critical Questions for Implementation Start**

### **1. Industry Template Priority**
**Question**: Which industry template should we build first?
- **A) Modeling Template** (baby + fitness + fashion models)?
- **B) Photography Template** (photographers + portfolios)?
- **C) Creative Template** (general creative professionals)?

### **2. Subscription Plan Scope**
**Question**: How many subscription tiers should we design initially?
- **A) Simple** (Starter + Pro + Enterprise)?
- **B) Detailed** (5-7 tiers with industry-specific variants)?
- **C) Modular** (Base plan + add-on feature sets)?

### **3. Compiled Model Complexity**
**Question**: How complex should the first compiled model be?
- **A) Simple** (10-15 fields, basic validation)?
- **B) Comprehensive** (30+ fields, complex relationships)?
- **C) Industry-Complete** (Full baby model with all features)?

### **4. CSS Theming Scope**
**Question**: What level of CSS customization should we support initially?
- **A) Variables Only** (colors, fonts, basic styling)?
- **B) Custom CSS** (full CSS editing with validation)?
- **C) Component Override** (replace entire UI components)?

**Ready to start implementation?** I recommend beginning with the **Industry Template System** since everything else depends on having industry-specific content defined. Should I start designing the Super Admin Industry Template Manager interface?