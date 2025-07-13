#!/bin/bash

echo "=== Kanboard SQLite to PostgreSQL Migration ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
SQLITE_DB="/Users/mm2/dev_mm/mono/php/kanboard/data/db.sqlite"
BACKUP_DIR="/Users/mm2/dev_mm/mono/backups/kanboard/$(date +%Y%m%d_%H%M%S)"
CONFIG_FILE="/Users/mm2/dev_mm/mono/php/kanboard/config.php"

# Step 1: Check if SQLite database exists
if [ ! -f "$SQLITE_DB" ]; then
    echo -e "${RED}ERROR: SQLite database not found at: $SQLITE_DB${NC}"
    exit 1
fi

# Step 2: Create backup directory
echo -e "${YELLOW}Step 1: Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup SQLite database
cp "$SQLITE_DB" "$BACKUP_DIR/db.sqlite.backup"
echo -e "${GREEN}✓ SQLite database backed up to: $BACKUP_DIR/db.sqlite.backup${NC}"

# Backup current config
cp "$CONFIG_FILE" "$BACKUP_DIR/config.php.backup"
echo -e "${GREEN}✓ Config file backed up${NC}"

# Step 3: Check PostgreSQL connection
echo ""
echo -e "${YELLOW}Step 2: Checking PostgreSQL connection...${NC}"
PGPASSWORD=developer psql -h localhost -U developer -d kanboard -c '\q' 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Cannot connect to PostgreSQL kanboard database${NC}"
    echo "Make sure Docker containers are running: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"

# Step 4: Run the migration
echo ""
echo -e "${YELLOW}Step 3: Running migration...${NC}"
php /Users/mm2/dev_mm/mono/scripts/migrate-kanboard-sqlite-to-postgres.php

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== Migration Completed Successfully! ===${NC}"
    echo ""
    echo "Next steps:"
    echo "1. The config files have already been updated to use PostgreSQL"
    echo "2. Restart your containers to apply changes:"
    echo "   docker-compose restart php nginx-kanboard"
    echo "3. Test Kanboard at: http://localhost:4041"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo ""
    echo "If you need to rollback:"
    echo "1. cp $BACKUP_DIR/config.php.backup $CONFIG_FILE"
    echo "2. cp $BACKUP_DIR/db.sqlite.backup $SQLITE_DB"
    echo "3. docker-compose restart php nginx-kanboard"
else
    echo ""
    echo -e "${RED}=== Migration Failed ===${NC}"
    echo "The backup is available at: $BACKUP_DIR"
    echo "No changes were made to your configuration."
fi