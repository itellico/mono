#!/bin/bash

# Database Schema Deployment Checklist Script
# This script guides through the deployment process with validation at each step

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-mono_prod}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MIGRATION_DIR="${MIGRATION_DIR:-./scripts/migrations}"

# Helper functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

confirm() {
    read -p "$(echo -e ${YELLOW}"$1 (y/N): "${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        exit 1
    fi
}

# Pre-flight checks
print_header "Pre-flight Checks"

check_command psql
check_command redis-cli
check_command pnpm
check_command docker

# Check database connectivity
if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" &> /dev/null; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database"
    exit 1
fi

# Check Redis connectivity
if redis-cli ping &> /dev/null; then
    print_success "Redis connection successful"
else
    print_error "Cannot connect to Redis"
    exit 1
fi

# Phase 1: Backup
print_header "Phase 1: Database Backup"

mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

if confirm "Create database backup?"; then
    echo "Creating backup..."
    if pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
        print_success "Backup created: $BACKUP_FILE"
        echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    else
        print_error "Backup failed"
        exit 1
    fi
else
    print_warning "Skipping backup (not recommended for production)"
fi

# Phase 2: Test Environment Validation
print_header "Phase 2: Test Environment Validation"

if confirm "Run test suite?"; then
    echo "Running schema validation tests..."
    pnpm test test/database/schema-validation.spec.ts || {
        print_error "Schema validation tests failed"
        exit 1
    }
    print_success "Schema validation tests passed"

    echo "Running integration tests..."
    pnpm test test/integration/schema-migration.test.ts || {
        print_error "Integration tests failed"
        exit 1
    }
    print_success "Integration tests passed"
else
    print_warning "Skipping tests"
fi

# Phase 3: Migration Scripts
print_header "Phase 3: Database Migration"

if confirm "Apply database migrations?"; then
    # Check migration files exist
    MIGRATIONS=(
        "01-add-uuid-fields.sql"
        "02-add-indexes.sql"
        "03-add-audit-tables.sql"
        "04-add-permission-tables.sql"
        "05-reorder-columns.sql"
        "06-add-constraints.sql"
    )

    for migration in "${MIGRATIONS[@]}"; do
        if [ ! -f "$MIGRATION_DIR/$migration" ]; then
            print_error "Migration file missing: $migration"
            exit 1
        fi
    done

    # Apply migrations
    for migration in "${MIGRATIONS[@]}"; do
        echo "Applying $migration..."
        if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/$migration"; then
            print_success "$migration applied successfully"
        else
            print_error "$migration failed"
            
            if confirm "Rollback and restore from backup?"; then
                echo "Restoring from backup..."
                psql -h $DB_HOST -U $DB_USER -d $DB_NAME < $BACKUP_FILE
                print_success "Database restored"
            fi
            exit 1
        fi
    done

    # Run Prisma migrations
    echo "Running Prisma migrations..."
    if pnpm prisma migrate deploy; then
        print_success "Prisma migrations completed"
    else
        print_error "Prisma migrations failed"
        exit 1
    fi
else
    print_warning "Skipping migrations"
fi

# Phase 4: Data Migration
print_header "Phase 4: Data Migration"

if confirm "Populate UUID fields for existing data?"; then
    echo "Running UUID population script..."
    if pnpm tsx scripts/migrations/populate-uuids.ts; then
        print_success "UUIDs populated successfully"
        
        # Verify
        MISSING=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE uuid IS NULL")
        if [ "$MISSING" -eq "0" ]; then
            print_success "All users have UUIDs"
        else
            print_warning "$MISSING users still missing UUIDs"
        fi
    else
        print_error "UUID population failed"
        exit 1
    fi
else
    print_warning "Skipping UUID population"
fi

# Phase 5: Cache Warming
print_header "Phase 5: Cache Initialization"

if confirm "Warm permission cache?"; then
    echo "Warming cache..."
    if pnpm tsx scripts/migrations/warm-permission-cache.ts; then
        print_success "Cache warmed successfully"
        
        # Verify
        CACHE_KEYS=$(redis-cli KEYS "perm:*" | wc -l)
        print_success "Created $CACHE_KEYS cache entries"
    else
        print_error "Cache warming failed"
    fi
else
    print_warning "Skipping cache warming"
fi

# Phase 6: Performance Validation
print_header "Phase 6: Performance Validation"

if confirm "Run performance validation?"; then
    echo "Running performance benchmarks..."
    if pnpm tsx test/performance/database-benchmarks.ts; then
        print_success "Performance benchmarks completed"
    else
        print_warning "Performance benchmarks had issues"
    fi
    
    echo "Validating production performance..."
    if pnpm tsx scripts/validate-production-performance.ts; then
        print_success "Production validation passed"
    else
        print_warning "Production validation had warnings"
    fi
else
    print_warning "Skipping performance validation"
fi

# Phase 7: Final Checks
print_header "Phase 7: Final Validation"

echo "Checking database schema..."

# Check critical tables have UUID
TABLES_WITH_UUID=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(DISTINCT table_name) 
    FROM information_schema.columns 
    WHERE column_name = 'uuid' 
    AND table_name IN ('users', 'accounts', 'tenants', 'roles', 'permissions')
")

if [ "$TABLES_WITH_UUID" -eq "5" ]; then
    print_success "All critical tables have UUID fields"
else
    print_error "Some tables missing UUID fields"
fi

# Check audit tables
AUDIT_TABLES=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_name LIKE 'audit_logs%'
")

if [ "$AUDIT_TABLES" -gt "0" ]; then
    print_success "Audit tables created ($AUDIT_TABLES partitions)"
else
    print_error "Audit tables not found"
fi

# Check indexes
INDEX_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE indexname LIKE '%uuid%'
")

print_success "Created $INDEX_COUNT UUID indexes"

# Summary
print_header "Deployment Summary"

echo -e "${GREEN}Deployment checklist completed!${NC}\n"
echo "Next steps:"
echo "1. Monitor application logs for errors"
echo "2. Check Grafana dashboards for performance metrics"
echo "3. Verify audit logs are being created"
echo "4. Test critical user flows"
echo "5. Keep backup for at least 7 days"

echo -e "\n${YELLOW}Important:${NC}"
echo "- Backup location: $BACKUP_FILE"
echo "- Monitor UUID lookup performance (target <10ms P95)"
echo "- Check cache hit rate (target >90%)"
echo "- Review audit log growth rate"

if confirm "Mark deployment as complete?"; then
    echo "$(date): Deployment completed successfully" >> deployment.log
    print_success "Deployment marked as complete"
else
    print_warning "Deployment not marked as complete"
fi

echo -e "\n${BLUE}Deployment checklist finished!${NC}"