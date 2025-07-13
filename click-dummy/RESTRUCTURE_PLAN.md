# Click-Dummy Restructure Plan: Multi-Brand Generic Platform

## 🎯 Alignment with MASTER.md Architecture

This document outlines the comprehensive restructure of all click-dummy prototypes to align with our finalized multi-brand generic platform architecture.

## ❌ PROTOTYPES TO REMOVE

### GUI Builders (7 prototypes) - Contradicts our "no GUI builders" decision
- `platform/schemas/schema-builder.php` ❌ REMOVE
- `platform/schemas/multi-step-wizard.php` ❌ REMOVE  
- `platform/schemas/context-aware-renderer.php` ❌ REMOVE
- `platform/schemas/component-library.php` ❌ REMOVE
- `platform/templates/template-builder.php` ❌ REMOVE
- `platform/templates/template-builder-v2.php` ❌ REMOVE
- `platform/performance/page-builder-impact.php` ❌ REMOVE

**Reason**: We decided on developer-built React components with configuration, not GUI builders.

## 🔄 MAJOR CONCEPTUAL UPDATES

### Platform Tier → Multi-Brand Control Center
**Current**: Single platform management
**New**: Multi-brand management for go-models.com, go-pets.com, voice-agents.com

**Key Changes**:
- Brand creation and management dashboard
- Industry template library (modeling, pets, voice, beauty, etc.)
- Cross-brand analytics and reporting
- Platform-wide integrations (OAuth, payments, webhooks)
- Multi-brand subscription management

### Tenant Tier → Brand Management (NOT Agency Management)
**Current**: Agency-focused features
**New**: Brand-focused features where YOU control the brand

**Key Changes**:
- Tenant = Brand (go-models.com, go-pets.com, etc.)
- Brand-specific category/tag management
- Cross-brand data sharing configuration
- Brand storefront customization
- Industry-specific workflow configuration

### Account Tier → Business/Agency Management
**Current**: Basic account features
**New**: This is where agencies/businesses manage their operations

**Key Changes**:
- **Custom field management** (ONLY place for custom fields)
- Industry-agnostic talent management
- Advanced search and filtering
- Usage-based billing and analytics
- Cross-brand talent discovery

### User Tier → Professional Profiles
**Current**: Model-specific features  
**New**: Generic professional profiles for any industry

**Key Changes**:
- Portfolio → Showcase (works for models, pets, voice actors)
- Comp Card → Profile Card (generic professional card)
- Generic availability/scheduling system
- Cross-industry networking

### Public Tier → Multi-Brand Discovery
**Current**: Single brand showcases
**New**: Multi-brand platform showcases

**Key Changes**:
- Brand directory (showcase all platform brands)
- Universal search across all brands
- Dynamic brand sites
- Cross-industry opportunities

## 🆕 NEW PROTOTYPES NEEDED

### Platform Level
1. `platform/brands/brand-manager.php` - Multi-brand control dashboard
2. `platform/industry-templates/template-library.php` - Industry template management
3. `platform/cross-brand/integration-hub.php` - Cross-brand API management
4. `platform/analytics/multi-brand-dashboard.php` - Cross-brand analytics

### Tenant Level  
5. `tenant/brand-config/industry-setup.php` - Brand industry configuration
6. `tenant/cross-brand/data-sharing.php` - Cross-brand data sharing setup
7. `tenant/gig-templates/template-manager.php` - Industry-specific gig templates

### Account Level
8. `account/custom-fields/field-manager.php` - Custom field management interface
9. `account/cross-brand/talent-discovery.php` - Search talent across brands
10. `account/billing/usage-analytics.php` - Account-level usage tracking

### User Level
11. `user/cross-industry/profile-showcase.php` - Multi-industry profile
12. `user/networking/professional-network.php` - Cross-industry networking

### Public Level  
13. `public/platform/brand-directory.php` - Directory of all platform brands
14. `public/search/universal-search.php` - Search across all brands
15. `public/cross-industry/opportunities.php` - Cross-industry job board

## 📝 TERMINOLOGY UPDATES

### Industry-Agnostic Terms
| Old (Modeling-Specific) | New (Generic) |
|------------------------|---------------|
| Model | Professional/Talent |
| Casting | Gig/Project/Job |
| Comp Card | Profile Card |
| Agency | Business/Account |
| Portfolio | Showcase |
| Measurements | Specifications |
| Casting Call | Job Posting |
| Model Categories | Talent Categories |

### Multi-Brand Terms
| Old | New |
|-----|-----|
| Platform | Multi-Brand Platform |
| Tenant | Brand |
| go-models specific | Brand-agnostic with examples |

## 🎯 UPDATED PROTOTYPE STRUCTURE

### Platform Tier (Multi-Brand Management)
```
platform/
├── brands/
│   ├── brand-manager.php ⭐ NEW
│   ├── brand-analytics.php ⭐ UPDATED
│   └── brand-billing.php ⭐ UPDATED
├── industry-templates/
│   ├── template-library.php ⭐ NEW
│   ├── modeling-template.php ⭐ UPDATED
│   ├── pets-template.php ⭐ NEW
│   └── voice-template.php ⭐ NEW
├── features/
│   ├── feature-flags.php ⭐ UPDATED (multi-brand)
│   └── module-management.php ⭐ UPDATED (generic)
├── integrations/
│   ├── oauth-management.php ⭐ UPDATED
│   ├── payment-systems.php ⭐ UPDATED
│   └── webhook-management.php ⭐ UPDATED
└── cross-brand/
    ├── integration-hub.php ⭐ NEW
    ├── data-sharing.php ⭐ NEW
    └── analytics-dashboard.php ⭐ NEW
```

### Tenant Tier (Brand Management)
```
tenant/
├── brand-config/
│   ├── industry-setup.php ⭐ NEW
│   ├── categories.php ⭐ UPDATED (brand-specific)
│   └── workflows.php ⭐ UPDATED (industry-agnostic)
├── gig-system/
│   ├── gig-templates.php ⭐ NEW (generic)
│   ├── pricing-models.php ⭐ UPDATED
│   └── booking-system.php ⭐ UPDATED
├── content/
│   ├── brand-pages.php ⭐ UPDATED
│   ├── seo-management.php ⭐ UPDATED
│   └── media-library.php ⭐ UPDATED
└── cross-brand/
    ├── data-sharing.php ⭐ NEW
    └── api-integration.php ⭐ NEW
```

### Account Tier (Business/Agency Management)
```
account/
├── custom-fields/
│   ├── field-manager.php ⭐ NEW (CRITICAL)
│   ├── field-templates.php ⭐ NEW
│   └── data-validation.php ⭐ NEW
├── talent-management/
│   ├── talent-database.php ⭐ UPDATED (generic)
│   ├── advanced-search.php ⭐ UPDATED
│   └── talent-analytics.php ⭐ UPDATED
├── gig-management/
│   ├── job-posting.php ⭐ UPDATED (generic)
│   ├── application-management.php ⭐ UPDATED
│   └── booking-coordination.php ⭐ UPDATED
├── billing/
│   ├── usage-analytics.php ⭐ NEW
│   ├── subscription-management.php ⭐ UPDATED
│   └── payment-history.php ⭐ UPDATED
└── cross-brand/
    ├── talent-discovery.php ⭐ NEW
    └── cross-posting.php ⭐ NEW
```

### User Tier (Professional Profiles)
```
user/
├── profile/
│   ├── professional-showcase.php ⭐ UPDATED (generic)
│   ├── profile-card.php ⭐ UPDATED (was comp-card)
│   └── availability.php ⭐ UPDATED (generic)
├── showcase/
│   ├── media-portfolio.php ⭐ UPDATED (generic)
│   ├── project-history.php ⭐ UPDATED
│   └── testimonials.php ⭐ UPDATED
├── gigs/
│   ├── job-applications.php ⭐ UPDATED (generic)
│   ├── booking-calendar.php ⭐ UPDATED
│   └── earnings-tracking.php ⭐ UPDATED
└── networking/
    ├── professional-network.php ⭐ NEW
    ├── cross-industry.php ⭐ NEW
    └── messaging.php ⭐ UPDATED
```

### Public Tier (Multi-Brand Discovery)
```
public/
├── platform/
│   ├── brand-directory.php ⭐ NEW
│   ├── platform-overview.php ⭐ UPDATED
│   └── success-stories.php ⭐ UPDATED (multi-brand)
├── brands/
│   ├── go-models/ ⭐ UPDATED (example brand)
│   ├── go-pets/ ⭐ NEW (example brand)
│   ├── voice-agents/ ⭐ NEW (example brand)
│   └── brand-template/ ⭐ NEW (generic template)
├── search/
│   ├── universal-search.php ⭐ NEW
│   ├── cross-brand-discovery.php ⭐ NEW
│   └── talent-marketplace.php ⭐ UPDATED (generic)
└── opportunities/
    ├── cross-industry-jobs.php ⭐ NEW
    ├── featured-gigs.php ⭐ UPDATED (generic)
    └── success-matching.php ⭐ NEW
```

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1: Remove Contradictory Prototypes
1. Remove all 7 GUI builder prototypes
2. Update terminology across all existing files

### Phase 2: Platform & Tenant Tier Updates  
3. Create multi-brand management interfaces
4. Update tenant interfaces for brand management
5. Add industry template system

### Phase 3: Account & User Tier Updates
6. Create custom field management (CRITICAL)
7. Update user interfaces to be industry-agnostic
8. Add cross-brand features

### Phase 4: Public Tier & New Features
9. Create multi-brand public interfaces
10. Add cross-brand discovery features
11. Create example brands (pets, voice agents)

This restructure will perfectly align the click-dummy with our MASTER.md architecture, demonstrating a true multi-brand generic platform.