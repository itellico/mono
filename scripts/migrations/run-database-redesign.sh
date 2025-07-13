#!/bin/bash

# Database Redesign Migration Runner
# Created: 2025-01-12
# This script runs all database normalization migrations in the correct order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="${DB_HOST:-192.168.178.94}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mono}"
DB_USER="${DB_USER:-developer}"
DB_PASS="${DB_PASS:-developer}"

# Export for psql to use
export PGPASSWORD="$DB_PASS"

# Function to run a migration
run_migration() {
    local migration_file=$1
    local description=$2
    
    echo -e "${BLUE}Running migration: ${description}${NC}"
    echo "File: $migration_file"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        echo -e "${GREEN}✓ Success${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}\n"
        return 1
    fi
}

# Function to check if migrations have already been applied
check_migration_status() {
    echo -e "${BLUE}Checking migration status...${NC}"
    
    # Check if user_preferences table exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences'" | grep -q 1; then
        echo -e "${YELLOW}Warning: user_preferences table already exists. Some migrations may have been applied.${NC}"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Main execution
echo -e "${GREEN}=== Database Redesign Migration ===${NC}"
echo "Target: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo

# Check connection
echo -e "${BLUE}Testing database connection...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected successfully${NC}\n"
else
    echo -e "${RED}✗ Failed to connect to database${NC}"
    exit 1
fi

# Check migration status
check_migration_status

# Confirm before proceeding
echo -e "${YELLOW}This will apply the following migrations:${NC}"
echo "1. Create user_preferences table"
echo "2. Migrate user preferences from accounts table"
echo "3. Convert users.account_role from TEXT to foreign key"
echo "4. Remove boolean permission columns and use RBAC"
echo
read -p "Proceed with database redesign? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Create backup
echo -e "\n${BLUE}Creating database backup...${NC}"
BACKUP_FILE="mono_backup_$(date +%Y%m%d_%H%M%S).sql"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/tmp/$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Backup saved to /tmp/$BACKUP_FILE${NC}\n"
else
    echo -e "${RED}✗ Backup failed. Aborting migration.${NC}"
    exit 1
fi

# Run migrations in order
echo -e "${GREEN}Starting migrations...${NC}\n"

MIGRATION_DIR="$(dirname "$0")"
FAILED=0

# Migration 1: Create user_preferences table
if ! run_migration "$MIGRATION_DIR/01-create-user-preferences-table.sql" "Create user_preferences table"; then
    FAILED=1
fi

# Migration 2: Migrate user preferences data
if [ $FAILED -eq 0 ]; then
    if ! run_migration "$MIGRATION_DIR/02-migrate-user-preferences-data.sql" "Migrate user preferences data"; then
        FAILED=1
    fi
fi

# Migration 3: Convert account_role to foreign key
if [ $FAILED -eq 0 ]; then
    if ! run_migration "$MIGRATION_DIR/03-convert-account-role-to-fk.sql" "Convert account_role to foreign key"; then
        FAILED=1
    fi
fi

# Migration 4: Remove boolean permissions
if [ $FAILED -eq 0 ]; then
    if ! run_migration "$MIGRATION_DIR/04-remove-boolean-permissions.sql" "Remove boolean permissions"; then
        FAILED=1
    fi
fi

# Summary
echo -e "\n${GREEN}=== Migration Summary ===${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
    echo
    echo "Next steps:"
    echo "1. Update application code to use new schema"
    echo "2. Test thoroughly"
    echo "3. Run final cleanup migrations to drop deprecated columns"
    echo
    echo "Rollback scripts available in: $MIGRATION_DIR/rollback/"
else
    echo -e "${RED}✗ Some migrations failed!${NC}"
    echo
    echo "To rollback, run the scripts in: $MIGRATION_DIR/rollback/"
    echo "Database backup available at: /tmp/$BACKUP_FILE"
    exit 1
fi

# Cleanup
unset PGPASSWORD