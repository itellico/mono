# itellico Mono Platform Installation

Complete installation system for the itellico Mono multi-tenant SaaS platform.

## Overview

This installation directory contains all configuration files and scripts needed to set up a fresh instance of the itellico Mono platform. It includes:

- **Platform Configuration**: Core system settings, RBAC, features, plans
- **Tenant Configurations**: Industry-specific tenant setups (e.g., go-models.com)
- **Master Installation Script**: Automated setup with validation and safety checks

## Quick Start

```bash
# Install platform only
pnpm tsx installation/install.ts

# Install platform + specific tenant
pnpm tsx installation/install.ts --tenant=go-models.com

# Install everything (platform + all tenants)
pnpm tsx installation/install.ts --all

# Dry run (preview without changes)
pnpm tsx installation/install.ts --all --dry-run

# Validate JSON files only
pnpm tsx installation/install.ts --validate-only
```

## Directory Structure

```
/installation
├── README.md                    # This file
├── install.ts                   # Master installation script
├── install.config.json          # Installation metadata
├── platform/                    # Platform-level configuration
│   ├── platform-config.json     # Core platform settings
│   ├── default-tenant.json      # Default tenant setup
│   ├── admin-user.json          # Super admin user
│   ├── rbac-complete.json       # Complete RBAC (100+ permissions)
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
        ├── account-users.json  # Users per account
        └── profiles.json       # Sample profile data
```

## Prerequisites

1. **System Requirements**:
   - Node.js >= 18.0.0
   - pnpm >= 8.0.0
   - PostgreSQL >= 14.0
   - Redis >= 6.0

2. **Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://developer:developer@192.168.178.94:5432/mono
   REDIS_URL=redis://192.168.178.94:6379
   ADMIN_PASSWORD=YourSecurePassword123!  # Optional
   ```

3. **Database Setup**:
   ```bash
   # Run Prisma migrations first
   pnpm prisma migrate deploy
   pnpm prisma generate
   ```

## Installation Options

### Command Line Arguments

| Option | Description |
|--------|-------------|
| `--all` | Install platform and all tenants |
| `--tenant=<name>` | Install platform and specific tenant |
| `--dry-run` | Preview what would be installed |
| `--reset` | Reset database before installation |
| `--validate-only` | Validate JSON files only |
| `--admin-password=<pass>` | Set admin password |
| `--verbose` | Show detailed output |
| `--help` | Show help message |

### Examples

```bash
# Basic platform installation
pnpm tsx installation/install.ts

# Platform + GoModels tenant
pnpm tsx installation/install.ts --tenant=go-models.com

# Everything with custom admin password
pnpm tsx installation/install.ts --all --admin-password=MySecurePass123!

# Reset and reinstall everything
pnpm tsx installation/install.ts --reset --all

# Validate configuration files
pnpm tsx installation/install.ts --validate-only
```

## Platform Configuration

### Core Settings (`platform-config.json`)
- Platform name, version, URLs
- Default locale: `en-US` (ISO standard)
- Default timezone: `Europe/Vienna`
- Supported locales: 14 languages
- Features: Multi-tenant, RBAC, audit, cache, workflows

### RBAC System (`rbac-complete.json`)
- **125+ Permissions** across 5 tiers
- **8 System Roles** with hierarchical structure
- **5-Tier Architecture**: Platform → Tenant → Account → User → Public

### Default Admin (`admin-user.json`)
- Email: `admin@itellico.ai`
- Username: `admin`
- Roles: `super_admin`, `platform_admin`
- Password: Set via `--admin-password` or `ADMIN_PASSWORD` env var

## Tenant Configuration

### go-models.com - Modeling Industry

Professional modeling platform with:

- **Categories**: Fashion, Commercial, Fitness, Specialty models
- **Physical Attributes**: Heights (cm/ft), weights (kg/lbs), measurements
- **Appearance**: Eye colors, hair colors, skin tones, ethnicities
- **Sizes**: Dress sizes (EU/US/UK), shoe sizes, measurements
- **Skills**: Languages, sports, special abilities
- **Experience Levels**: From new faces to professionals
- **Locations**: Major fashion capitals worldwide

#### Account Hierarchy

The go-models.com tenant includes a complete account hierarchy with sample profiles for testing:

1. **Elite Model Management Vienna** (Agency Account)
   - Director: elite_director / EliteDir2024!
   - Booking Agent: elite_booking / EliteBook2024!
   - Talent Scout: elite_scout / EliteScout2024!
   - **5 Model Profiles**: Sarah Klein (fashion), Luca Novak (commercial), Anna Weber (plus-size), Elena Popović (new face), David Müller (character)

2. **Stefan Berger Photography** (Professional Account)
   - Owner: stefan_berger / Stefan2024!
   - Assistant: photo_assistant / Assistant2024!
   - **Portfolio**: Award-winning fashion/commercial photographer with 15+ years experience

3. **Sophie Laurent** (Individual Model Account)
   - Model: sophie_laurent / Sophie2024!
   - Manager: sophie_manager / Manager2024!
   - **Profile**: International fashion model with Vogue, Chanel, Dior experience

4. **Müller Family** (Guardian Account)
   - Mother: sabine_mueller / Sabine2024! (Account Admin)
   - Father: thomas_mueller / Thomas2024! (Account Manager)
   - **Emma Müller (8)**: emma_mueller / Emma2024! - Child model with education-first policy
   - **Max Müller (10)**: max_mueller / Max2024! - Athletic child model for sports brands

5. **Makeup & Style Collective** (Creative Professional Account)
   - Founder: collective_founder / Founder2024!
   - Makeup Artist: anna_makeup / Anna2024!
   - Fashion Stylist: peter_stylist / Peter2024!
   - **Team Profile**: Creative collective for high-fashion editorials and campaigns

### Adding New Tenants

1. Create directory: `/installation/tenants/your-tenant/`
2. Add required JSON files:
   - `tenant-config.json` - Tenant settings
   - `tenant-users.json` - Default users
   - `categories.json` - Business categories
   - `tags.json` - Classification tags
   - `option-sets.json` - Custom options

3. Install: `pnpm tsx installation/install.ts --tenant=your-tenant`

## Validation

The installer validates all JSON files before installation:

```bash
pnpm tsx installation/install.ts --validate-only
```

This checks:
- JSON syntax validity
- Required fields presence
- Data type correctness
- Reference integrity

## Security

1. **Passwords**: Never commit real passwords
   - Use environment variables
   - Use secure defaults with forced change

2. **Admin User**: 
   - Default password must be changed
   - Enable 2FA after first login

3. **Database Reset**: 
   - `--reset` flag requires confirmation
   - Only use in development

## Troubleshooting

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

## Post-Installation

After successful installation:

1. **Access the platform**:
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:3001/docs
   - Admin Login: admin@itellico.ai

2. **First Steps**:
   - Change admin password
   - Configure email settings
   - Set up backup strategy
   - Enable monitoring

3. **For go-models.com**:
   - Configure payment gateway
   - Set up CDN for media
   - Configure email templates
   - Import initial model data

## Maintenance

### Backup Configuration
```bash
# Export current configuration
tar -czf installation-backup.tar.gz installation/
```

### Update Configuration
1. Modify JSON files
2. Validate changes: `--validate-only`
3. Apply updates: Run installer again

### Version Control
- Commit all JSON files
- Tag releases
- Document changes in CHANGELOG

## Support

For issues or questions:
- Check logs in `DEBUG` mode
- Review JSON validation errors
- Consult main documentation
- Contact: support@itellico.ai

---

**Note**: This installation system ensures consistent, repeatable deployments across all environments. Always validate configurations before applying to production.