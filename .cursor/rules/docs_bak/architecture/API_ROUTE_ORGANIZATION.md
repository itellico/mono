# API Route Organization Specification

## Overview

This document defines the standardized approach for organizing API routes in the itellico Mono, following industry best practices for multi-tenant SaaS applications.

## Core Principles

### 1. Permission-Based Single Endpoints (Primary Pattern)
- Use unified endpoints with permission-based behavior
- Admin users see additional data and capabilities
- Regular users see tenant-scoped data only
- Simpler frontend integration and consistent URLs

### 2. Separate Admin Routes (Exception Pattern)
- Only for operations fundamentally different between admin and regular users
- Security-sensitive operations requiring isolation
- Heavy administrative operations (migrations, system management)
- Tenant management and system configuration

### 3. Code Organization
- Shared business logic in service layers
- Thin route handlers
- Common utilities for permission checking and data scoping
- Minimal code duplication through helper functions

## Route Categories

### A. Unified Permission-Based Endpoints

These routes serve both regular users and admins with different capabilities:

#### **Resource Management**
```
GET    /api/v1/users           # List users (tenant-scoped for users, global for admins)
POST   /api/v1/users           # Create user (in tenant for users, any tenant for admins)
GET    /api/v1/users/{id}      # Get user (own data for users, any user for admins)
PUT    /api/v1/users/{id}      # Update user (own data for users, any user for admins)
DELETE /api/v1/users/{id}      # Delete user (own data for users, any user for admins)

GET    /api/v1/categories      # List categories (tenant-scoped vs global)
POST   /api/v1/categories      # Create category
GET    /api/v1/categories/{id} # Get category
PUT    /api/v1/categories/{id} # Update category
DELETE /api/v1/categories/{id} # Delete category
GET    /api/v1/categories/stats # Statistics (tenant vs global)

GET    /api/v1/tags            # List tags (tenant-scoped vs global)
POST   /api/v1/tags            # Create tag
GET    /api/v1/tags/{id}       # Get tag
PUT    /api/v1/tags/{id}       # Update tag
DELETE /api/v1/tags/{id}       # Delete tag
GET    /api/v1/tags/stats      # Statistics (tenant vs global)

GET    /api/v1/subscriptions   # List subscriptions (own vs all)
POST   /api/v1/subscriptions   # Create subscription
GET    /api/v1/subscriptions/{id} # Get subscription
PUT    /api/v1/subscriptions/{id} # Update subscription
DELETE /api/v1/subscriptions/{id} # Cancel subscription

GET    /api/v1/forms           # List forms (tenant-scoped vs global)
POST   /api/v1/forms           # Create form
GET    /api/v1/forms/{id}      # Get form
PUT    /api/v1/forms/{id}      # Update form
DELETE /api/v1/forms/{id}      # Delete form

GET    /api/v1/workflows       # List workflows (tenant-scoped vs global)
POST   /api/v1/workflows       # Create workflow
GET    /api/v1/workflows/{id}  # Get workflow
PUT    /api/v1/workflows/{id}  # Update workflow
DELETE /api/v1/workflows/{id}  # Delete workflow

GET    /api/v1/model-schemas   # List schemas (tenant-scoped vs global)
POST   /api/v1/model-schemas   # Create schema
GET    /api/v1/model-schemas/{id} # Get schema
PUT    /api/v1/model-schemas/{id} # Update schema
DELETE /api/v1/model-schemas/{id} # Delete schema

GET    /api/v1/option-sets     # List option sets (tenant-scoped vs global)
POST   /api/v1/option-sets     # Create option set
GET    /api/v1/option-sets/{id} # Get option set
PUT    /api/v1/option-sets/{id} # Update option set
DELETE /api/v1/option-sets/{id} # Delete option set

GET    /api/v1/notifications   # List notifications (own vs all)
POST   /api/v1/notifications   # Create notification
GET    /api/v1/notifications/{id} # Get notification
PUT    /api/v1/notifications/{id} # Update notification
DELETE /api/v1/notifications/{id} # Delete notification

GET    /api/v1/templates       # List templates (tenant-scoped vs global)
POST   /api/v1/templates       # Create template
GET    /api/v1/templates/{id}  # Get template
PUT    /api/v1/templates/{id}  # Update template
DELETE /api/v1/templates/{id}  # Delete template

GET    /api/v1/webhooks        # List webhooks (tenant-scoped vs global)
POST   /api/v1/webhooks        # Create webhook
GET    /api/v1/webhooks/{id}   # Get webhook
PUT    /api/v1/webhooks/{id}   # Update webhook
DELETE /api/v1/webhooks/{id}   # Delete webhook

GET    /api/v1/integrations    # List integrations (tenant-scoped vs global)
POST   /api/v1/integrations    # Create integration
GET    /api/v1/integrations/{id} # Get integration
PUT    /api/v1/integrations/{id} # Update integration
DELETE /api/v1/integrations/{id} # Delete integration
```

#### **User Profile & Account Management**
```
GET    /api/v1/user/profile    # Get own profile
PUT    /api/v1/user/profile    # Update own profile
GET    /api/v1/user/profiles   # List profiles (admins can see all tenant profiles)
```

#### **Media & Assets**
```
GET    /api/v1/media           # List media (tenant-scoped vs global)
POST   /api/v1/media           # Upload media
GET    /api/v1/media/{id}      # Get media
DELETE /api/v1/media/{id}      # Delete media
```

### B. Admin-Only Routes

These routes are exclusively for system administrators:

#### **System Management**
```
GET    /api/admin/tenants      # List all tenants
POST   /api/admin/tenants      # Create tenant
GET    /api/admin/tenants/{id} # Get tenant details
PUT    /api/admin/tenants/{id} # Update tenant
DELETE /api/admin/tenants/{id} # Delete tenant
POST   /api/admin/tenants/{id}/suspend # Suspend tenant
POST   /api/admin/tenants/{id}/activate # Activate tenant

GET    /api/admin/settings     # Get system settings
PUT    /api/admin/settings     # Update system settings

GET    /api/admin/queue        # Queue monitoring
GET    /api/admin/queue/jobs   # List jobs
POST   /api/admin/queue/jobs/{id}/retry # Retry job
DELETE /api/admin/queue/jobs/{id} # Cancel job

GET    /api/admin/integrations # System integrations (OAuth providers, etc.)
POST   /api/admin/integrations # Add system integration
PUT    /api/admin/integrations/{id} # Update system integration
DELETE /api/admin/integrations/{id} # Remove system integration
```

#### **System Operations**
```
GET    /api/admin/stats        # System-wide statistics
GET    /api/admin/health       # System health
POST   /api/admin/migrations   # Run migrations
POST   /api/admin/backup       # Create system backup
POST   /api/admin/maintenance  # Toggle maintenance mode
```

### C. Public & Authentication Routes

```
POST   /api/v1/auth/login      # User login
POST   /api/v1/auth/logout     # User logout
POST   /api/v1/auth/register   # User registration
POST   /api/v1/auth/refresh    # Refresh token
POST   /api/v1/auth/forgot-password # Password reset request
POST   /api/v1/auth/reset-password  # Password reset

GET    /health                 # Health check (public)
GET    /metrics                # Prometheus metrics (internal)
```

### D. Monitoring & Audit

```
GET    /api/v1/monitoring      # Monitoring data (tenant-scoped vs global)
GET    /api/v1/audit           # Audit logs (tenant-scoped vs global)
GET    /api/v1/changes         # Change tracking (tenant-scoped vs global)
```

## Permission-Based Implementation Pattern

### Standard Permission Checking
```typescript
// Every unified endpoint should follow this pattern
const isAdmin = await fastify.hasPermission(request.user!, 'resource:admin');

// Data scoping
const where: any = {};
if (!isAdmin) {
  where.account = { tenantId: request.user!.tenantId };
} else {
  // Admin can filter by tenant
  if (tenantId) where.account = { tenantId };
}

// Response filtering
const result = {
  ...baseData,
  ...(isAdmin && { adminOnlyFields })
};
```

### Standard Permissions
```
resource:create   # Create resource in own tenant
resource:read     # Read own tenant resources
resource:update   # Update own tenant resources
resource:delete   # Delete own tenant resources
resource:admin    # Full admin access across all tenants
```

## Migration Strategy

### Phase 1: Core Resources (Completed)
- ✅ Categories: `/admin/categories` → `/categories`
- ✅ Tags: `/admin/tags` → `/tags`

### Phase 2: User Management
- `/admin/users` → `/users`
- Update permission checking
- Frontend route updates

### Phase 3: Business Resources
- `/admin/subscriptions` → `/subscriptions`
- `/admin/forms` → `/forms`
- `/admin/workflows` → `/workflows`

### Phase 4: System Resources
- Keep admin-only routes as-is
- Clean up empty/unused routes
- Optimize route registration

## File Organization

```
/routes/
  /v1/
    /auth/           # Authentication
    /users/          # User management (unified)
    /categories/     # Category management (unified)
    /tags/           # Tag management (unified)
    /subscriptions/  # Subscription management (unified)
    /forms/          # Form management (unified)
    /workflows/      # Workflow management (unified)
    /model-schemas/  # Schema management (unified)
    /option-sets/    # Option set management (unified)
    /notifications/  # Notification management (unified)
    /templates/      # Template management (unified)
    /webhooks/       # Webhook management (unified)
    /integrations/   # Integration management (unified)
    /media/          # Media management (unified)
    /user/           # User profile routes
    /monitoring/     # Monitoring (unified)
    /audit/          # Audit logs (unified)
    /changes/        # Change tracking (unified)
  /admin/
    /tenants/        # Tenant management (admin-only)
    /settings/       # System settings (admin-only)
    /queue/          # Queue management (admin-only)
    /integrations/   # System integrations (admin-only)
  /health/           # Health checks
```

## Benefits

1. **Simplified Frontend Development**
   - Consistent API endpoints regardless of user role
   - No need to switch between admin and regular endpoints

2. **Better User Experience**
   - Seamless permission escalation
   - Consistent URLs and patterns

3. **Maintainable Codebase**
   - Single source of truth for business logic
   - Reduced code duplication
   - Clear separation of concerns

4. **Security**
   - Permission-based access control
   - Admin operations isolated when necessary
   - Consistent authorization patterns

5. **Scalability**
   - Easy to add new permission levels
   - Flexible tenant isolation
   - Performance optimizations possible at service layer