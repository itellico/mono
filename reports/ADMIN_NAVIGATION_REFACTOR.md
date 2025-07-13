# Admin Navigation Refactor

## Problem Statement

The current admin navigation has several inconsistencies:
- Mixed "admin" prefixes (some have it, others don't)
- Categories shown when not necessary for all users
- Empty sections (permissions, translations)
- Confusing integration structure (both "integrations" and "admin integrations")
- Subscriptions should be tenant-manageable, not just admin-only
- Unclear scope for various features (platform vs tenant level)
- No contextual navigation based on user role

## New Structure

### 🏛️ Platform Management (Super Admin Only)
These features manage the entire platform across all tenants:

- **Tenant Management** - CRUD operations on all tenants
- **Platform Users** - Cross-tenant user management
- **Platform Settings** - Global platform configuration
- **Platform Integrations** - Platform-wide integrations (not tenant-specific)
- **Permissions** - Platform-wide permission management
- **Monitoring** - Platform health, metrics, performance
- **Audit** - Platform-wide audit logs

### 🏢 Tenant Management (Tenant Admin + Super Admin)
These features are scoped to a specific tenant:

- **Users** - Manage users within the tenant
- **Subscriptions** - Tenant's subscription plans and billing
- **Integrations** - Tenant-specific integrations (API keys, webhooks)
- **Settings** - Tenant-specific settings and configuration
- **Translations** - Tenant's language translations

### 📝 Content Management (Role-based Access)
These features manage content and are available based on permissions:

- **Categories** - Content categorization (only if user has permission)
- **Tags** - Content tagging (only if user has permission)
- **Option Sets** - Dropdown/select options
- **Model Schemas** - Data structure definitions

### 🛠️ Development Tools (Developers + Super Admin)
Advanced tools for building and customization:

- **Form Builder** - Custom form creation
- **Workflows** - Automation and business logic
- **Email System** - Email templates and campaigns
- **Import/Export** - Data migration tools

### 👤 Personal & Help (All Admin Users)
Universal features available to all admin users:

- **Documentation** - Platform documentation
- **Personal Preferences** - User's account settings

## Role-Based Visibility

### Super Admin
- ✅ Platform Management (full access)
- ✅ Tenant Management (all tenants)
- ✅ Content Management (all tenants)
- ✅ Development Tools (full access)
- ✅ Personal & Help

### Tenant Admin
- ❌ Platform Management (no access)
- ✅ Tenant Management (their tenant only)
- ✅ Content Management (their tenant only)
- ✅ Development Tools (their tenant only)
- ✅ Personal & Help

### Content Moderator
- ❌ Platform Management (no access)
- ❌ Tenant Management (no access)
- ✅ Content Management (based on permissions)
- ❌ Development Tools (no access)
- ✅ Personal & Help

### Support Agent
- ❌ Platform Management (no access)
- ✅ Tenant Management (read-only access)
- ❌ Content Management (no access)
- ❌ Development Tools (no access)
- ✅ Personal & Help

## Key Improvements

1. **Contextual Navigation**: What you see depends on your role
2. **Clear Scoping**: Platform vs Tenant vs Personal features are clearly separated
3. **Consistent Naming**: No more mixed "admin" prefixes
4. **Permission-Based**: Items only show if you have the required permissions
5. **Logical Grouping**: Related features are grouped together
6. **Descriptive**: Each item has a description explaining its purpose
7. **Tenant Perspective**: Tenant admins see their own data scope, not platform-wide operations

## Migration Notes

### Removed Inconsistencies
- Eliminated duplicate "categories" entries
- Removed empty "permissions" and "translations" sections for users without access
- Clarified "integrations" vs "platform integrations"
- Made "subscriptions" tenant-scoped instead of platform-only

### Scope Changes
- **Subscriptions**: Now tenant-manageable (users can manage their own tenant's subscriptions)
- **Users**: Split into "Platform Users" (cross-tenant) and "Users" (tenant-scoped)
- **Settings**: Split into "Platform Settings" and "Settings" (tenant-scoped)
- **Integrations**: Split into "Platform Integrations" and "Integrations" (tenant-scoped)

### User Experience
- **Super Admin**: Sees everything organized by scope
- **Tenant Admin**: Sees only tenant-scoped features (no confusion about platform operations)
- **Content Moderator**: Sees only content management tools
- **Regular Users**: Clean, minimal interface focused on their tasks

This structure properly reflects the multi-tenant nature of the platform and eliminates the confusion about what operations are available at what scope.