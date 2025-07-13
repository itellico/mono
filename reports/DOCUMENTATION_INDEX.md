# 📚 itellico Mono - Complete Documentation Index

This is the master index of all documentation in the itellico Mono. Use this to quickly find any documentation you need.

## 🗂️ Documentation Organization

### Primary Documentation Hub
- **Location**: `/docs/`
- **Index**: [Documentation README](./docs/README.md)
- **Interactive Viewer**: http://localhost:3000/docs (when running locally)

### Documentation Categories

## 1. 🚀 Getting Started
**Location**: `/docs/getting-started/`

- [Getting Started Overview](./docs/getting-started/README.md)
- [Installation Guide](./docs/getting-started/installation.md)
- [Development Setup](./docs/getting-started/development-setup.md)
- [First Steps](./docs/getting-started/first-steps.md)

## 2. 🏗️ Architecture & Design
**Location**: `/docs/architecture/`

- [itellico Mono Complete Specification](./docs/architecture/MONO_PLATFORM_COMPLETE_SPECIFICATION.md)
- [Multi-Tenant Architecture](./docs/architecture/MULTI_TENANT_ARCHITECTURE_RECOMMENDATIONS.md)
- [Three-Level Change System Architecture](./docs/architecture/THREE_LEVEL_CHANGE_SYSTEM.md)
- [Project Structure](./docs/architecture/PROJECT_STRUCTURE_OUTLINE.md)
- [System Design](./docs/architecture/system-design.md)
- [Database Schema](./docs/architecture/database-schema.md)
- [API Architecture](./docs/architecture/api-design.md)

## 3. 🔌 API Documentation
**Location**: `/docs/api/`

- [API Overview](./docs/api/README.md)
- [Authentication](./docs/api/authentication.md)
- [API Endpoints](./docs/api/endpoints/)
- **Live API Docs**: http://localhost:3001/documentation

## 4. ⚡ Features Documentation
**Location**: `/docs/features/`

- [RBAC System Implementation](./docs/features/PERMISSION_SYSTEM_IMPLEMENTATION.md)
- [RBAC Complete Guide](./docs/features/RBAC-IMPLEMENTATION-COMPLETE.md)
- [Three-Level Change System](./docs/features/THREE_LEVEL_CHANGE_SYSTEM_GUIDE.md)
- [Workflow Integration](./docs/features/COMPREHENSIVE_WORKFLOW_INTEGRATION_ARCHITECTURE.md)
- [Messaging System](./docs/features/GOCARE_MESSAGING_SYSTEM_ARCHITECTURE.md)
- [Multi-Tenancy](./docs/features/multi-tenancy.md)
- [Media Management](./docs/features/media-handling.md)

## 5. 🔄 Migration Guides
**Location**: `/docs/migrations/`

- [API Migration Complete](./docs/migrations/API_MIGRATION_COMPLETE.md)
- [Fastify Migration Plan](./docs/migrations/FASTIFY_MIGRATION_PLAN.md)
- [Fastify Migration Progress](./docs/migrations/FASTIFY_MIGRATION_PROGRESS.md)
- [Database Migrations](./docs/migrations/database-migrations.md)

## 6. 🧪 Testing Documentation
**Location**: `/docs/testing/`

- [Testing Overview](./docs/testing/TESTING.md)
- [Testing Methodology](./docs/testing/TESTING_METHODOLOGY.md)
- [Testing Types & Coverage](./docs/testing/TESTING_TYPES_AND_COVERAGE.md)
- [Testing Circle Guide](./docs/testing/TESTING_CIRCLE_HOWTO.md)
- [TDD Tenant Creation Demo](./docs/testing/TDD_TENANT_CREATION_DEMO.md)

## 7. 💻 Development Practices
**Location**: `/docs/development/`

- [Development Overview](./docs/development/README.md)
- [Coding Standards](./docs/development/coding-standards.md)
- [Git Workflow](./docs/development/git-workflow.md)
- [Best Practices](./docs/development/best-practices.md)

## 8. 📊 Reference Materials
**Location**: `/docs/reference/`

- [Platform Audit Report](./docs/reference/MONO_PLATFORM_AUDIT_REPORT.md)
- [Prisma Optimization Report](./docs/reference/PRISMA_OPTIMIZATION_REPORT.md)
- [BigInt Optimization Audit](./docs/reference/BIGINT_OPTIMIZATION_AUDIT.md)
- [Redis Cache Hierarchy](./docs/reference/redis-cache-hierarchy.md)

## 9. 📘 Guides & How-Tos
**Location**: `/docs/guides/`

- [Regional Measurement Guide](./docs/guides/REGIONAL_MEASUREMENT_IMPLEMENTATION_GUIDE.md)
- [Platform Integration Guide](./docs/guides/PLATFORM_INTEGRATION_CLARIFICATIONS.md)
- [Troubleshooting Guide](./docs/guides/troubleshooting.md)
- [Adding Features](./docs/guides/adding-features.md)

## 10. 🚀 Deployment
**Location**: `/docs/deployment/`

- [Deployment Overview](./docs/deployment/README.md)
- [Environment Setup](./docs/deployment/environments.md)
- [CI/CD Pipeline](./docs/deployment/ci-cd.md)
- [Monitoring](./docs/deployment/monitoring.md)

## 📜 Root Level Documentation

### Configuration & Setup
- [Main README](./README.md) - Project overview
- [CLAUDE.md](./CLAUDE.md) - AI assistant context
- [GEMINI.md](./GEMINI.md) - Additional AI context

### Migration & Optimization
- [Fastify Performance Analysis](./FASTIFY_PERFORMANCE_ANALYSIS.md)
- [RBAC Optimization](./RBAC_OPTIMIZATION_IMPLEMENTATION.md)
- [RBAC Cleanup Complete](./RBAC-CLEANUP-COMPLETE.md)
- [Permission Management Roadmap](./PERMISSION_MANAGEMENT_SYSTEM_ROADMAP.md)

### Database & Schema
- [Audit Report](./audit.md)
- [Seed Documentation](./seed.md)
- [Schema Migration Guide](./lib/schema-migration-guide.md)
- [Permission Lists](./permissions-list.md)
- [Optimized Permissions](./permissions-list-optimized.md)

## 🛠️ Scripts Documentation
**Location**: `/scripts/`

- [Scripts Overview](./scripts/README.md)
- Development Scripts: `/scripts/dev/`
- Build Scripts: `/scripts/build/`
- Test Scripts: `/scripts/test/`
- Database Scripts: `/scripts/database/`
- Seed Scripts: `/scripts/seed/`

## 🔍 Quick Reference

### By Technology
- **Next.js**: See `/docs/architecture/frontend-architecture.md`
- **Fastify**: See `/docs/architecture/api-design.md`
- **Prisma**: See `/docs/architecture/database-schema.md`
- **Redis**: See `/docs/reference/redis-cache-hierarchy.md`

### By Task
- **Adding a Feature**: `/docs/guides/adding-features.md`
- **Writing Tests**: `/docs/testing/README.md`
- **Deploying**: `/docs/deployment/README.md`
- **Troubleshooting**: `/docs/guides/troubleshooting.md`

### Key Commands
```bash
# View interactive docs (recommended: use separate terminals)
# Terminal 1: Start API server
./start-api.sh

# Terminal 2: Start frontend
./start-frontend.sh

# Navigate to http://localhost:3000/docs

# Alternative: Use legacy script
./start-dev.sh

# Generate API documentation
tsx scripts/docs/generate-api-docs.ts

# Check documentation links
tsx scripts/docs/check-doc-links.ts
```

## 📝 Documentation Standards

1. **Always update docs** when changing code
2. **Use relative links** in documentation
3. **Include examples** in technical docs
4. **Add diagrams** for complex concepts
5. **Keep docs versioned** with code

## 🔄 Keeping Docs Current

- Documentation is part of Definition of Done
- Run `check-doc-links.ts` before commits
- Update this index when adding new docs
- Review docs in code reviews

---

*Last Updated: January 2025*
*Total Documentation Files: 52+*
*Documentation Version: 1.1.0*