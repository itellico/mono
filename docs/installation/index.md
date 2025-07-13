# Installation Documentation

Complete guide for installing and configuring the itellico Mono platform from JSON configuration files.

## 🚀 Overview

The itellico Mono platform features a sophisticated JSON-based installation system that enables:

- **Zero-touch deployment** - Complete platform setup from configuration files
- **Multi-tenant support** - Install platform + specific tenants or everything at once
- **Idempotent operations** - Safe to run multiple times
- **Validation & dry-run** - Preview changes before applying
- **Complete RBAC** - 125+ permissions across 5 tiers automatically configured

## 📁 Installation Directory Structure

```
/installation
├── README.md                    # Installation guide
├── install.ts                   # Master installation script
├── install.config.json          # Installation metadata
├── platform/                    # Platform-level configuration
│   ├── platform-config.json     # Core platform settings
│   ├── default-tenant.json      # Default tenant setup
│   ├── admin-user.json          # Super admin user
│   ├── rbac-complete.json       # Complete RBAC (125+ permissions)
│   ├── categories.json          # Platform categories
│   ├── tags.json               # System tags
│   ├── option-sets.json        # Countries, currencies, languages
│   ├── features.json           # Feature definitions
│   └── plans.json              # Subscription plans
└── tenants/                    # Tenant-specific configurations
    └── go-models.com/          # Modeling industry tenant
        ├── tenant-config.json   # Tenant settings
        ├── tenant-users.json    # Default users
        ├── categories.json      # Model categories
        ├── tags.json           # Industry tags
        ├── option-sets.json    # Model measurements
        ├── schemas.json        # Profile schemas
        ├── accounts.json       # Account hierarchy
        └── account-users.json  # Users per account
```

## 🎯 Quick Start

### Basic Installation

```bash
# Install platform only
pnpm tsx installation/install.ts

# Install platform + specific tenant
pnpm tsx installation/install.ts --tenant=go-models.com

# Install everything (platform + all tenants)
pnpm tsx installation/install.ts --all
```

### Advanced Options

```bash
# Preview without making changes
pnpm tsx installation/install.ts --all --dry-run

# Reset database before installation (⚠️ CAUTION)
pnpm tsx installation/install.ts --reset --all

# Validate JSON files only
pnpm tsx installation/install.ts --validate-only

# Set custom admin password
pnpm tsx installation/install.ts --admin-password=MySecurePass123!

# Enable verbose output
pnpm tsx installation/install.ts --verbose
```

## 🔐 5-Tier Architecture

The installation system creates a complete 5-tier hierarchy:

```
Platform → Tenant → Account → User → Public
```

### Platform Level
- Super admin user
- System-wide permissions
- Global categories and tags
- Subscription plans
- Feature definitions

### Tenant Level
- Tenant-specific configuration
- Industry-specific data
- Custom categories and tags
- Option sets

### Account Level
- Different account types (agency, professional, individual, guardian)
- Account-specific settings
- Team management capabilities

### User Level
- Individual users within accounts
- Role-based permissions
- Personal profiles

### Public Level
- Public-facing configuration
- Marketplace settings

## 👥 Default Credentials

### Platform Admin
- **Email**: admin@itellico.ai
- **Password**: Admin123!@# (or set via `--admin-password`)

### go-models.com Test Accounts

#### Agency Account - Elite Model Management Vienna
- **Director**: elite_director / EliteDir2024!
- **Booking Agent**: elite_booking / EliteBook2024!
- **Talent Scout**: elite_scout / EliteScout2024!

#### Professional Account - Stefan Berger Photography
- **Owner**: stefan_berger / Stefan2024!
- **Assistant**: photo_assistant / Assistant2024!

#### Model Account - Sophie Laurent
- **Model**: sophie_laurent / Sophie2024!
- **Manager**: sophie_manager / Manager2024!

#### Guardian Account - Müller Family
- **Mother**: sabine_mueller / Sabine2024! (Account Admin)
- **Father**: thomas_mueller / Thomas2024! (Account Manager)
- **Child Model Emma**: emma_mueller / Emma2024!
- **Child Model Max**: max_mueller / Max2024!

#### Creative Account - Makeup & Style Collective
- **Founder**: collective_founder / Founder2024!
- **Makeup Artist**: anna_makeup / Anna2024!
- **Fashion Stylist**: peter_stylist / Peter2024!

## 🔧 Configuration Details

### Platform Configuration

#### `platform-config.json`
```json
{
  "platform": {
    "name": "itellico Mono",
    "version": "1.0.0",
    "url": "https://platform.itellico.ai",
    "defaultLocale": "en-US",
    "defaultTimezone": "Europe/Vienna",
    "features": ["multi-tenant", "rbac", "audit", "cache", "workflows"]
  }
}
```

#### `rbac-complete.json`
- 8 system roles (super_admin, platform_admin, tenant_admin, etc.)
- 125+ granular permissions
- Hierarchical permission structure
- Wildcard support for admin roles

### Tenant Configuration

Each tenant includes:
- Custom categories and tags
- Industry-specific option sets
- Default users and roles
- Account hierarchy
- Business-specific settings

## 🛠️ Creating New Tenants

1. Create directory: `/installation/tenants/your-tenant/`

2. Add required JSON files:
   - `tenant-config.json` - Basic tenant settings
   - `tenant-users.json` - Default users
   - `categories.json` - Business categories
   - `tags.json` - Classification tags
   - `option-sets.json` - Custom dropdown values

3. Optional account hierarchy:
   - `accounts.json` - Account definitions
   - `account-users.json` - Users per account

4. Install: `pnpm tsx installation/install.ts --tenant=your-tenant`

## ✅ Validation

The installer validates all JSON files before installation:

```bash
pnpm tsx installation/install.ts --validate-only
```

This checks:
- JSON syntax validity
- Required fields presence
- Data type correctness
- Reference integrity

## 🚨 Security Considerations

1. **Passwords**: 
   - Never commit real passwords to version control
   - Use environment variables for production
   - Force password changes after first login

2. **Admin Account**:
   - Change default password immediately
   - Enable 2FA after installation
   - Limit super admin access

3. **Database Reset**:
   - The `--reset` flag requires extreme caution
   - Only use in development environments
   - Backs up data before resetting in production

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis is running
   redis-cli ping
   ```

3. **Permission Denied**
   ```bash
   # Make install script executable
   chmod +x installation/install.ts
   ```

4. **JSON Validation Errors**
   ```bash
   # Validate specific file
   jq . installation/platform/rbac-complete.json
   ```

### Debug Mode

Enable verbose logging:
```bash
DEBUG=true pnpm tsx installation/install.ts --verbose
```

## 📋 Post-Installation Checklist

After successful installation:

- [ ] Change admin password
- [ ] Configure email settings
- [ ] Set up backup strategy
- [ ] Enable monitoring
- [ ] Configure CDN (if needed)
- [ ] Set up payment gateway (for marketplaces)
- [ ] Import initial data
- [ ] Test all user types

## 🔄 Maintenance

### Backup Configuration
```bash
# Export current configuration
tar -czf installation-backup-$(date +%Y%m%d).tar.gz installation/
```

### Update Configuration
1. Modify JSON files as needed
2. Validate changes: `--validate-only`
3. Apply updates: Run installer again (idempotent)

### Version Control
- Commit all JSON configuration files
- Tag releases appropriately
- Document changes in CHANGELOG

## 📚 Related Documentation

### Installation Guides
- [Platform Configuration Guide](./platform-configuration.md) - Detailed platform setup
- [Tenant Configuration Guide](./tenant-configuration.md) - Industry-specific configuration
- [Quick Reference](./quick-reference.md) - Essential commands and tips

### System Documentation
- [Architecture Overview](/architecture/)
- [5-Tier System Design](/architecture/system-design/)
- [RBAC System](/platform/access-control/rbac-system/)
- [Development Workflow](/development/workflows/)
- [Deployment Guide](/development/deployment/)

## 🆘 Support

For installation issues:
1. Check logs with `DEBUG=true`
2. Review JSON validation errors
3. Consult [Troubleshooting Guide](/reference/troubleshooting/)
4. Contact: support@itellico.ai

---

*The installation system ensures consistent, repeatable deployments across all environments. Always validate configurations before applying to production.*