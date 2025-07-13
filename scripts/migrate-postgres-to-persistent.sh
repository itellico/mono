#!/bin/bash

echo "=== Migrating PostgreSQL to Persistent Storage ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Paths
BACKUP_DIR="/Users/mm2/dev_mm/mono/backups/postgres/$(date +%Y%m%d_%H%M%S)"
PERSISTENT_DIR="/Users/mm2/dev_mm/mono/docker-data/databases/postgres/data"

# Step 1: Create backup
echo -e "${YELLOW}Step 1: Creating PostgreSQL backup...${NC}"
mkdir -p "$BACKUP_DIR"

# Dump all databases
docker-compose -f docker-compose.yml -f docker-compose.volumes.yml exec -T postgres pg_dumpall -U developer > "$BACKUP_DIR/all_databases.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR/all_databases.sql${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Step 2: Stop containers
echo -e "${YELLOW}Step 2: Stopping containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.volumes.yml down

# Step 3: Clear persistent directory
echo -e "${YELLOW}Step 3: Preparing persistent storage...${NC}"
sudo rm -rf "$PERSISTENT_DIR"/*
mkdir -p "$PERSISTENT_DIR"

# Step 4: Start with persistent volumes
echo -e "${YELLOW}Step 4: Starting PostgreSQL with persistent storage...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.volumes.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
sleep 10

# Step 5: Restore databases
echo -e "${YELLOW}Step 5: Restoring databases...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.volumes.yml exec -T postgres psql -U developer < "$BACKUP_DIR/all_databases.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Databases restored successfully!${NC}"
else
    echo -e "${RED}✗ Restore failed!${NC}"
    exit 1
fi

# Step 6: Start all services
echo -e "${YELLOW}Step 6: Starting all services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.volumes.yml up -d

echo ""
echo -e "${GREEN}=== Migration Complete! ===${NC}"
echo ""
echo "PostgreSQL data is now stored at:"
echo "  $PERSISTENT_DIR"
echo ""
echo "Backup available at:"
echo "  $BACKUP_DIR"
echo ""
echo "Verify with:"
echo "  ls -la $PERSISTENT_DIR"