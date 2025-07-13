# Installation Quick Reference

Essential commands and configurations for the itellico Mono installation system.

## 🚀 Installation Commands

```bash
# Basic installation (platform only)
pnpm tsx installation/install.ts

# Platform + specific tenant
pnpm tsx installation/install.ts --tenant=go-models.com

# Install everything
pnpm tsx installation/install.ts --all

# Dry run (preview only)
pnpm tsx installation/install.ts --all --dry-run

# Validate JSON files
pnpm tsx installation/install.ts --validate-only

# Reset and reinstall (⚠️ CAUTION)
pnpm tsx installation/install.ts --reset --all

# Custom admin password
pnpm tsx installation/install.ts --admin-password=SecurePass123!

# Verbose output
pnpm tsx installation/install.ts --verbose

# Help
pnpm tsx installation/install.ts --help
```

## 📁 File Structure

```
/installation/
├── install.ts              # Run this script
├── platform/              # Platform config
│   ├── platform-config.json
│   ├── admin-user.json
│   └── rbac-complete.json
└── tenants/              # Tenant configs
    └── {tenant-name}/
        ├── tenant-config.json
        └── tenant-users.json
```

## 🔑 Default Credentials

### Platform Admin
```
Email: admin@itellico.ai
Password: Admin123!@#
```

### go-models.com Accounts
```
# Tenant Admin
Username: gomodels_admin
Password: GoModelsAdmin2024!

# Agency Director
Username: elite_director
Password: EliteDir2024!

# Photographer
Username: stefan_berger
Password: Stefan2024!

# Model
Username: sophie_laurent
Password: Sophie2024!

# Parent (Guardian)
Username: sabine_mueller
Password: Sabine2024!
```

## 🏗️ 5-Tier Hierarchy

```
Platform
  └── Tenant (go-models.com)
      └── Account (Elite Management)
          └── User (elite_director)
              └── Public
```

## ⚙️ Environment Variables

```bash
# Required
export DATABASE_URL="postgresql://developer:developer@localhost:5432/mono"
export REDIS_URL="redis://localhost:6379"

# Optional
export ADMIN_PASSWORD="YourSecurePassword123!"
export DEBUG="true"  # For verbose output
```

## 📋 Installation Checklist

### Pre-Installation
- [ ] **Docker services running**: `docker-compose up -d`
- [ ] **Stop local PostgreSQL**: `brew services stop postgresql@14` (if installed)
- [ ] **Verify Docker PostgreSQL**: `psql "postgresql://developer:developer@localhost:5432/mono" -c "SELECT 1"`
- [ ] **Check .env file**: DATABASE_URL points to `localhost:5432` (Docker)
- [ ] **Environment variables set**: All required vars configured

### Installation
- [ ] Run validation
- [ ] Do dry run first
- [ ] Execute installation
- [ ] Verify completion

### Post-Installation
- [ ] Test admin login
- [ ] Change default passwords
- [ ] Test each account type
- [ ] Configure email settings

## 🛠️ Common Operations

### Add New Tenant
```bash
# 1. Create directory
mkdir -p installation/tenants/my-tenant

# 2. Add config files
# 3. Install
pnpm tsx installation/install.ts --tenant=my-tenant
```

### Update Existing Data
```bash
# Safe - installer is idempotent
pnpm tsx installation/install.ts --tenant=my-tenant
```

### Debug Installation
```bash
# Enable debug mode
DEBUG=true pnpm tsx installation/install.ts --verbose

# Check specific file
jq . installation/platform/rbac-complete.json
```

## 🚨 Troubleshooting

### 🐳 Docker Issues
```bash
# Check Docker services
docker-compose ps

# Restart Docker services  
docker-compose restart postgres redis

# Check PostgreSQL logs
docker logs mono-postgres

# Stop conflicting local PostgreSQL
brew services stop postgresql@14
```

### Database Connection
```bash
# Test Docker PostgreSQL (correct)
psql "postgresql://developer:developer@localhost:5432/mono" -c "SELECT 1"

# Test Redis
redis-cli -h localhost -p 6379 ping
```

### JSON Validation
```bash
# Validate all
pnpm tsx installation/install.ts --validate-only

# Check specific file
jq . installation/tenants/go-models.com/accounts.json
```

### Common Errors
| Error | Solution |
|-------|----------|
| "database 'mono' does not exist" | Stop local PostgreSQL: `brew services stop postgresql@14` |
| "Unknown argument `isActive`" | Change to `is_active` |
| "Connection refused" | Start Docker services: `docker-compose up -d` |
| "Duplicate key" | Check for unique slugs |
| "Invalid JSON" | Remove trailing commas |

## 📊 What Gets Installed

### Platform Level
- ✅ 1 Platform configuration
- ✅ 1 Default tenant
- ✅ 1 Super admin user
- ✅ 8 System roles
- ✅ 125+ Permissions
- ✅ 6 Platform categories
- ✅ 24 System tags
- ✅ 7 Global option sets
- ✅ 15 Features
- ✅ 5 Subscription plans

### Per Tenant (go-models.com)
- ✅ 1 Tenant configuration
- ✅ 4 Tenant users
- ✅ 5 Accounts
- ✅ 14 Account users
- ✅ 12 Sample profiles
- ✅ 6 Industry categories
- ✅ 64 Industry tags
- ✅ 16 Custom option sets

## 🔗 Quick Links

- [Full Documentation](./index.md)
- [Platform Config Guide](./platform-configuration.md)
- [Tenant Config Guide](./tenant-configuration.md)
- [Main Installation README](/installation/README.md)
- [Installation Script](/installation/install.ts)

## 💡 Pro Tips

1. **Always dry-run first**: `--dry-run` prevents mistakes
2. **Use verbose mode**: `--verbose` shows detailed progress
3. **Validate often**: `--validate-only` catches errors early
4. **Backup before reset**: `--reset` deletes all data
5. **Document passwords**: Use a password manager
6. **Version control**: Commit your JSON configs
7. **Environment-specific**: Keep dev/prod configs separate

---

*For detailed information, see the [complete installation documentation](./index.md)*