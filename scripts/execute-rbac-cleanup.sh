#!/bin/bash
# RBAC System Complete Cleanup Script
# This script will clean up the permission system by removing 9 redundant tables

set -e

echo "🚀 Starting RBAC System Cleanup..."
echo "This will remove 9 redundant permission tables and simplify the system"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Backup database first
echo "📦 Creating database backup..."
pg_dump $DATABASE_URL > backup/rbac_cleanup_backup_$(date +%Y%m%d_%H%M%S).sql || {
    echo "⚠️  Warning: Could not create backup. Creating backup directory..."
    mkdir -p backup
    pg_dump $DATABASE_URL > backup/rbac_cleanup_backup_$(date +%Y%m%d_%H%M%S).sql
}

echo "✅ Backup created"

# Add environment variables to .env if not present
echo "📝 Adding RBAC environment variables..."
if ! grep -q "RBAC_ENABLE_WILDCARDS" .env; then
    cat >> .env << EOL

# RBAC Configuration (replacing RBACConfig table)
RBAC_ENABLE_WILDCARDS=true
RBAC_ENABLE_CACHING=true
RBAC_CACHE_EXPIRATION_MINUTES=15
RBAC_MAX_PERMISSIONS_PER_USER=1000
RBAC_ENABLE_AUDIT=true
RBAC_AUDIT_RETENTION_DAYS=90
EOL
    echo "✅ Environment variables added"
else
    echo "✅ Environment variables already present"
fi

# Run the SQL migration
echo "🗄️  Running database migration..."
psql $DATABASE_URL -f prisma/migrations/20250104_cleanup_rbac_tables/migration.sql || {
    echo "❌ Migration failed! Check the error above."
    exit 1
}

echo "✅ Database migration completed"

# Generate new Prisma client
echo "🔧 Generating new Prisma client..."
npx prisma generate

echo "✅ Prisma client regenerated"

# Run code cleanup
echo "🧹 Cleaning up code references..."
npx tsx scripts/cleanup-rbac-code.ts

echo "✅ Code cleanup completed"

# Clear permission caches
echo "🗑️  Clearing permission caches..."
psql $DATABASE_URL -c "TRUNCATE TABLE \"UserPermissionCache\";"

echo "✅ Caches cleared"

# Summary
echo ""
echo "✨ RBAC Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "  - Removed 9 redundant tables"
echo "  - Migrated all permissions to role-based model"
echo "  - Updated code to use environment variables"
echo "  - Simplified from 16 to 7 permission tables"
echo ""
echo "🔍 Next steps:"
echo "  1. Run tests to verify permissions work correctly"
echo "  2. Deploy to staging environment"
echo "  3. Monitor for any permission issues"
echo ""
echo "📋 Removed tables:"
echo "  - EmergencyAccess & EmergencyAudit"
echo "  - PermissionSet, PermissionSetItem, RolePermissionSet"
echo "  - PermissionInheritance"
echo "  - PermissionExpansion"
echo "  - RBACConfig"
echo "  - UserPermission"
echo ""
echo "✅ Your RBAC system is now 56% simpler and follows best practices!"