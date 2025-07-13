# itellico Mono Scripts Directory

This directory contains all utility scripts for development, testing, deployment, and maintenance of the itellico Mono.

## 📁 Directory Structure

```
scripts/
├── README.md           # This file
├── dev/               # Development utilities
├── build/             # Build and compilation scripts
├── test/              # Testing utilities
├── docs/              # Documentation generation
├── database/          # Database management
├── deployment/        # Deployment scripts
└── seed/              # Database seeding scripts
```

## 🛠️ Script Categories

### Development Scripts (`/dev`)
Scripts for local development workflow:
- `../start-api.sh` - Start Fastify API server (port 3001)
- `../start-frontend.sh` - Start Next.js frontend (port 3000)
- `../start-dev.sh` - Start both services in one terminal (legacy)
- `reset-dev.sh` - Reset development environment
- `create-component.ts` - Generate new React components
- `create-api-route.ts` - Generate new API endpoints

### Build Scripts (`/build`)
Scripts for building and packaging:
- `build-all.sh` - Build frontend and API
- `build-docker.sh` - Build Docker images
- `optimize-bundle.ts` - Analyze and optimize bundles

### Test Scripts (`/test`)
Scripts for testing:
- `test-api-endpoints.ts` - Test all API endpoints
- `test-permissions.ts` - Test RBAC system
- `run-e2e.sh` - Run end-to-end tests
- `coverage-report.sh` - Generate coverage reports

### Documentation Scripts (`/docs`)
Scripts for documentation:
- `generate-api-docs.ts` - Generate API documentation from code
- `check-doc-links.ts` - Verify documentation links
- `update-toc.ts` - Update table of contents in MD files
- `create-changelog.ts` - Generate changelog from commits

### Database Scripts (`/database`)
Scripts for database management:
- `migrate.sh` - Run database migrations
- `backup-db.sh` - Backup database
- `restore-db.sh` - Restore database from backup
- `optimize-indexes.ts` - Optimize database indexes

### Deployment Scripts (`/deployment`)
Scripts for deployment:
- `deploy-staging.sh` - Deploy to staging
- `deploy-production.sh` - Deploy to production
- `rollback.sh` - Rollback deployment
- `health-check.ts` - Check deployment health

### Seed Scripts (`/seed`)
Database seeding scripts organized by domain:
- `/categories-tags/` - Category and tag seeders
- `/core/` - Core data seeders (countries, currencies, etc.)
- `/demo/` - Demo data seeders
- `/option-sets/` - Option set seeders
- `/utils/` - Seeding utilities

## 🚀 Common Commands

### Development
```bash
# Start development environment (recommended: use separate terminals)

# Terminal 1: Start API server
./start-api.sh

# Terminal 2: Start frontend
./start-frontend.sh

# Alternative: Use legacy script
./start-dev.sh

# Reset development database
./scripts/dev/reset-dev.sh

# Create new component
tsx scripts/dev/create-component.ts Button
```

### Testing
```bash
# Test all API endpoints
tsx scripts/test/test-api-endpoints.ts

# Run specific test suite
./scripts/test/run-tests.sh unit

# Generate coverage report
./scripts/test/coverage-report.sh
```

### Database
```bash
# Run migrations
./scripts/database/migrate.sh

# Seed database
tsx scripts/seed/comprehensive-seeder.ts

# Backup database
./scripts/database/backup-db.sh
```

### Documentation
```bash
# Generate API docs
tsx scripts/docs/generate-api-docs.ts

# Check documentation links
tsx scripts/docs/check-doc-links.ts
```

## 📝 Writing New Scripts

### Script Template
```typescript
#!/usr/bin/env tsx
/**
 * Script: script-name.ts
 * Purpose: Brief description of what this script does
 * Usage: tsx scripts/category/script-name.ts [options]
 */

import { logger } from '@/lib/logger';

async function main() {
  try {
    logger.info('Starting script...');
    
    // Script logic here
    
    logger.success('Script completed successfully');
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
```

### Best Practices
1. **Use TypeScript** for type safety
2. **Add proper logging** using the logger utility
3. **Handle errors gracefully** with try/catch
4. **Document usage** in script header
5. **Make scripts idempotent** when possible
6. **Add confirmation prompts** for destructive operations

## 🔧 Utilities

Common utilities available for scripts:
- `logger` - Consistent logging
- `db` - Database connection
- `apiClient` - API client for testing
- `config` - Configuration management

## 🏷️ Script Naming Convention

- Use kebab-case: `create-user.ts`
- Be descriptive: `migrate-v2-to-v3.ts` not `migrate.ts`
- Include action verb: `generate-`, `create-`, `update-`, `delete-`
- Add file extension: `.ts` for TypeScript, `.sh` for shell

## 🔒 Security Notes

- Never commit scripts with hardcoded credentials
- Use environment variables for sensitive data
- Add `.local` suffix for local-only scripts
- Review scripts before running in production

## 📊 Script Inventory

| Category | Count | Purpose |
|----------|-------|---------|
| Development | 12 | Local dev workflow |
| Testing | 8 | Automated testing |
| Database | 15 | DB management |
| Seeding | 20 | Data population |
| Documentation | 5 | Doc generation |
| Deployment | 6 | Deploy automation |

---

*Last Updated: January 2025*
*Scripts Version: 1.0.0*