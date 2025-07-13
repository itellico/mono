# Platform Configuration Guide

Detailed guide for configuring platform-level settings during installation.

## Configuration Files

### platform-config.json

Core platform settings that apply system-wide.

```json
{
  "platform": {
    "name": "itellico Mono",
    "version": "1.0.0",
    "url": "https://platform.itellico.ai",
    "apiUrl": "https://api.itellico.ai",
    "description": "Multi-tenant SaaS marketplace platform",
    "defaultLocale": "en-US",
    "defaultTimezone": "Europe/Vienna",
    "supportedLocales": [
      "en-US", "de-DE", "fr-FR", "es-ES", "it-IT", 
      "pt-PT", "nl-NL", "pl-PL", "cs-CZ", "sk-SK",
      "hu-HU", "ro-RO", "bg-BG", "hr-HR"
    ],
    "features": [
      "multi-tenant",
      "rbac",
      "audit",
      "cache",
      "workflows",
      "subscriptions",
      "marketplace",
      "notifications",
      "search",
      "analytics"
    ],
    "settings": {
      "maintenanceMode": false,
      "registrationEnabled": true,
      "requireEmailVerification": true,
      "maxTenantsPerPlatform": 1000,
      "maxUsersPerTenant": 10000,
      "sessionTimeout": 86400,
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": true
      }
    }
  }
}
```

### default-tenant.json

Configuration for the default system tenant.

```json
{
  "tenant": {
    "name": "Main Platform",
    "slug": "main",
    "domain": "platform.itellico.ai",
    "description": "Default platform tenant for system administration",
    "is_active": true,
    "features": ["all"],
    "settings": {
      "maxUsers": 10,
      "maxStorage": "10GB",
      "customDomain": false,
      "apiAccess": true,
      "webhooks": true
    }
  }
}
```

### admin-user.json

Super admin user configuration.

```json
{
  "admin": {
    "email": "admin@itellico.ai",
    "username": "admin",
    "firstName": "System",
    "lastName": "Administrator",
    "password": "${ADMIN_PASSWORD:-Admin123!@#}",
    "roles": ["super_admin", "platform_admin"],
    "isActive": true,
    "emailVerified": true,
    "metadata": {
      "createdBy": "system",
      "purpose": "platform-administration"
    }
  }
}
```

## RBAC Configuration

### Role Hierarchy

```
super_admin
    ├── platform_admin
    │   └── tenant_admin
    │       └── account_admin
    │           └── account_manager
    │               └── user
    │                   └── public_user
    └── system (for internal processes)
```

### Permission Structure

Permissions follow the pattern: `{tier}.{resource}.{action}`

Examples:
- `platform.tenants.create`
- `tenant.settings.update`
- `account.users.manage`
- `user.profile.edit`

### Wildcard Permissions

Admin roles can use wildcards:
- `platform.*` - All platform permissions
- `tenant.users.*` - All user management in tenant
- `*.*.read` - Read access across all resources

## Categories & Tags

### Platform Categories

Define system-wide categories available to all tenants.

```json
{
  "categories": [
    {
      "name": "Services",
      "slug": "services",
      "description": "Service-based offerings",
      "subcategories": [
        {
          "name": "Consulting",
          "slug": "consulting"
        },
        {
          "name": "Development",
          "slug": "development"
        }
      ]
    }
  ]
}
```

### System Tags

Platform-level tags for classification.

```json
{
  "tags": [
    {
      "category": "Skills",
      "tags": [
        {
          "name": "JavaScript",
          "slug": "javascript",
          "description": "JavaScript programming"
        }
      ]
    }
  ]
}
```

## Option Sets

Global dropdown values used across the platform.

### Countries
```json
{
  "name": "Countries",
  "slug": "countries",
  "type": "system",
  "values": [
    { "code": "US", "name": "United States" },
    { "code": "DE", "name": "Germany" },
    { "code": "AT", "name": "Austria" }
  ]
}
```

### Currencies
```json
{
  "name": "Currencies",
  "slug": "currencies",
  "type": "system",
  "values": [
    { "code": "EUR", "symbol": "€", "name": "Euro" },
    { "code": "USD", "symbol": "$", "name": "US Dollar" }
  ]
}
```

### Languages
```json
{
  "name": "Languages",
  "slug": "languages",
  "type": "system",
  "values": [
    { "code": "en", "name": "English" },
    { "code": "de", "name": "German" }
  ]
}
```

## Features & Plans

### Feature Definitions

```json
{
  "features": [
    {
      "name": "User Management",
      "slug": "user-management",
      "description": "Manage users and permissions",
      "tier": "platform",
      "configurable": true,
      "limits": {
        "maxUsers": { "type": "number", "default": 100 }
      }
    }
  ]
}
```

### Subscription Plans

```json
{
  "plans": [
    {
      "name": "Starter",
      "slug": "starter",
      "price": 0,
      "currency": "EUR",
      "interval": "month",
      "features": {
        "user-management": { "maxUsers": 10 },
        "storage": { "maxGB": 5 }
      }
    },
    {
      "name": "Professional",
      "slug": "professional",
      "price": 99,
      "currency": "EUR",
      "interval": "month",
      "features": {
        "user-management": { "maxUsers": 100 },
        "storage": { "maxGB": 50 }
      }
    }
  ]
}
```

## Environment Variables

Set these before installation:

```bash
# Required
DATABASE_URL=postgresql://developer:developer@localhost:5432/mono
REDIS_URL=redis://localhost:6379

# Optional
ADMIN_PASSWORD=YourSecurePassword123!
DEFAULT_LOCALE=en-US
DEFAULT_TIMEZONE=Europe/Vienna
```

## Validation

Before installation, validate your configuration:

```bash
# Validate all JSON files
pnpm tsx installation/install.ts --validate-only

# Check specific file
jq . installation/platform/platform-config.json
```

## Best Practices

1. **Locales**: Use ISO format (en-US, not en)
2. **Timezones**: Use IANA timezone identifiers
3. **Passwords**: Use environment variables, never hardcode
4. **Features**: Only enable what you need
5. **Limits**: Set reasonable defaults to prevent abuse

## Troubleshooting

### Common Configuration Errors

1. **Invalid JSON syntax**
   - Use a JSON validator
   - Check for trailing commas

2. **Missing required fields**
   - Refer to schema documentation
   - Check error messages

3. **Invalid references**
   - Ensure slugs match exactly
   - Check parent-child relationships

4. **Duplicate entries**
   - Slugs must be unique within scope
   - Email addresses must be globally unique