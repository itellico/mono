# itellico Mono Database Seeders

This document describes the complete database seeding system for the itellico Mono, designed to set up a fully functional multi-tenant creative industry marketplace with minimal manual configuration.

## 🎯 Overview

The itellico Mono seeding system is organized into multiple layers, each serving specific purposes:

1. **Core System Seeders** - Essential platform functionality (RBAC, permissions, users)
2. **Creative Industry Seeders** - Comprehensive marketplace data (option sets, model schemas)
3. **Specialized Seeders** - Additional modules (upload settings, translations, categories)

## 🚀 Quick Start

### Complete Platform Setup
```bash
# 1. Run core system setup (RBAC, permissions, test users)
npm run seed:comprehensive

# 2. Run creative industry marketplace setup (option sets, model schemas)
npx tsx scripts/seed/master-creative-industry-seeder.ts

# 3. Optional: Additional specialized seeders
npm run seed:categories-tags
npm run seed:translations
```

### Test Users Created
After running the comprehensive seeder, you can login with:
- **Super Admin**: `1@1.com` / `123`
- **Content Moderator**: `2@2.com` / `123`
- **Tenant Admin**: `3@3.com` / `123`

## 📊 Core System Seeders

### 1. Comprehensive Seeder
**File**: `scripts/comprehensive-seeder.ts`
**Command**: `npm run seed:comprehensive`

Creates the foundational RBAC system and test data:

#### **Permissions Created (143 total)**
```typescript
// Core admin permissions
admin.full_access, admin.manage, tenant.manage, users.manage, users.impersonate

// Content management
content.manage, models.approve, pictures.review

// CRUD permissions for core entities
tenants.{create,read,update,delete,manage}
users.{create,read,update,delete}
profiles.{create,read,update,delete}
saved_searches.{create,read,update,delete}.{own,global}

// System and media
media.{upload,manage}
system.{configure,monitor}
analytics.access
```

#### **Roles Created (6 total)**
- **super_admin** - Full platform access (all permissions)
- **tenant_admin** - Tenant-specific admin access (25 permissions)
- **content_moderator** - Content review and moderation (11 permissions)
- **approver** - Model and application approval (5 permissions)
- **support_agent** - Customer support access (6 permissions)
- **analytics_viewer** - Read-only analytics access (5 permissions)

#### **Test Data Created**
- 2 test tenants (including default test tenant)
- 3 test users with different role assignments
- Complete RBAC hierarchy with role-permission mappings

### 2. Auth-Specific Seeder
**File**: `scripts/seed/core/seed-auth.ts`
**Command**: `npm run seed:auth`

Focuses specifically on authentication and authorization setup.

### 3. Tenant Seeder
**File**: `scripts/seed-tenant.ts`
**Command**: `npm run seed:tenant`

Creates tenant-specific data and configurations.

## 🎨 Creative Industry Seeders

### Master Creative Industry Seeder
**File**: `scripts/seed/master-creative-industry-seeder.ts`
**Command**: `npx tsx scripts/seed/master-creative-industry-seeder.ts`

**The most comprehensive seeder** - Creates a complete creative industry marketplace infrastructure.

#### **Phase 1: Comprehensive Creative Industry Option Sets**
Creates **34 option sets** with **793 values** including:

**Physical Measurements**:
- Height ranges by age group (baby: 30-95cm, child: 60-160cm, teen: 130-200cm, adult: 140-220cm)
- Weight ranges with automatic regional conversions (kg ↔ lbs)
- Body measurements (chest/bust, waist, hips) with inch conversions

**Clothing & Sizing**:
- Women's clothing (XS-4XL) with comprehensive regional mappings
- Men's clothing (XS-4XL) with regional mappings
- Regional size conversions (US ↔ UK ↔ EU ↔ Asia)

**Physical Attributes**:
- Eye colors (8 options) with EU translations
- Hair colors (15 options), types (10 options), lengths (8 options)
- Skin tones (9-level inclusive spectrum)

**Creative Specializations**:
- Modeling categories (12 types: Fashion, Commercial, Fitness, etc.)
- Fitness specialties (15 types: Bodybuilding, CrossFit, Yoga, etc.)
- Voice types and styles (24 total options)
- Photography styles (12 specializations)
- Makeup specialties (12 areas of expertise)

#### **Phase 2: Supplementary Option Sets**
Creates **30 option sets** with **256 values** including:

**Demographics & Legal**:
- Gender options (4, including non-binary)
- Nationalities (15 major countries)
- Work authorization status (7 categories)

**Child & Guardian Specific**:
- Guardian relationships (10 types)
- Grade levels (16 options from pre-K to graduated)
- School schedules (7 types)
- Content restrictions (10 safety categories)

**Technical & Professional**:
- Audio equipment (8 types)
- Software proficiency (8 options)
- Time zones (10 global zones)
- Experience levels (6 from beginner to master)

**Pet-Specific**:
- Pet breeds (25 across species)
- Coat colors and patterns (27 total options)
- Temperaments and energy levels (13 behavioral traits)

#### **Phase 3: Model Schemas**
Creates **dynamic profile templates** for different creative roles:

**Human Models**:
- **Baby Models (0-2 years)**: Guardian management, safety protocols, optimal shoot times
- **Child Models (3-12 years)**: Education coordination, skill tracking, compliance
- **Teen Models (13-17 years)**: Transitional independence, social media integration
- **Adult Fashion Models**: Professional measurements, portfolio management
- **Fitness Models**: Performance metrics, body composition, competition tracking

**Specialized Talent**:
- **Voice Talent**: Technical capabilities, accent specializations, home studio equipment
- **Pet Models**: Species-specific traits, training levels, health records

**Creative Professionals**:
- **Photographers**: Equipment tracking, style specializations, collaboration preferences
- **Makeup Artists**: Technique expertise, brand preferences, certification tracking

### Regional Conversion System

All measurement-based option sets include automatic regional conversions:

```typescript
// Height example
"170cm" → {
  GLOBAL: "170 cm",
  US: "5'7\"",
  UK: "5'7\"", 
  EU: "170 cm",
  Asia: "170 cm"
}

// Clothing size example
"M" → {
  US: "M (8-10)",
  UK: "UK 12-14",
  EU: "EU 40-42", 
  Asia: "L"
}
```

## 🎛️ Specialized Seeders

### 1. Upload Settings Seeder
**File**: `prisma/seeds/upload-settings.ts`

Creates hierarchical media upload configurations:
- **Picture Settings**: 25MB limit, JPEG/PNG/WebP support, auto-optimization
- **Video Settings**: 500MB limit, MP4/QuickTime/WebM support, transcoding
- **Audio Settings**: 50MB limit, MP3/WAV/M4A support
- **Document Settings**: 25MB limit, PDF primary support

### 2. Categories & Tags Seeder
**Command**: `npm run seed:categories-tags`

Creates platform categorization system:
- Technology, Business, Education categories
- Industry-specific tags and hierarchical organization

### 3. Translation Seeder
**Command**: `npm run seed:translations`

Seeds the translation system with:
- Base language keys (en-US)
- Multi-language support structure
- Translation management framework

## 📊 Performance Metrics

### Complete Platform Seeding Results
After running all seeders:

```
✨ Total Option Sets Created: 64+
📊 Total Option Values Created: 1,000+
🏗️ Total Model Schemas: 10+ (when fully implemented)
📋 Total Permissions: 143
👥 Total Roles: 6
👤 Total Test Users: 3
🏢 Total Tenants: 2
⏱️ Total Seeding Time: ~2-3 minutes
```

### Regional Coverage
- **Measurements**: US/UK/EU/Asia conversions for all physical attributes
- **Languages**: EN/ES/FR/DE/IT/PT primary support, extended Asian language support
- **Standards**: International modeling industry standards and terminology

## 🔧 Available Package.json Scripts

```json
{
  "scripts": {
    "seed:comprehensive": "npx tsx scripts/comprehensive-seeder.ts",
    "seed:creative-industry": "npx tsx scripts/seed/master-creative-industry-seeder.ts",
    "seed:auth": "npx tsx scripts/seed/core/seed-auth.ts",
    "seed:categories-tags": "npx tsx scripts/seed/categories-tags-seeder.ts",
    "seed:translations": "npx tsx scripts/seed/translation-seeder.ts",
    "seed:tenant": "node --loader ts-node/esm scripts/seed-tenant.ts"
  }
}
```

## 🏗️ Seeding Architecture

### Design Principles
1. **Idempotent**: Can be run multiple times safely - skips existing data
2. **Hierarchical**: Proper dependency order (permissions → roles → users)
3. **Multi-tenant**: Global data with tenant-specific customization capability
4. **Regional Aware**: Automatic conversions between measurement systems
5. **Error Resilient**: Continues processing even if individual items fail
6. **Performance Optimized**: Batch operations and intelligent delays

### Database Impact
- **Total Data**: ~15MB of structured seeding data
- **Memory Usage**: Peak ~150MB during complete seeding process
- **Dependencies**: Requires PostgreSQL with Prisma schema migrated

## 📁 Documentation Structure

### Core Documentation
- `docs/DATABASE_SEEDERS.md` - This overview document
- `docs/features/COMPREHENSIVE_CREATIVE_INDUSTRY_SEEDING.md` - Detailed creative industry seeding (700+ lines)
- `docs/features/OPTION_SETS_AND_MODEL_SCHEMAS.md` - Architecture deep-dive
- `docs/features/SUBSCRIPTION_SYSTEM_SEEDER.md` - Subscription-specific seeding

### Specialized Documentation
- `docs/features/AUDIT_SYSTEM_GUIDE.md` - Audit logging integration
- `docs/features/RBAC-IMPLEMENTATION-COMPLETE.md` - RBAC system details
- `docs/architecture/` - Platform architecture specifications
- `docs/reference/` - Technical reference materials

## ⚠️ Best Practices

### Before Running Seeders

1. **Database Backup**: Always backup production databases
2. **Migration Check**: Ensure all Prisma migrations are applied
3. **Environment Setup**: Verify DATABASE_URL and environment variables
4. **Test Locally**: Always test on development database first

### Running Order

1. **Core First**: Always run `seed:comprehensive` before other seeders
2. **Dependencies**: Ensure option sets exist before model schemas
3. **Verification**: Check logs for errors and warnings
4. **Data Integrity**: Query database after seeding to verify results

### Troubleshooting

#### Common Issues
```bash
# Missing code field error
Error: Argument `code` is missing
Solution: Role schema requires code field - seeder updated

# Option set not found
Warning: Option set not found: [name], skipping field
Solution: Normal - comprehensive option sets not yet complete

# Prisma connection issues
Error: Can't reach database server
Solution: Check DATABASE_URL and PostgreSQL connection
```

#### Debugging Commands
```bash
# Check seeded permissions
echo "SELECT COUNT(*) FROM permissions;" | psql $DATABASE_URL

# Check roles and assignments  
echo "SELECT r.name, COUNT(rp.permission_id) as permission_count FROM roles r LEFT JOIN role_permissions rp ON r.id = rp.role_id GROUP BY r.name;" | psql $DATABASE_URL

# Check option sets
echo "SELECT slug, COUNT(option_values.id) as value_count FROM option_sets LEFT JOIN option_values ON option_sets.id = option_values.option_set_id GROUP BY slug ORDER BY slug;" | psql $DATABASE_URL

# Check test users
echo "SELECT u.first_name, u.last_name, a.email, r.name as role FROM users u JOIN accounts a ON u.account_id = a.id JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id;" | psql $DATABASE_URL
```

## 🚀 Production Deployment

### Staging Environment
```bash
# Run on staging first
ENVIRONMENT=staging npm run seed:comprehensive
ENVIRONMENT=staging npm run seed:creative-industry
```

### Production Environment
```bash
# Create backup
pg_dump $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run seeders (if needed)
NODE_ENV=production npm run seed:comprehensive

# Verify results
NODE_ENV=production npx tsx scripts/verify-seeding.ts
```

## 🎯 Future Enhancements

### Planned Additions
1. **Complete Model Schemas**: Fill in missing option sets for full schema creation
2. **Industry Templates**: Pre-configured tenant templates for specific industries  
3. **Advanced Localization**: Extended language and regional support
4. **Performance Optimization**: Parallel processing and batch optimization
5. **Validation Enhancement**: Schema validation and data integrity checks

### Extensibility
The seeding system is designed for easy extension:
- Add new option sets by following existing patterns
- Create industry-specific model schemas
- Extend regional conversion support
- Add new professional roles and specializations

---

## 📚 Additional Resources

- **Platform Specification**: `docs/architecture/MONO_PLATFORM_COMPLETE_SPECIFICATION.md`
- **RBAC Implementation**: `docs/features/RBAC-IMPLEMENTATION-COMPLETE.md`
- **Multi-tenant Architecture**: `docs/architecture/MULTI_TENANT_ARCHITECTURE_RECOMMENDATIONS.md`
- **Development Setup**: `docs/development/README.md`
- **API Documentation**: `docs/api/`

The itellico Mono seeding system provides a complete foundation for rapid deployment of sophisticated, multi-tenant creative industry marketplaces with global reach and professional-grade capabilities.