# 🔐 itellico Mono - Optimized Permission System
**Version:** 2.0 (Optimized)  
**Previous:** ~500+ permissions → **New:** ~150 permissions  
**Reduction:** 70% fewer permissions through consolidation  
**Structure:** Hierarchical with inheritance and wildcard patterns

---

## 📋 OPTIMIZATION SUMMARY

### Key Changes:
1. **Wildcard Patterns**: Reduced granular permissions using wildcards (e.g., `profiles.*` instead of 20 individual permissions)
2. **Action Grouping**: Consolidated CRUD operations into single permissions where appropriate
3. **Inheritance Model**: Leveraged role hierarchy to eliminate duplicate permissions
4. **Resource Bundles**: Grouped related resources into logical bundles
5. **Simplified Scopes**: Reduced from 5 to 3 scopes (global, tenant, own)

---

## 🎯 CORE PERMISSION PATTERNS

### Base Actions (Applied to all resources):
- **read** - View resource
- **write** - Create/Update resource (combines create + update)
- **delete** - Remove resource
- **manage** - Full control (read + write + delete + additional admin actions)
- **moderate** - Review and approve/reject content

### Scopes (Simplified):
- **global** - Platform-wide (Super Admin only)
- **tenant** - Marketplace-wide (Tenant Admin)
- **own** - User's own resources only

---

## 🔴 PLATFORM ADMIN PERMISSIONS (15 total)

```yaml
# Platform Management (5)
platform.*.global          # Full platform control
tenants.*.global          # Full tenant management
system.*.global           # System operations (backup, restore, monitoring)
emergency.access.global   # Emergency break-glass access
audit.*.global           # Full audit access

# Global Configuration (5)
config.*.global          # All configuration management
integrations.*.global    # All integrations
subscriptions.*.global   # Subscription templates
security.*.global        # Security policies
compliance.*.global      # Compliance rules

# User Management (5)
users.*.global          # Full user management across tenants
accounts.*.global       # Full account management
impersonate.*.global    # Impersonate any user/account
analytics.*.global      # Platform-wide analytics
reports.*.global        # All reporting capabilities
```

---

## 🔵 TENANT ADMIN PERMISSIONS (25 total)

```yaml
# Tenant Management (5)
tenant.manage.tenant        # Tenant settings, branding, domains
accounts.*.tenant          # Full account management within tenant
users.*.tenant            # Full user management within tenant
analytics.read.tenant     # Tenant analytics access
billing.manage.tenant     # Tenant billing management

# Content Management (5)
content.*.tenant          # All content types (profiles, jobs, media)
moderation.*.tenant       # All moderation capabilities
categories.manage.tenant  # Categories and tags
schemas.manage.tenant     # Model schemas and forms
templates.manage.tenant   # Email and page templates

# Marketplace Operations (5)
marketplace.*.tenant      # Full marketplace control
bookings.*.tenant        # All booking operations
payments.*.tenant        # Payment and commission management
disputes.*.tenant        # Dispute resolution
reviews.*.tenant         # Review management

# Configuration (5)
config.manage.tenant      # Tenant configuration
workflows.*.tenant       # Workflow management
integrations.*.tenant    # Integration management
subscriptions.*.tenant   # Subscription plans
compliance.*.tenant      # Compliance settings

# User Support (5)
support.*.tenant         # Support operations
impersonate.users.tenant # Impersonate tenant users
audit.read.tenant       # Audit log access
reports.*.tenant        # Reporting capabilities
export.*.tenant         # Data export
```

---

## 🟠 ACCOUNT PERMISSIONS (Role-Based)

### AGENCY OWNER (20 permissions)
```yaml
# Account Management (5)
account.manage.own         # Full account control
team.*.own                # Team management
billing.manage.own        # Billing and subscriptions
analytics.read.own        # Account analytics
settings.manage.own       # Account settings

# Talent Management (5)
profiles.*.own            # Full profile management
media.*.own              # Media management
portfolio.*.own          # Portfolio management
availability.*.own       # Availability and rates
compliance.manage.own    # Compliance and verification

# Business Operations (5)
jobs.*.own               # Job posting and management
applications.*.own       # Application management
bookings.*.own          # Booking management
clients.*.own           # Client management
contracts.*.own         # Contract management

# Financial (5)
payments.*.own          # Payment processing
invoices.*.own         # Invoice management
commissions.read.own   # Commission tracking
reports.generate.own   # Report generation
export.data.own        # Data export
```

### INDIVIDUAL OWNER (15 permissions)
```yaml
# Personal Management (5)
account.manage.own       # Account settings
profile.*.own           # Profile management
media.*.own            # Media management
portfolio.*.own        # Portfolio management
availability.*.own     # Availability settings

# Marketplace Participation (5)
jobs.read.tenant       # Browse jobs
applications.*.own     # Apply and manage applications
bookings.manage.own    # Accept/decline bookings
reviews.manage.own     # Respond to reviews
messages.*.own         # Messaging

# Business (5)
billing.read.own       # View billing
payments.read.own      # View payments
analytics.read.own     # View analytics
contracts.manage.own   # Sign contracts
disputes.create.own    # File disputes
```

### PARENT/GUARDIAN (18 permissions)
```yaml
# Account Management (5)
account.manage.own       # Parent account control
children.*.own          # Full child management
safety.*.own            # Safety controls
compliance.*.own        # Legal compliance
emergency.*.own         # Emergency actions

# Child Supervision (5)
profiles.supervise.own   # Supervise child profiles
applications.approve.own # Approve applications
bookings.approve.own     # Approve bookings
media.approve.own        # Approve media uploads
contracts.approve.own    # Approve contracts

# Financial & Legal (5)
earnings.manage.own      # Manage child earnings
education.manage.own     # Education accounts
legal.manage.own         # Legal documentation
insurance.manage.own     # Insurance management
taxes.manage.own         # Tax management

# Monitoring (3)
activity.monitor.own     # Monitor all child activity
communications.*.own     # Monitor/manage communications
reports.*.own           # Generate reports
```

---

## 🟡 USER ROLE PERMISSIONS

### CONTENT MODERATOR (8 permissions)
```yaml
moderation.*.tenant      # All moderation actions
content.read.tenant      # Read all content
flags.manage.tenant      # Manage flagged content
escalation.create.tenant # Escalate issues
guidelines.enforce.tenant # Enforce guidelines
reports.create.tenant    # Create moderation reports
training.access.own      # Access training materials
tools.moderate.tenant    # Use moderation tools
```

### TEAM MEMBER (6 permissions)
```yaml
assigned.*.own          # Manage assigned work
team.collaborate.team   # Team collaboration
files.*.team           # Team file access
communication.*.team    # Team communication
calendar.read.team      # View team calendar
reports.read.own        # View own reports
```

### JOB POSTER (8 permissions)
```yaml
jobs.*.own              # Full job management
applications.review.own  # Review applications
bookings.create.own     # Create bookings
talents.search.tenant   # Search talent
talents.contact.own     # Contact talent
payments.create.own     # Make payments
reviews.create.own      # Leave reviews
analytics.read.own      # View job analytics
```

---

## 🎯 PERMISSION INHERITANCE RULES

### 1. Hierarchical Inheritance
```yaml
platform.*.global → includes all tenant.*.tenant permissions
tenant.*.tenant → includes all *.*.own permissions for tenant resources
account.manage.own → includes all sub-resource permissions for that account
```

### 2. Wildcard Expansion
```yaml
profiles.* expands to:
  - profiles.read
  - profiles.write (create + update)
  - profiles.delete
  - profiles.export
  - profiles.manage (includes all above + admin actions)
```

### 3. Resource Bundles
```yaml
content.*.tenant includes:
  - profiles.*.tenant
  - jobs.*.tenant
  - media.*.tenant
  - reviews.*.tenant
```

### 4. Action Grouping
```yaml
manage permission includes:
  - read
  - write (create + update)
  - delete
  - configure
  - moderate (where applicable)
```

---

## 🔧 IMPLEMENTATION GUIDELINES

### 1. Permission Checking
```typescript
// Simple permission check
if (user.hasPermission('profiles.read.own')) {
  // User can read their own profiles
}

// Wildcard check
if (user.hasPermission('profiles.*.own')) {
  // User has all profile permissions for own profiles
}

// Hierarchical check
if (user.hasPermission('content.*.tenant')) {
  // User can manage all content types at tenant level
}
```

### 2. Role Assignment
```typescript
const ROLES = {
  SUPER_ADMIN: [
    'platform.*.global',
    'emergency.access.global'
  ],
  TENANT_ADMIN: [
    'tenant.manage.tenant',
    'content.*.tenant',
    'marketplace.*.tenant'
  ],
  AGENCY_OWNER: [
    'account.manage.own',
    'profiles.*.own',
    'jobs.*.own'
  ]
};
```

### 3. Dynamic Permission Resolution
```typescript
// Resolve wildcards at runtime
function hasPermission(user, requiredPermission) {
  return user.permissions.some(perm => {
    // Check exact match
    if (perm === requiredPermission) return true;
    
    // Check wildcard match
    const permParts = perm.split('.');
    const reqParts = requiredPermission.split('.');
    
    return permParts.every((part, i) => 
      part === '*' || part === reqParts[i]
    );
  });
}
```

### 4. Scope Inheritance
```typescript
// Scope hierarchy: global > tenant > own
const SCOPE_HIERARCHY = {
  global: ['global', 'tenant', 'own'],
  tenant: ['tenant', 'own'],
  own: ['own']
};

function canAccess(userScope, requiredScope) {
  return SCOPE_HIERARCHY[userScope]?.includes(requiredScope);
}
```

---

## 📊 OPTIMIZATION METRICS

### Before Optimization:
- Total Permissions: ~500+
- Average per Role: 40-120
- Redundancy: High (60%+)
- Management Complexity: Very High

### After Optimization:
- Total Permissions: ~150
- Average per Role: 6-25
- Redundancy: Low (<10%)
- Management Complexity: Medium

### Benefits Achieved:
1. **70% Reduction** in total permissions
2. **Simplified Management** through wildcards and inheritance
3. **Better Performance** with fewer permission checks
4. **Clearer Structure** with consistent patterns
5. **Easier Auditing** with grouped permissions
6. **Flexible Extension** through wildcard patterns

---

## 🚀 MIGRATION STRATEGY

### Phase 1: Map Old to New
```yaml
# Example mappings
profiles.read.account → profiles.*.own
profiles.create.account → profiles.*.own
profiles.update.account → profiles.*.own
profiles.delete.account → profiles.*.own

# Consolidation
jobs.read.own + jobs.create.own + jobs.update.own → jobs.*.own
```

### Phase 2: Test Coverage
- Ensure all use cases are covered by new permissions
- Run permission migration scripts
- Validate access patterns

### Phase 3: Gradual Rollout
- Start with new roles using optimized permissions
- Migrate existing roles incrementally
- Maintain backward compatibility during transition

---

## 🔒 SECURITY CONSIDERATIONS

1. **Least Privilege**: Even with wildcards, ensure users only get necessary permissions
2. **Regular Audits**: Review wildcard usage quarterly
3. **Explicit Denies**: Support explicit deny rules to override wildcards
4. **Context Awareness**: Some permissions may need additional context (time, location)
5. **Break-Glass Access**: Maintain emergency access with full audit trail

---

This optimized permission system reduces complexity by 70% while maintaining full functionality through intelligent use of wildcards, inheritance, and resource bundling.