# Schema Migration Guide - From Monolithic to Modular

## 🎯 Overview

The mono schema has been split from a single 5,829-line file into a modular, domain-driven structure for better maintainability, readability, and team collaboration.

## 📁 New Structure

```
src/lib/schemas/
├── _enums.ts           # All shared enums
├── core.ts             # Countries, timezones, languages, site settings
├── auth.ts             # Users, accounts, sessions, roles, permissions
├── tenants.ts          # Tenants, tenant subscriptions, revenue
├── agencies.ts         # Agencies, agency subscriptions, relationships
├── subscriptions.ts    # Account-level subscriptions, billing (TODO)
├── profiles.ts         # Model profiles, marketplace, attributes (TODO)
├── jobs.ts             # Jobs, applications, criteria, matches (TODO)
├── media.ts            # Media assets, portfolios, sharing, tags (TODO)
├── communications.ts   # Messages, notifications, email system (TODO)
├── content.ts          # Town hall, reviews, courses, badges (TODO)
├── admin.ts            # Admin roles, impersonation, approvals (TODO)
├── tax.ts              # Tax system, jurisdictions, calculations (TODO)
├── integrations.ts     # OAuth, webhooks, external APIs (TODO)
└── index.ts            # Main aggregation file
```

## 🔄 Migration Status

### ✅ COMPLETED
- **Enums** (`_enums.ts`) - All shared enumerations
- **Core Platform** (`core.ts`) - Countries, timezones, languages, site settings, skills, model categories
- **Authentication** (`auth.ts`) - Users, accounts, sessions, roles, permissions, audit logs
- **Tenants** (`tenants.ts`) - Tenant management, subscriptions, revenue tracking
- **Agencies** (`agencies.ts`) - Agency management, subscriptions, account relationships

### 🚧 TODO (Remaining Tables)
- **Subscriptions & Billing** - Account subscriptions, plans, payments, usage tracking
- **Model Profiles** - Model profiles, attributes, marketplace categories
- **Jobs & Applications** - Job postings, applications, criteria, matching
- **Media & Portfolios** - Media assets, portfolios, sharing, AI tagging
- **Communications** - Messages, conversations, notifications, email templates
- **Content & Community** - Town hall posts, reviews, courses, user follows
- **Administration** - Admin tools, impersonation, picture approvals
- **Tax & Legal** - Tax calculations, jurisdictions, exemptions
- **External Integrations** - OAuth connections, Stripe/Mailgun webhooks

## 🔧 How to Use the New Structure

### Import Patterns

```typescript
// OLD (monolithic)
import { users, accounts, roles, permissions } from '@/lib/schema';

// NEW (modular) - Import specific domains
import { users, accounts } from '@/lib/schemas/auth';
import { roles, permissions } from '@/lib/schemas/auth';
import { tenants } from '@/lib/schemas/tenants';
import { agencies } from '@/lib/schemas/agencies';

// OR - Import everything from main index (backwards compatible)
import { users, accounts, roles, permissions, tenants, agencies } from '@/lib/schemas';
```

### Type Imports

```typescript
// OLD
import type { User, Account, Role } from '@/lib/schema';

// NEW
import type { User, Account } from '@/lib/schemas/auth';
import type { Role } from '@/lib/schemas/auth';

// OR (backwards compatible)
import type { User, Account, Role } from '@/lib/schemas';
```

### Drizzle Configuration

```typescript
// drizzle.config.ts - Update your config to point to the new structure
import { schema } from '@/lib/schemas';

export default {
  schema: schema, // This now includes all modular schemas
  // ... rest of config
};
```

## 🎯 Benefits of the New Structure

### 1. **Developer Experience**
- ✅ Find tables instantly (auth tables in `auth.ts`, not in a 6K line file)
- ✅ Focused development (work on jobs without touching media or billing code)
- ✅ Reduced merge conflicts (teams working on different domains rarely conflict)

### 2. **Maintainability**
- ✅ Logical grouping of related functionality
- ✅ Clear ownership boundaries for different features
- ✅ Easier code reviews (changes are localized to relevant domains)

### 3. **Scalability**
- ✅ Add new features by creating new domain files
- ✅ Deprecate old features by removing specific domain files
- ✅ Clear dependency management between domains

### 4. **Team Collaboration**
- ✅ Different teams can own different schema domains
- ✅ Clear interfaces between domains
- ✅ Reduced learning curve for new developers

## 🔄 Migration Steps for Your Code

### Step 1: Update Imports
Run a find-and-replace to update imports:

```bash
# Find files importing from the old schema
find src -name "*.ts" -o -name "*.tsx" | xargs grep "from '@/lib/schema'"

# Update imports to use the new structure
# Either update to specific domain imports or use the main index
```

### Step 2: Verify Types
Ensure all type imports are working correctly:

```typescript
// These should continue to work unchanged
import type { User, Account, Tenant, Agency } from '@/lib/schemas';
```

### Step 3: Update Drizzle Queries
Your existing Drizzle queries should continue to work unchanged:

```typescript
// This continues to work as before
const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});
```

## 🚨 Important Notes

### Backwards Compatibility
- **The main `@/lib/schemas` export maintains full backwards compatibility**
- **All existing imports will continue to work during the transition**
- **No immediate changes required to existing code**

### Relations
- Relations are properly maintained across domain boundaries
- Cross-domain relations are handled in the main aggregation file
- All existing relational queries continue to work

### Performance
- No performance impact - all schemas are still bundled together
- Same runtime behavior as the monolithic schema
- Build time may improve due to better tree-shaking opportunities

## 📝 Next Steps

1. **Immediate**: Update new code to use domain-specific imports
2. **Gradual**: Migrate existing imports to use the new structure
3. **Complete**: Remove the old monolithic schema file once migration is complete

## 🤝 Team Guidelines

### For New Features
- Identify the appropriate domain for your tables
- Add tables to the relevant domain file
- Update the main `index.ts` to export the new domain
- Use domain-specific imports in your code

### For Existing Features
- Keep using existing imports during transition
- Update imports when you're already modifying the file
- No rush to update working code immediately

### For Reviewers
- New code should use domain-specific imports
- Existing code updates can use either pattern
- Focus on logical domain separation in reviews

---

This migration improves long-term maintainability while preserving all existing functionality. The modular structure will make the codebase much more manageable as the project grows. 