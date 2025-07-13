# Tenant Configuration Guide

Complete guide for configuring tenant-specific settings and data during installation.

## Overview

Each tenant represents an independent marketplace or business unit with its own:
- Custom configuration
- Industry-specific data
- User accounts and permissions
- Categories and tags
- Option sets and schemas

## Directory Structure

```
/installation/tenants/{tenant-slug}/
├── tenant-config.json      # Core tenant settings
├── tenant-users.json       # Default tenant users
├── categories.json         # Business categories
├── tags.json              # Classification tags
├── option-sets.json       # Dropdown values
├── schemas.json           # Data schemas
├── accounts.json          # Account hierarchy (optional)
└── account-users.json     # Account users (optional)
```

## Configuration Files

### tenant-config.json

Basic tenant configuration and settings.

```json
{
  "tenant": {
    "name": "GoModels",
    "slug": "go-models.com",
    "domain": "go-models.com",
    "description": "Professional modeling and talent marketplace",
    "industry": "modeling",
    "is_active": true,
    "features": [
      "marketplace",
      "profiles",
      "booking",
      "messaging",
      "payments",
      "portfolio"
    ],
    "settings": {
      "locale": "en-US",
      "timezone": "Europe/Vienna",
      "currency": "EUR",
      "businessModel": "commission",
      "commissionRate": 20,
      "requireApproval": true,
      "allowPublicProfiles": true,
      "searchable": true
    },
    "branding": {
      "primaryColor": "#2563eb",
      "logo": "/assets/go-models-logo.png",
      "favicon": "/assets/go-models-favicon.ico"
    }
  }
}
```

### tenant-users.json

Default users created for the tenant.

```json
{
  "users": [
    {
      "email": "admin@go-models.com",
      "username": "gomodels_admin",
      "password": "${GOMODELS_ADMIN_PASSWORD:-GoModelsAdmin2024!}",
      "firstName": "GoModels",
      "lastName": "Admin",
      "roles": ["tenant_admin"],
      "isActive": true,
      "emailVerified": true
    },
    {
      "email": "support@go-models.com",
      "username": "gomodels_support",
      "password": "${GOMODELS_SUPPORT_PASSWORD:-GoModelsSupport2024!}",
      "firstName": "GoModels",
      "lastName": "Support",
      "roles": ["tenant_support"],
      "isActive": true,
      "emailVerified": true
    }
  ]
}
```

## Industry-Specific Configuration

### Categories

Define hierarchical categories for your industry.

```json
{
  "categories": [
    {
      "name": "Fashion Models",
      "slug": "fashion-models",
      "description": "High fashion and runway models",
      "subcategories": [
        "Runway",
        "Editorial", 
        "Catalog",
        "Haute Couture"
      ]
    },
    {
      "name": "Commercial Models",
      "slug": "commercial-models",
      "description": "Models for advertising and commercial work",
      "subcategories": [
        "Print",
        "Television",
        "E-commerce",
        "Lifestyle"
      ]
    }
  ]
}
```

### Tags

Detailed classification tags for filtering and search.

```json
{
  "tags": [
    {
      "category": "Physical Attributes",
      "tags": [
        {
          "name": "Blonde Hair",
          "slug": "blonde-hair",
          "description": "Natural or dyed blonde hair"
        },
        {
          "name": "Blue Eyes",
          "slug": "blue-eyes",
          "description": "Blue eye color"
        }
      ]
    },
    {
      "category": "Skills",
      "tags": [
        {
          "name": "Catwalk",
          "slug": "catwalk",
          "description": "Professional runway experience"
        }
      ]
    }
  ]
}
```

### Option Sets

Custom dropdown values specific to your industry.

```json
{
  "optionSets": [
    {
      "name": "Model Heights",
      "slug": "model-heights",
      "type": "measurements",
      "values": [
        { "cm": "170", "feet": "5'7\"", "label": "170 cm / 5'7\"" },
        { "cm": "175", "feet": "5'9\"", "label": "175 cm / 5'9\"" },
        { "cm": "180", "feet": "5'11\"", "label": "180 cm / 5'11\"" }
      ]
    },
    {
      "name": "Dress Sizes",
      "slug": "dress-sizes",
      "type": "sizes",
      "regionalValues": {
        "EU": ["34", "36", "38", "40", "42"],
        "US": ["2", "4", "6", "8", "10"],
        "UK": ["6", "8", "10", "12", "14"]
      }
    }
  ]
}
```

## Account Hierarchy (Optional)

### accounts.json

Define different account types for your tenant.

```json
{
  "accounts": [
    {
      "name": "Elite Model Management",
      "slug": "elite-management",
      "type": "agency",
      "email": "info@elite-management.com",
      "settings": {
        "accountType": "agency",
        "maxUsers": 20,
        "features": [
          "talent_management",
          "booking_management",
          "commission_tracking"
        ],
        "commission": {
          "modelRate": 20,
          "clientRate": 20
        }
      }
    },
    {
      "name": "John Smith Photography",
      "slug": "john-smith-photo",
      "type": "professional",
      "email": "john@smithphoto.com",
      "settings": {
        "accountType": "photographer",
        "maxUsers": 5,
        "features": [
          "booking_calendar",
          "portfolio_showcase"
        ]
      }
    }
  ]
}
```

### account-users.json

Users assigned to specific accounts.

```json
{
  "accountUsers": [
    {
      "accountSlug": "elite-management",
      "email": "director@elite-management.com",
      "username": "elite_director",
      "password": "${ELITE_DIR_PASSWORD:-EliteDir2024!}",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "roles": ["account_admin"],
      "permissions": ["account.*"]
    },
    {
      "accountSlug": "john-smith-photo",
      "email": "john@smithphoto.com",
      "username": "john_smith",
      "password": "${JOHN_PASSWORD:-JohnPhoto2024!}",
      "firstName": "John",
      "lastName": "Smith",
      "roles": ["account_admin"]
    }
  ]
}
```

## Real-World Examples

### E-commerce Tenant

```json
{
  "tenant": {
    "name": "ShopHub",
    "slug": "shophub",
    "industry": "ecommerce",
    "settings": {
      "businessModel": "marketplace",
      "commissionRate": 15,
      "supportedPaymentMethods": ["card", "paypal", "bank"],
      "shippingProviders": ["dhl", "ups", "fedex"]
    }
  }
}
```

### Education Platform

```json
{
  "tenant": {
    "name": "LearnPro",
    "slug": "learnpro",
    "industry": "education",
    "settings": {
      "businessModel": "subscription",
      "courseApproval": true,
      "certificatesEnabled": true,
      "offlineContent": true
    }
  }
}
```

### Service Marketplace

```json
{
  "tenant": {
    "name": "ServiceConnect",
    "slug": "serviceconnect",
    "industry": "services",
    "settings": {
      "businessModel": "lead-generation",
      "verificationRequired": true,
      "insuranceRequired": true,
      "backgroundChecks": true
    }
  }
}
```

## Creating a New Tenant

### Step 1: Create Directory

```bash
mkdir -p installation/tenants/your-tenant
```

### Step 2: Create Configuration Files

Start with the minimal required files:
- `tenant-config.json`
- `tenant-users.json`
- `categories.json`
- `tags.json`
- `option-sets.json`

### Step 3: Customize for Your Industry

1. Define relevant categories
2. Create industry-specific tags
3. Add custom option sets
4. Configure business rules

### Step 4: Install

```bash
pnpm tsx installation/install.ts --tenant=your-tenant
```

## Best Practices

### Naming Conventions

- **Slugs**: Use lowercase with hyphens (e.g., `fashion-models`)
- **Usernames**: Use underscores (e.g., `tenant_admin`)
- **Emails**: Use real domains for production

### Security

- Use environment variables for passwords
- Set strong password requirements
- Enable email verification
- Implement approval workflows where needed

### Data Organization

- Keep categories broad and use tags for specifics
- Use option sets for standardized values
- Plan for internationalization from the start

### Performance

- Limit initial data to essentials
- Use pagination-friendly structures
- Index commonly searched fields

## Validation Checklist

Before installation, ensure:

- [ ] All JSON files are valid
- [ ] Slugs are unique within scope
- [ ] Email addresses are unique
- [ ] Required fields are present
- [ ] References (categories, tags) exist
- [ ] Passwords meet security requirements
- [ ] Account hierarchies are logical

## Troubleshooting

### Common Issues

1. **Duplicate Slug Error**
   - Ensure all slugs are unique
   - Check both platform and tenant level

2. **Missing Parent Reference**
   - Create parent categories first
   - Verify account exists before adding users

3. **Invalid Industry Type**
   - Use predefined industry types
   - Or extend the system to support new types

4. **Permission Denied**
   - Check role assignments
   - Verify permission syntax

## Next Steps

After tenant installation:

1. Test login with each user type
2. Verify permissions work correctly
3. Check industry-specific features
4. Configure additional settings via UI
5. Import initial data if needed
6. Set up monitoring and backups