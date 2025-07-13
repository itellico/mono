# itellico Mono: Complete Multi-Tenant Architecture
## Master System Design Document

---

## 📋 **Table of Contents**

1. [System Overview](#system-overview)
2. [Platform Configuration Architecture](#platform-configuration-architecture)
3. [Industry Content Management](#industry-content-management)
4. [Multi-Tenant Hierarchy](#multi-tenant-hierarchy)
5. [Inheritance & Settings Flow](#inheritance--settings-flow)
6. [Role-Based Access Control](#role-based-access-control)
7. [Subscription & Billing Model](#subscription--billing-model)
8. [Tenant Installation Process](#tenant-installation-process)
9. [User Management & Invitations](#user-management--invitations)
10. [Account Features & Personal Organization](#account-features--personal-organization)
11. [Migration System](#migration-system)
12. [Go Models Implementation Plan](#go-models-implementation-plan)

---

## 🎯 **System Overview**

itellico Mono is a **white-label multi-tenant marketplace builder** with industry-specific configurations. The system supports a 4-level hierarchy designed for B2B2C business models.

### **Core Architecture**
```
Platform (Mono) - Super Admin Control
  └── Tenant (Go Models) - White-label marketplace
      └── Account (Agencies/Photographers/Models) - Subscription customers  
          └── User (Individual people) - Account members
```

### **Business Model**
- **B2B**: Platform → Tenant (€2999/month enterprise subscription)
- **B2C**: Tenant → Account (€29-999/month various tiers)
- **Revenue**: Tenant keeps B2C revenue, pays platform subscription

### **Industry Focus**
Starting with **modeling industry** (Go Models), expanding to freelancing, AI services, fitness, etc.

---

## 🔧 **Platform Configuration Architecture**

### **Central Configuration File: `platform.config.js`**

The platform configuration serves as the **single source of truth** for all industry definitions, settings hierarchies, and system behaviors.

```javascript
// platform.config.js - Master Configuration
module.exports = {
  // Platform Metadata
  platform: {
    name: "itellico Mono",
    version: "2.0.0", 
    environment: process.env.NODE_ENV,
    apiVersion: "v1"
  },

  // Supported Locales (Platform Maximum)
  i18n: {
    defaultLocale: "en-US",
    locales: ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT"],
    translationScopes: {
      categories: { /* ... */ },
      tags: { /* ... */ },
      ui: { /* ... */ },
      emails: { /* ... */ }
    }
  },

  // Platform-Level Settings Definitions
  settingsDefinitions: {
    localization: {
      supported_locales: {
        category: 'localization',
        governance: 'super_admin_only',    // Who can modify
        level: 'global',                   // Platform/Tenant/Account/User
        dataType: 'string_array',
        defaultValue: ["en-US", "de-DE", "fr-FR"],
        tenantOverride: 'subset',          // Tenants can only choose subset
        accountOverride: 'inherit',        // Accounts inherit tenant choice
        userOverride: 'single',            // Users pick one language
        validation: { minItems: 1 }
      }
    },

    features: {
      ai_translation: {
        category: 'integration',
        governance: 'super_admin_only',
        level: 'global',
        dataType: 'boolean',
        defaultValue: true,
        tenantOverride: 'disable_only',    // Can disable but not enable
        requiresSubscription: ['enterprise']
      },
      custom_branding: {
        category: 'ui', 
        governance: 'tenant_admin',
        level: 'tenant',
        dataType: 'boolean',
        defaultValue: false,
        accountOverride: 'none'            // Accounts cannot override
      }
    },

    storage: {
      max_file_size: {
        category: 'media',
        governance: 'super_admin_only',
        level: 'global', 
        dataType: 'integer',
        defaultValue: 104857600,           // 100MB platform max
        unit: 'bytes',
        tenantOverride: 'reduce_only',     // Can only reduce, not increase
        subscriptionLimits: {
          basic: 10485760,                 // 10MB
          professional: 52428800,          // 50MB
          enterprise: 104857600            // 100MB
        }
      }
    },

    subscriptions: {
      max_accounts: {
        category: 'billing',
        governance: 'super_admin_only',
        level: 'global',
        dataType: 'integer',
        defaultValue: 1000,
        tenantOverride: 'reduce_only',
        subscriptionLimits: {
          startup: 100,
          business: 500, 
          enterprise: 1000
        }
      }
    }
  },

  // Industry-Specific Configurations
  industries: {
    modeling: {
      metadata: {
        name: "Modeling & Talent Marketplace",
        version: "1.0.0",
        supportedLocales: ["en-US", "fr-FR", "de-DE", "it-IT"], // Subset of platform
        primaryMarkets: ["fashion", "commercial", "fitness"],
        requiredPlatformSubscription: 'enterprise'
      },

      // Industry Settings Overrides
      settingsOverrides: {
        localization: {
          supported_locales: ["en-US", "fr-FR", "de-DE", "it-IT"],
          industry_terminology: {
            project: "casting",
            assignment: "booking", 
            professional: "model",
            client: "agency",
            portfolio: "book"
          }
        },
        features: {
          age_verification: true,          // Industry-specific requirement
          measurement_tracking: true,      // Industry-specific feature
          portfolio_showcase: true,
          image_verification: true
        },
        storage: {
          max_file_size: 104857600,        // 100MB for high-res images
          allowed_file_types: ["jpg", "jpeg", "png", "tiff", "raw", "pdf"],
          image_compression: false         // Keep original quality
        }
      },

      // Content Definitions
      content: {
        // System Categories (Cannot be deleted by tenant)
        systemCategories: [
          {
            slug: "baby-models",
            name: "Baby Models (0-2 years)",
            description: "Professional baby modeling profiles",
            isSystemCategory: true,
            isRequired: true,
            ageRestrictions: { min: 0, max: 2 },
            subcategories: [
              { slug: "baby-commercial", name: "Commercial Baby Modeling" },
              { slug: "baby-fashion", name: "Baby Fashion Modeling" }
            ]
          },
          {
            slug: "child-models", 
            name: "Child Models (3-12 years)",
            description: "Child modeling and talent profiles",
            isSystemCategory: true,
            isRequired: true,
            ageRestrictions: { min: 3, max: 12 }
          },
          {
            slug: "teen-models",
            name: "Teen Models (13-17 years)", 
            description: "Teen modeling profiles with guardian oversight",
            isSystemCategory: true,
            isRequired: true,
            ageRestrictions: { min: 13, max: 17 }
          },
          {
            slug: "adult-models",
            name: "Adult Models (18+ years)",
            description: "Professional adult modeling profiles",
            isSystemCategory: true,
            isRequired: true,
            ageRestrictions: { min: 18, max: null }
          },
          {
            slug: "photographers",
            name: "Photographers",
            description: "Professional photographers and studios",
            isSystemCategory: true,
            isRequired: true
          }
        ],

        // System Tags (Industry-specific)
        systemTags: [
          // Physical attributes
          { slug: "height-150-160", name: "150-160cm", category: "physical", type: "measurement" },
          { slug: "height-160-170", name: "160-170cm", category: "physical", type: "measurement" },
          { slug: "height-170-180", name: "170-180cm", category: "physical", type: "measurement" },
          { slug: "height-180-plus", name: "180cm+", category: "physical", type: "measurement" },
          
          // Specializations  
          { slug: "runway", name: "Runway", category: "specialization", type: "skill" },
          { slug: "commercial", name: "Commercial", category: "specialization", type: "skill" },
          { slug: "editorial", name: "Editorial", category: "specialization", type: "skill" },
          { slug: "fitness", name: "Fitness", category: "specialization", type: "skill" },
          
          // Experience levels
          { slug: "new-face", name: "New Face", category: "experience", type: "level" },
          { slug: "experienced", name: "Experienced", category: "experience", type: "level" },
          { slug: "established", name: "Established", category: "experience", type: "level" }
        ],

        // Model Schemas (References to comprehensive seeder)
        modelSchemas: [
          {
            key: "baby_model_profile",
            reference: "baby_model",              // Links to comprehensive-model-schemas-seeder.ts
            isRequired: true,
            customizations: {
              requiredFields: ["guardian_contact", "birth_certificate"],
              hiddenFields: ["driving_license", "work_permit"],
              specialValidation: ["age_verification", "guardian_consent"]
            }
          },
          {
            key: "adult_model_profile", 
            reference: "adult_fashion_model",
            isRequired: true,
            customizations: {
              requiredFields: ["measurements", "portfolio_images"],
              specialValidation: ["age_verification", "image_rights"]
            }
          },
          {
            key: "photographer_profile",
            reference: "photographer_portfolio", 
            isRequired: true
          }
        ],

        // Option Sets (References to comprehensive seeder)
        optionSets: [
          { reference: "eye_colors", isRequired: true, isSystemOptionSet: true },
          { reference: "hair_colors", isRequired: true, isSystemOptionSet: true },
          { reference: "clothing_sizes_global", isRequired: true, isSystemOptionSet: true },
          { reference: "experience_levels", isRequired: true, isSystemOptionSet: true },
          { reference: "modeling_specializations", isRequired: true, isSystemOptionSet: true }
        ],

        // Email Templates (Tenant-level)
        emailTemplates: [
          {
            key: "casting_invitation",
            name: "Casting Invitation",
            subject: "New Casting Opportunity - {casting_title}",
            category: "casting",
            variables: ["model_name", "casting_title", "client_name", "casting_date"]
          },
          {
            key: "booking_confirmation", 
            name: "Booking Confirmation",
            subject: "Booking Confirmed - {project_title}",
            category: "booking",
            variables: ["model_name", "project_title", "shoot_date", "location"]
          }
        ],

        // Workflow Templates
        workflows: {
          model_onboarding: "modeling_profile_approval_workflow",
          casting_process: "casting_submission_workflow", 
          booking_process: "booking_confirmation_workflow"
        }
      },

      // Business Rules
      businessRules: {
        requireAgeVerification: true,
        requireGuardianConsent: true,        // For under 18
        allowDirectBooking: false,           // Must go through agencies
        requireImageRights: true,
        defaultPaymentTerms: "net_30"
      },

      // Account Subscription Tiers (Tenant can customize)
      suggestedSubscriptionTiers: [
        {
          name: "Parent/Guardian",
          price: 29,
          currency: "EUR", 
          interval: "month",
          limits: {
            profiles: 3,                     // Up to 3 children
            storage: 1073741824,             // 1GB
            features: ["basic_portfolio", "casting_applications"]
          }
        },
        {
          name: "Individual Model",
          price: 99,
          currency: "EUR",
          interval: "month", 
          limits: {
            profiles: 1,
            storage: 5368709120,             // 5GB
            features: ["professional_portfolio", "analytics", "direct_messaging"]
          }
        },
        {
          name: "Small Agency",
          price: 299,
          currency: "EUR",
          interval: "month",
          limits: {
            profiles: 25,
            storage: 21474836480,            // 20GB
            features: ["agency_dashboard", "client_management", "bulk_operations"]
          }
        },
        {
          name: "Large Agency", 
          price: 999,
          currency: "EUR",
          interval: "month",
          limits: {
            profiles: 100,
            storage: 107374182400,           // 100GB
            features: ["white_label_portal", "api_access", "priority_support"]
          }
        }
      ]
    },

    // Additional industries...
    freelancing: { /* Similar structure */ },
    fitness: { /* Similar structure */ },
    ai_services: { /* Similar structure */ }
  },

  // Feature Flags (Platform-wide)
  features: {
    enableIndustryMigration: true,
    enableAccountSubscriptions: true,
    enableCustomDomains: true,
    enableAPIAccess: false,                  // Not ready yet
    enableAdvancedAnalytics: true
  }
};
```

---

## 🏗️ **Industry Content Management**

### **Content Installation Process**

When a tenant installs an industry package, the system automatically provisions:

```typescript
// src/lib/services/industry-installation.service.ts
export class IndustryInstallationService {
  
  static async installIndustryPackage(
    tenantId: number,
    industryKey: string,
    options: InstallationOptions = {}
  ): Promise<InstallationResult> {
    
    const industry = getPlatformConfig().industries[industryKey];
    
    // 1. Install System Categories (Protected)
    await this.installSystemCategories(tenantId, industry.content.systemCategories);
    
    // 2. Install System Tags (Protected) 
    await this.installSystemTags(tenantId, industry.content.systemTags);
    
    // 3. Install Model Schemas (from comprehensive seeder references)
    await this.installModelSchemas(tenantId, industry.content.modelSchemas);
    
    // 4. Install Option Sets (from comprehensive seeder references)
    await this.installOptionSets(tenantId, industry.content.optionSets);
    
    // 5. Apply Settings Overrides
    await this.applySettingsOverrides(tenantId, industry.settingsOverrides);
    
    // 6. Install Email Templates
    await this.installEmailTemplates(tenantId, industry.content.emailTemplates);
    
    // 7. Set Business Rules
    await this.applyBusinessRules(tenantId, industry.businessRules);
    
    return {
      success: true,
      installedComponents: {
        categories: industry.content.systemCategories.length,
        tags: industry.content.systemTags.length,
        schemas: industry.content.modelSchemas.length,
        optionSets: industry.content.optionSets.length,
        emailTemplates: industry.content.emailTemplates.length
      }
    };
  }
}
```

### **Content Protection Levels**

```typescript
interface ContentProtectionLevel {
  isSystemContent: boolean;      // Cannot be deleted by tenant
  isRequired: boolean;           // Required for industry compliance  
  canModify: boolean;           // Can tenant modify properties
  canHide: boolean;             // Can tenant hide from UI
  source: 'platform' | 'industry' | 'tenant';
}

// Example: Baby Models category
{
  slug: "baby-models",
  name: "Baby Models (0-2 years)", 
  isSystemContent: true,         // Platform/industry protected
  isRequired: true,              // Cannot be disabled
  canModify: false,              // Cannot change age restrictions
  canHide: false,                // Must be visible (compliance)
  source: 'industry'
}
```

---

## 🏢 **Multi-Tenant Hierarchy**

### **Database Schema Relationships**

```sql
-- Platform Level (Managed by mono super admins)
Platform Settings (Global defaults)

-- Tenant Level (White-label marketplace - e.g., Go Models)
Tenant {
  id: 1,
  name: "Go Models",
  domain: "gomodels.com", 
  industryType: "modeling",
  subscriptionLevel: "enterprise",
  settings: {...},              -- Tenant-specific overrides
  features: {...}               -- Enabled features
}

-- Account Level (Agencies, Photographers, Individual Models)
Account {
  id: 101,
  tenantId: 1,
  accountType: "business",      -- "personal" | "business" 
  email: "info@elitemodels.com",
  subscriptionTier: "large_agency",
  subscriptionStatus: "active",
  limits: {
    profiles: 100,
    storage: 107374182400
  },
  personalTags: [...]           -- Account-internal organization
}

-- User Level (Individual people within accounts)
User {
  id: 1001, 
  accountId: 101,
  firstName: "Maria",
  lastName: "Garcia",
  accountRole: "account_manager",  -- Role within the account
  platformRoles: ["user"]          -- Platform-level permissions
}
```

### **Subdomain/Domain Resolution**

```typescript
// Account Custom Domains/Subdomains
interface AccountDomain {
  accountId: number;
  domain: string;                    // "elitemodels.gomodels.com"
  customDomain?: string;             // "models.eliteagency.com" 
  isActive: boolean;
  resolvedTenantId: number;          // Always resolves to parent tenant
}

// When user visits: elitemodels.gomodels.com
// System resolves to: 
// - Tenant: Go Models (ID: 1)
// - Account: Elite Models (ID: 101) 
// - Shows only Elite Models' profiles within Go Models marketplace
```

---

## ⚡ **Inheritance & Settings Flow**

### **4-Level Settings Inheritance**

```
Platform Default (platform.config.js)
  ↓ [Industry Override] 
Industry Config (settingsOverrides)
  ↓ [Tenant Override]
Tenant Settings (database)
  ↓ [User Preference]
User Settings (database)
```

### **Example: File Upload Limits**

```typescript
// 1. Platform Default (100MB max)
platform.settingsDefinitions.storage.max_file_size.defaultValue = 104857600;

// 2. Industry Override (modeling needs high-res images)
industries.modeling.settingsOverrides.storage.max_file_size = 104857600; // Keep max

// 3. Tenant Override (Go Models reduces to 50MB to save costs)
tenant_settings: {
  key: "storage.max_file_size",
  value: 52428800,
  tenantId: 1
}

// 4. User Preference (User cannot override - inherit tenant limit)
// Result: User gets 50MB limit
```

### **Settings Resolution Algorithm**

```typescript
export class SettingsResolver {
  static async getEffectiveSetting(
    settingKey: string,
    context: {
      tenantId: number;
      accountId?: number; 
      userId?: number;
    }
  ): Promise<EffectiveSetting> {
    
    const definition = this.getSettingDefinition(settingKey);
    let effectiveValue = definition.defaultValue;
    let source = 'platform_default';
    
    // 1. Check industry override
    const industry = await this.getTenantIndustry(context.tenantId);
    if (industry.settingsOverrides[settingKey]) {
      effectiveValue = industry.settingsOverrides[settingKey];
      source = 'industry_override';
    }
    
    // 2. Check tenant override  
    const tenantSetting = await this.getTenantSetting(settingKey, context.tenantId);
    if (tenantSetting && this.canTenantOverride(definition, effectiveValue, tenantSetting.value)) {
      effectiveValue = tenantSetting.value;
      source = 'tenant_override';
    }
    
    // 3. Check user preference (if allowed)
    if (context.userId && definition.userOverride !== 'none') {
      const userSetting = await this.getUserSetting(settingKey, context.userId);
      if (userSetting && this.canUserOverride(definition, effectiveValue, userSetting.value)) {
        effectiveValue = userSetting.value;
        source = 'user_preference';
      }
    }
    
    return {
      value: effectiveValue,
      source,
      canModify: this.canModify(definition, context),
      restrictions: this.getRestrictions(definition, context)
    };
  }
}
```

---

## 🔐 **Role-Based Access Control**

### **Multi-Level Permission System**

```typescript
// Platform-Level Roles (Cross-tenant permissions)
export const PLATFORM_ROLES = {
  SUPER_ADMIN: 'super_admin',           // Full platform access
  PLATFORM_SUPPORT: 'platform_support', // Customer support
  TENANT_ADMIN: 'tenant_admin',         // Full tenant access
  CONTENT_MODERATOR: 'content_moderator', // Content management
  USER: 'user'                          // Basic user
} as const;

// Account-Level Roles (Within account/agency)
export const ACCOUNT_ROLES = {
  ACCOUNT_OWNER: 'account_owner',       // Full account access + billing
  ACCOUNT_MANAGER: 'account_manager',   // Manage users/entities, no billing
  CATEGORY_ADMIN: 'category_admin',     // Create/edit categories (if permitted)
  ENTITY_EDITOR: 'entity_editor',       // Edit assigned profiles only
  ENTITY_VIEWER: 'entity_viewer'        // View assigned profiles only
} as const;
```

### **Permission Inheritance Matrix**

```typescript
interface PermissionContext {
  userId: number;
  accountId: number;
  tenantId: number;
  platformRoles: string[];      // Platform-level permissions
  accountRole: string;          // Role within account
  resource: string;             // What they're trying to access
  action: string;               // What they're trying to do
}

// Permission Resolution
class PermissionResolver {
  static canPerformAction(context: PermissionContext): boolean {
    
    // 1. Super admin can do anything
    if (context.platformRoles.includes('super_admin')) return true;
    
    // 2. Tenant admin can do anything within their tenant
    if (context.platformRoles.includes('tenant_admin')) {
      return this.isWithinTenant(context.resource, context.tenantId);
    }
    
    // 3. Account-level permissions
    switch (context.accountRole) {
      case 'account_owner':
        return this.isWithinAccount(context.resource, context.accountId);
      
      case 'account_manager':
        return this.canAccountManagerPerform(context.action, context.resource);
      
      case 'entity_editor':
        return this.canEditEntity(context.resource, context.userId);
      
      default:
        return false;
    }
  }
}
```

### **Industry-Specific Permissions**

```typescript
// Modeling Industry Permissions
export const MODELING_PERMISSIONS = {
  // Age-restricted content
  'minor_profiles.view': ['account_owner', 'account_manager', 'legal_guardian'],
  'minor_profiles.edit': ['legal_guardian', 'account_owner'],
  
  // Professional content
  'adult_profiles.view': ['account_owner', 'account_manager', 'entity_editor'],
  'adult_profiles.edit': ['profile_owner', 'account_manager', 'account_owner'],
  
  // Agency operations
  'casting.create': ['account_owner', 'account_manager'],
  'casting.manage': ['account_owner', 'account_manager'],
  
  // Financial operations
  'billing.view': ['account_owner'],
  'billing.manage': ['account_owner']
} as const;
```

---

## 💰 **Subscription & Billing Model**

### **B2B2C Revenue Flow**

```
itellico Mono
  ↓ (€2999/month)
Go Models (Tenant)
  ↓ (€29-999/month)
Elite Models Agency (Account)
  ↓ (Account manages)
Individual Users
```

### **Subscription Schema**

```sql
-- Platform Subscription (B2B)
PlatformSubscription {
  tenantId: 1,
  planName: "enterprise", 
  monthlyPrice: 2999,
  currency: "EUR",
  limits: {
    maxAccounts: 1000,
    maxStorage: 1099511627776,    -- 1TB
    maxAPIRequests: 100000
  },
  stripeSubscriptionId: "sub_xxx"
}

-- Account Subscription (B2C - Tenant's customers)
AccountSubscription {
  accountId: 101,
  tenantId: 1,
  planName: "large_agency",
  monthlyPrice: 999,              -- Tenant's pricing
  currency: "EUR",
  limits: {
    profiles: 100,
    storage: 107374182400,        -- 100GB
    features: ["api_access", "white_label_portal"]
  },
  stripeSubscriptionId: "sub_yyy", -- Tenant's Stripe Connect
  billingEmail: "billing@elitemodels.com"
}
```

### **Subscription Limit Enforcement**

```typescript
export class SubscriptionLimiter {
  
  static async canCreateProfile(accountId: number): Promise<boolean> {
    const subscription = await this.getAccountSubscription(accountId);
    const currentProfiles = await this.getProfileCount(accountId);
    
    return currentProfiles < subscription.limits.profiles;
  }
  
  static async canUploadFile(accountId: number, fileSize: number): Promise<boolean> {
    const subscription = await this.getAccountSubscription(accountId);
    const currentStorage = await this.getStorageUsage(accountId);
    
    return (currentStorage + fileSize) <= subscription.limits.storage;
  }
  
  static async hasFeatureAccess(accountId: number, feature: string): Promise<boolean> {
    const subscription = await this.getAccountSubscription(accountId);
    
    return subscription.limits.features.includes(feature);
  }
}
```

---

## 🚀 **Tenant Installation Process**

### **Complete Tenant Setup Workflow**

```typescript
export class TenantInstallationService {
  
  static async installTenant(request: TenantInstallationRequest): Promise<TenantInstallationResult> {
    
    // 1. Create Tenant Record
    const tenant = await this.createTenant({
      name: request.tenantName,
      domain: request.domain,
      industryType: request.industryType,
      subscriptionLevel: request.subscriptionLevel
    });
    
    // 2. Install Industry Package  
    await IndustryInstallationService.installIndustryPackage(
      tenant.id, 
      request.industryType
    );
    
    // 3. Create Tenant Admin User
    const adminUser = await this.createTenantAdmin({
      tenantId: tenant.id,
      email: request.adminEmail,
      firstName: request.adminFirstName,
      lastName: request.adminLastName,
      temporaryPassword: this.generateTempPassword()
    });
    
    // 4. Set up Stripe Connect (for B2C billing)
    const stripeAccount = await this.setupStripeConnect(tenant.id);
    
    // 5. Configure Domain/DNS
    await this.configureDomain(tenant.domain);
    
    // 6. Send Welcome Email
    await this.sendTenantWelcomeEmail(adminUser.email, {
      tenantName: tenant.name,
      loginUrl: `https://${tenant.domain}/admin/login`,
      temporaryPassword: adminUser.temporaryPassword
    });
    
    return {
      success: true,
      tenant,
      adminUser,
      industryComponentsInstalled: await this.getInstalledComponents(tenant.id)
    };
  }
}
```

### **Go Models Installation Example**

```typescript
// Example: Installing Go Models
const goModelsInstallation = {
  tenantName: "Go Models",
  domain: "gomodels.com",
  industryType: "modeling", 
  subscriptionLevel: "enterprise",
  adminEmail: "admin@gomodels.com",
  adminFirstName: "Maria",
  adminLastName: "Schmidt"
};

// Results in:
// - Tenant created with modeling industry content
// - 20+ model categories installed (baby, child, teen, adult, photographers)
// - 100+ modeling-specific tags installed  
// - 15+ model schemas installed (baby_model, adult_model, photographer, etc.)
// - 200+ option sets installed (heights, measurements, experience levels)
// - Email templates for casting, booking, portfolio review
// - Admin user with tenant_admin role created
// - Stripe Connect configured for B2C billing
```

---

## 👥 **User Management & Invitations**

### **User Invitation Flow**

```typescript
// Multi-level invitation system
export class UserInvitationService {
  
  // Tenant Admin invites Account Owner (Agency)
  static async inviteAccountOwner(request: {
    tenantId: number;
    email: string;
    accountType: 'personal' | 'business';
    suggestedSubscription?: string;
    invitedBy: number;
  }): Promise<InvitationResult> {
    
    // Create invitation record
    const invitation = await this.createInvitation({
      type: 'account_owner',
      tenantId: request.tenantId,
      email: request.email,
      invitedBy: request.invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Send invitation email
    await this.sendInvitationEmail(request.email, {
      invitationType: 'account_owner',
      tenantName: await this.getTenantName(request.tenantId),
      signupUrl: `https://app.gomodels.com/signup?invitation=${invitation.token}`,
      suggestedSubscription: request.suggestedSubscription
    });
    
    return { success: true, invitation };
  }
  
  // Account Owner invites Users (Agency Staff)
  static async inviteAccountUser(request: {
    accountId: number;
    email: string;
    accountRole: AccountRole;
    invitedBy: number;
  }): Promise<InvitationResult> {
    
    // Verify invitation limits
    const account = await this.getAccount(request.accountId);
    const currentUsers = await this.getAccountUserCount(request.accountId);
    
    if (currentUsers >= account.subscription.limits.users) {
      throw new Error('Account user limit reached');
    }
    
    // Create invitation
    const invitation = await this.createInvitation({
      type: 'account_user',
      accountId: request.accountId,
      email: request.email,
      role: request.accountRole,
      invitedBy: request.invitedBy,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    });
    
    return { success: true, invitation };
  }
}
```

### **Account Setup Wizard**

```typescript
// After account owner accepts invitation
export class AccountSetupWizard {
  
  static async setupAccount(invitation: Invitation): Promise<SetupResult> {
    
    // Step 1: Create Account
    const account = await this.createAccount({
      tenantId: invitation.tenantId,
      email: invitation.email,
      accountType: invitation.accountType
    });
    
    // Step 2: Create Account Owner User
    const user = await this.createUser({
      accountId: account.id,
      email: invitation.email,
      accountRole: 'account_owner',
      platformRoles: ['user']
    });
    
    // Step 3: Set up Subscription (if required)
    if (invitation.suggestedSubscription) {
      await this.presentSubscriptionOptions(account.id, {
        suggested: invitation.suggestedSubscription,
        tenantId: invitation.tenantId
      });
    }
    
    // Step 4: Configure Account Preferences
    await this.presentAccountConfiguration(account.id, {
      availableFeatures: await this.getAvailableFeatures(invitation.tenantId),
      industrySettings: await this.getIndustrySettings(invitation.tenantId)
    });
    
    return { account, user };
  }
}
```

---

## 🏷️ **Account Features & Personal Organization**

### **Personal Tags System**

```typescript
// Account-internal organization (NOT marketplace visible)
interface PersonalTag {
  id: number;
  accountId: number;           // Belongs to specific account
  name: string;                // "A-list", "Available", "Premium"
  description?: string;
  color?: string;              // For UI organization
  category: 'status' | 'quality' | 'specialization' | 'client' | 'campaign';
  isPrivate: boolean;          // Internal use only
  usageCount: number;          // How many profiles tagged
  createdBy: number;           // User who created it
  createdAt: Date;
}

// Example personal tags for Elite Models agency:
const personalTags = [
  // Status tags
  { name: "Available", category: "status", color: "green" },
  { name: "Booked", category: "status", color: "red" },
  { name: "On Hold", category: "status", color: "yellow" },
  
  // Quality tags  
  { name: "A-List", category: "quality", color: "gold" },
  { name: "Rising Star", category: "quality", color: "blue" },
  { name: "New Face", category: "quality", color: "purple" },
  
  // Client tags
  { name: "Chanel Exclusive", category: "client", color: "black" },
  { name: "Nike Campaign", category: "client", color: "orange" },
  { name: "Available for Bookings", category: "client", color: "green" }
];
```

### **Account Subdomain/Portal**

```typescript
// Account-specific portal configuration
interface AccountPortal {
  accountId: number;
  subdomain: string;           // "elitemodels.gomodels.com"
  customDomain?: string;       // "models.eliteagency.com"
  portalSettings: {
    showPublicPortfolio: boolean;    // Public model browsing
    requireClientLogin: boolean;     // Client authentication
    customBranding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      customCSS?: string;
    };
    contentFilters: {
      showOnlyAccountModels: boolean; // Only show this agency's models
      allowedCategories: string[];    // Which categories to display
      allowedTags: string[];          // Which tags to display
    };
  };
}

// When client visits: elitemodels.gomodels.com
// They see:
// - Elite Models branding
// - Only Elite Models' talent
// - Customized portfolio layout
// - Agency contact information
// - But still within Go Models infrastructure
```

### **Industry Terminology Customization**

```typescript
// Account-level terminology overrides
interface AccountTerminology {
  accountId: number;
  terminology: {
    // Base terms from industry config
    project: "casting" | "shoot" | "booking" | "audition";
    professional: "model" | "talent" | "performer" | "artist";
    client: "agency" | "brand" | "production" | "client";
    assignment: "booking" | "job" | "gig" | "project";
    
    // Custom terms
    portfolio: "book" | "portfolio" | "lookbook";
    application: "submission" | "application" | "casting";
  };
  emailTerminology: {
    // Used in email templates
    greeting: "Dear" | "Hello" | "Hi";
    closing: "Best regards" | "Sincerely" | "Cheers";
    signature: string;
  };
}
```

---

## 🔄 **Migration System**

### **Account → Tenant Migration**

```typescript
export class AccountMigrationService {
  
  static async requestMigration(request: MigrationRequest): Promise<MigrationRequestResult> {
    
    // Validate migration eligibility
    const account = await this.getAccount(request.accountId);
    const eligibility = await this.checkMigrationEligibility(account);
    
    if (!eligibility.eligible) {
      return { 
        success: false, 
        reason: eligibility.reason,
        requirements: eligibility.missingRequirements
      };
    }
    
    // Create migration request
    const migrationRequest = await this.createMigrationRequest({
      accountId: request.accountId,
      requestedTenantName: request.tenantName,
      requestedDomain: request.domain,
      businessJustification: request.businessJustification,
      migrationData: {
        transferProfiles: request.transferProfiles,
        transferPersonalTags: request.transferPersonalTags,
        transferClientData: request.transferClientData,
        transferBilling: request.transferBilling
      },
      status: 'pending_review'
    });
    
    // Notify platform administrators
    await this.notifyPlatformAdmins(migrationRequest);
    
    return { success: true, migrationRequest };
  }
  
  static async executeMigration(migrationId: number): Promise<MigrationResult> {
    
    const migration = await this.getMigrationRequest(migrationId);
    
    // 1. Create new tenant
    const newTenant = await TenantInstallationService.installTenant({
      tenantName: migration.requestedTenantName,
      domain: migration.requestedDomain,
      industryType: await this.getAccountIndustryType(migration.accountId),
      subscriptionLevel: 'enterprise', // Default for migrated accounts
      adminEmail: migration.account.email
    });
    
    // 2. Migrate account data
    const migrationResults = await this.migrateAccountData(migration.accountId, newTenant.id, {
      transferProfiles: migration.migrationData.transferProfiles,
      transferPersonalTags: migration.migrationData.transferPersonalTags,
      transferClientData: migration.migrationData.transferClientData
    });
    
    // 3. Update billing
    if (migration.migrationData.transferBilling) {
      await this.migrateBilling(migration.accountId, newTenant.id);
    }
    
    // 4. Deactivate old account
    await this.deactivateAccount(migration.accountId);
    
    // 5. Send completion notification
    await this.sendMigrationCompleteEmail(migration.account.email, {
      newTenantUrl: `https://${migration.requestedDomain}`,
      migrationSummary: migrationResults
    });
    
    return {
      success: true,
      newTenant,
      migrationSummary: migrationResults
    };
  }
}
```

### **Migration Eligibility Criteria**

```typescript
interface MigrationEligibility {
  eligible: boolean;
  reason?: string;
  missingRequirements?: string[];
  minimumRequirements: {
    minimumProfiles: 50;           // Must have substantial content
    minimumMonthlyRevenue: 5000;   // Must demonstrate business viability
    minimumAccountAge: 6;          // Must be established (months)
    goodStanding: boolean;         // No payment issues
    businessVerification: boolean; // Must be verified business
  };
}
```

---

## 🎯 **Go Models Implementation Plan**

### **Phase 1: Core Infrastructure (Month 1-2)**

**Objectives**: Get Go Models operational with basic modeling industry features

**Deliverables**:
1. **Platform Configuration**
   - Complete `platform.config.js` modeling industry configuration
   - Install comprehensive model schemas and option sets
   - Set up modeling-specific categories and tags

2. **Tenant Installation**
   - Install Go Models tenant with modeling industry package
   - Configure domain (gomodels.com)
   - Set up tenant admin access

3. **Basic Account System**
   - Account subscription tiers (Parent, Individual Model, Small Agency, Large Agency)
   - Basic Stripe Connect integration for B2C billing
   - Account creation and user invitation flows

**Success Criteria**:
- Go Models tenant fully operational
- Basic account registration and subscription working
- Modeling profiles can be created and managed

### **Phase 2: Advanced Account Features (Month 3-4)**

**Objectives**: Add account-level features and personal organization

**Deliverables**:
1. **Personal Tags System**
   - Account-internal tag creation and management
   - Tag application to profiles (non-marketplace)
   - Tag-based filtering and organization

2. **Account Portals**  
   - Subdomain configuration (agencyname.gomodels.com)
   - Basic account-specific branding
   - Public portfolio display for agencies

3. **Industry Terminology**
   - Account-level email template customization
   - Industry-specific terminology preferences
   - Enhanced user interface language

**Success Criteria**:
- Agencies can organize their talent with personal tags
- Account portals provide branded experience
- Email communications use appropriate industry terminology

### **Phase 3: Business Growth Features (Month 5-6)**

**Objectives**: Add features that drive subscription upgrades and retention

**Deliverables**:
1. **Advanced Analytics**
   - Account-level performance metrics
   - Profile view and engagement analytics
   - Subscription usage reporting

2. **Client Management**
   - Client portal access for brands/agencies
   - Casting and booking workflow management
   - Client communication tools

3. **Migration System**
   - Account → Tenant migration functionality
   - Migration request and approval workflow
   - Data transfer and billing migration

**Success Criteria**:
- Agencies have clear ROI visibility from platform usage
- Client relationships are managed effectively within platform
- Successful accounts can upgrade to independent tenants

### **Phase 4: Scale & Optimization (Month 7-8)**

**Objectives**: Optimize for scale and add advanced features

**Deliverables**:
1. **Performance Optimization**
   - Advanced caching for high-traffic scenarios
   - Database optimization for large account portfolios
   - CDN integration for global performance

2. **Advanced Features**
   - API access for large agencies
   - Custom integrations and webhooks
   - Advanced search and filtering

3. **Multi-Industry Expansion**
   - Freelancing industry configuration
   - AI services industry configuration
   - Industry-agnostic features and improvements

**Success Criteria**:
- Platform handles high-volume usage efficiently
- Large agencies have advanced tools for integration
- Foundation ready for additional industry verticals

### **Key Performance Indicators (KPIs)**

**User Adoption**:
- Monthly active accounts
- Profile creation rate
- Subscription upgrade rate

**Business Metrics**:
- Account revenue per month
- Account retention rate  
- Migration requests (indicates success)

**Technical Metrics**:
- Platform performance (page load times)
- System uptime and reliability
- Storage and bandwidth usage

### **Risk Mitigation**

**Technical Risks**:
- Database performance with large portfolios → Implement proper indexing and caching
- Complex inheritance system → Comprehensive testing and documentation
- Integration complexity → Start simple, iterate based on user feedback

**Business Risks**:
- Low account adoption → Focus on clear value proposition and pricing
- High churn rate → Ensure strong onboarding and support
- Feature complexity → Prioritize based on actual user needs, not assumptions

---

## 📋 **Next Steps & Discussion Points**

### **Immediate Questions for Discussion**

1. **Go Models Subscription Tiers**: Are the suggested pricing tiers (€29-999) appropriate for the German modeling market?

2. **Content Protection**: Should baby/child model categories be completely locked (compliance), or allow some tenant customization?

3. **Personal Tags**: Should there be a limit on personal tags per account to prevent chaos?

4. **Migration Pricing**: What should be the business model for Account → Tenant migrations?

5. **Industry Expansion**: Which industry should be next after modeling is stable?

### **Technical Validation Needed**

1. **Performance Testing**: Database queries with 1000+ accounts and 100,000+ profiles
2. **Security Audit**: Multi-tenant data isolation and access controls  
3. **Integration Testing**: Stripe Connect billing flow end-to-end
4. **User Experience**: Account setup and onboarding flow testing

### **Business Validation Needed**

1. **Market Research**: Validate subscription pricing with target agencies
2. **Competitive Analysis**: Compare features with existing modeling platforms
3. **Customer Interviews**: Validate personal tags and portal features with agencies
4. **Legal Review**: Ensure compliance with modeling industry regulations

---

**This document serves as the master reference for itellico Mono's multi-tenant architecture. All implementation should align with the principles and patterns defined here.**

*Last Updated: January 2025*  
*Version: 1.0*  
*Next Review: February 2025*