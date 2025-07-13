# Docker PostgreSQL Setup & Migration

## Overview

The mono platform uses Docker PostgreSQL as the primary database instance, running on `192.168.178.94:5432`. This document covers the setup, configuration, and migration process.

## Database Configuration

### Connection Details
```bash
Host: 192.168.178.94
Port: 5432
Database: mono
User: developer
Password: developer
Connection String: postgresql://developer:developer@192.168.178.94:5432/mono
```

### Environment Configuration
```bash
# .env Configuration
DATABASE_URL="postgresql://developer:developer@192.168.178.94:5432/mono"
DB_HOST=192.168.178.94
DB_PORT=5432
DB_NAME=mono
DB_USER=developer
DB_PASSWORD=developer
```

## Database Schema Status

### Current State
- ✅ **53 tables** with complete schema
- ✅ **UUID fields** implemented on all required models
- ✅ **Cache infrastructure** with 5 specialized tables
- ✅ **Field ordering** optimized (UUID → ID → Fields → Relations)
- ✅ **Multi-level caching** system ready

### Key Tables
| Table | Purpose | UUID Field | Status |
|-------|---------|------------|--------|
| Permission | RBAC permissions | ✅ | Complete |
| Role | User roles | ✅ | Complete |
| User | User accounts | ✅ | Complete |
| permission_cache | L1/L2/L3 cache | ✅ | Complete |
| cache_invalidation_log | Cache audit | ✅ | Complete |
| cache_warmup_queue | Background warming | ✅ | Complete |
| cache_metrics | Performance tracking | ✅ | Complete |
| cache_configuration | Multi-tenant cache config | ✅ | Complete |

## Migration Commands

### Standard Operations
```bash
# Deploy all migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# View database schema
pnpm prisma db pull

# Format schema file
pnpm prisma format
```

### Development Operations
```bash
# Reset database (development only)
pnpm prisma db push --force-reset

# Create new migration
pnpm prisma migrate dev --name migration_name

# View migration status
pnpm prisma migrate status
```

### Direct Database Access
```bash
# Connect via psql
psql "postgresql://developer:developer@192.168.178.94:5432/mono"

# List all tables
\dt

# Describe table structure
\d "TableName"

# Count records in table
SELECT COUNT(*) FROM "TableName";
```

## Docker Integration

### Services Using Database
- **Frontend** (`192.168.178.94:3000`) → PostgreSQL
- **API** (`192.168.178.94:3001`) → PostgreSQL
- **Kanboard** (`192.168.178.94:4041`) → PostgreSQL
- **N8N** (`192.168.178.94:5678`) → PostgreSQL
- **Temporal** (`192.168.178.94:7233`) → PostgreSQL

### Docker Compose Configuration
```yaml
postgres:
  image: postgres:15-alpine
  container_name: mono-postgres
  ports:
    - "5432:5432"
  environment:
    POSTGRES_DB: mono
    POSTGRES_USER: developer
    POSTGRES_PASSWORD: developer
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

## Migration History

### Database Audit Migration (Task #18)
**Date**: 2024-12-11  
**Purpose**: Complete database audit, UUID implementation, and Docker migration

#### Changes Made:
1. **Infrastructure Migration**:
   - Migrated from localhost PostgreSQL to Docker PostgreSQL
   - Updated `.env` configuration for Docker connectivity
   - Ensured all services connect to same database instance

2. **Schema Enhancements**:
   - Added UUID fields to Permission, Role, and related models
   - Implemented field reordering (UUID first)
   - Created cache infrastructure with 5 specialized tables

3. **Performance Optimizations**:
   - Optimized field ordering for new tables
   - Added comprehensive indexing strategy
   - Prepared multi-level caching system

#### Migration Commands Used:
```bash
# Update environment configuration
DATABASE_URL="postgresql://developer:developer@192.168.178.94:5432/mono"

# Deploy complete schema
pnpm prisma db push --force-reset

# Verify migration
psql "postgresql://developer:developer@192.168.178.94:5432/mono" -c "\dt"
```

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql "postgresql://developer:developer@192.168.178.94:5432/mono" -c "SELECT version();"

# Check Docker container
docker ps | grep postgres

# View Docker logs
docker logs mono-postgres
```

### Migration Issues
```bash
# Reset migration state
pnpm prisma migrate reset --force

# Resolve migration conflicts
pnpm prisma migrate resolve --applied migration_name

# Check migration status
pnpm prisma migrate status
```

### Schema Validation
```bash
# Validate schema
pnpm prisma validate

# Check schema drift
pnpm prisma db pull

# Format schema
pnpm prisma format
```

## Security Notes

- Database runs in isolated Docker network
- Credentials are development-specific
- No sensitive data exposed in logs
- PostgreSQL configured with proper access controls

## Performance Monitoring

### Key Metrics
- **Connection pooling**: Managed by Prisma
- **Query performance**: Monitored via cache_metrics table
- **Cache hit rates**: Tracked in cache_invalidation_log
- **Database size**: Monitored via Docker volume usage

### Optimization Features
- **UUID-based indexing**: Fast lookups on primary identifiers
- **Cache tables**: Reduced database load
- **Field ordering**: Optimized for common queries
- **Foreign key constraints**: Data integrity enforcement