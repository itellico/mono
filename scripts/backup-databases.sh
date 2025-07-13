#!/bin/bash

# backup-databases.sh - Backup all Docker database volumes
# This script creates persistent backups of your Docker databases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Docker command path (macOS with Docker Desktop)
DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
# Fallback to system docker if available
if ! command -v "$DOCKER" &> /dev/null; then
    DOCKER="docker"
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_SUBDIR="$BACKUP_DIR/$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_SUBDIR"

echo -e "${GREEN}Starting database backup to $BACKUP_SUBDIR${NC}"

# Function to backup PostgreSQL
backup_postgres() {
    local container=$1
    local db_name=$2
    local backup_file="$BACKUP_SUBDIR/postgres_${db_name}_${TIMESTAMP}.sql"
    
    echo -e "${YELLOW}Backing up PostgreSQL database: $db_name${NC}"
    
    # Check if container is running
    if $DOCKER ps --format '{{.Names}}' | grep -q "^${container}$"; then
        # Backup all databases in the PostgreSQL instance
        # Use correct user based on container
        if [[ "$container" == "mono-postgres" ]]; then
            $DOCKER exec -t "$container" pg_dumpall -U developer > "$backup_file"
        else
            $DOCKER exec -t "$container" pg_dumpall -U postgres > "$backup_file"
        fi
        
        # Compress the backup
        gzip "$backup_file"
        echo -e "${GREEN}✓ PostgreSQL backup completed: ${backup_file}.gz${NC}"
    else
        echo -e "${RED}✗ Container $container is not running${NC}"
        return 1
    fi
}

# Function to backup Redis
backup_redis() {
    local container=$1
    local redis_name=${container#mono-}  # Remove 'mono-' prefix
    local backup_file="$BACKUP_SUBDIR/redis_${redis_name}_${TIMESTAMP}.rdb"
    
    echo -e "${YELLOW}Backing up Redis database${NC}"
    
    # Check if container is running
    if $DOCKER ps --format '{{.Names}}' | grep -q "^${container}$"; then
        # Try to trigger a background save
        BGSAVE_RESULT=$($DOCKER exec -t "$container" redis-cli BGSAVE 2>&1 || true)
        
        # Check if background save is already in progress
        if echo "$BGSAVE_RESULT" | grep -q "Background save already in progress"; then
            echo "Background save already in progress, waiting..."
        else
            echo "Background save initiated"
        fi
        
        # For Redis, we'll just wait a moment for the save to start
        # then copy whatever dump.rdb exists
        sleep 2
        
        # Copy the dump file
        $DOCKER cp "${container}:/data/dump.rdb" "$backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        echo -e "${GREEN}✓ Redis backup completed: ${backup_file}.gz${NC}"
    else
        echo -e "${RED}✗ Container $container is not running${NC}"
        return 1
    fi
}

# Function to backup volume directly
backup_volume() {
    local volume_name=$1
    local backup_name=$2
    local backup_file="$BACKUP_SUBDIR/${backup_name}_${TIMESTAMP}.tar"
    
    echo -e "${YELLOW}Backing up volume: $volume_name${NC}"
    
    # Check if volume exists
    if $DOCKER volume ls --format '{{.Name}}' | grep -q "^${volume_name}$"; then
        # Check if alpine image exists locally, if not skip volume backup
        if ! $DOCKER images alpine -q | grep -q .; then
            echo -e "${YELLOW}⚠ Alpine image not available, skipping volume backup for $volume_name${NC}"
            return 0
        fi
        
        # Create a temporary container to access the volume
        $DOCKER run --rm -v "${volume_name}:/volume" -v "$BACKUP_SUBDIR:/backup" \
            alpine tar czf "/backup/${backup_name}_${TIMESTAMP}.tar.gz" -C /volume . 2>/dev/null || {
            echo -e "${YELLOW}⚠ Volume backup failed for $volume_name, skipping${NC}"
            return 0
        }
        
        echo -e "${GREEN}✓ Volume backup completed: ${backup_file}.gz${NC}"
    else
        echo -e "${RED}✗ Volume $volume_name does not exist${NC}"
        return 1
    fi
}

# Main backup process
echo -e "${GREEN}=== Starting Database Backups ===${NC}"

# Backup main PostgreSQL (includes mono, temporal, and kanboard databases)
backup_postgres "mono-postgres" "main" || true

# Backup test PostgreSQL (if running)
backup_postgres "mono-test-postgres" "test" || true

# Backup main Redis
backup_redis "mono-redis" || true

# Backup test Redis (if running)
backup_redis "mono-test-redis" || true

# Backup other important volumes
backup_volume "mono_rabbitmq_data" "rabbitmq" || true
backup_volume "mono_n8n_data" "n8n" || true
backup_volume "mono_temporal_data" "temporal" || true
backup_volume "mono_grafana_data" "grafana" || true
backup_volume "mono_prometheus_data" "prometheus" || true

# Create a metadata file
cat > "$BACKUP_SUBDIR/backup_metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date)",
  "docker_compose_files": [
    "docker-compose.yml",
    "docker-compose.test.yml",
    "docker-compose.services.yml",
    "docker-compose.prod.yml",
    "docker-compose.optimized.yml"
  ],
  "backed_up_services": [
    "postgresql (main: mono, temporal, kanboard databases)",
    "postgresql-test (test database)",
    "redis (main cache)",
    "redis-test (test cache)",
    "rabbitmq",
    "n8n",
    "temporal",
    "grafana",
    "prometheus"
  ],
  "databases": {
    "main_postgres": {
      "container": "mono-postgres",
      "databases": ["mono", "temporal", "kanboard"],
      "port": 5432
    },
    "test_postgres": {
      "container": "mono-test-postgres",
      "databases": ["mono_test"],
      "port": 5433
    },
    "main_redis": {
      "container": "mono-redis",
      "port": 6379
    },
    "test_redis": {
      "container": "mono-test-redis",
      "port": 6380
    }
  },
  "special_notes": {
    "kanboard": "Kanboard uses the 'kanboard' database in main PostgreSQL container",
    "test_databases": "Test databases use tmpfs (RAM) for speed",
    "grafana": "Includes dashboards, datasources, users, and all custom configurations (grafana.db)",
    "prometheus": "Includes all metrics data, WAL files, and time series database",
    "n8n": "Includes all workflows, credentials, and automation configurations",
    "rabbitmq": "Includes message queues, exchanges, and broker configurations",
    "temporal": "Includes workflow states and temporal service data"
  }
}
EOF

# Create latest symlink
ln -sfn "$TIMESTAMP" "$BACKUP_DIR/latest"

echo -e "${GREEN}=== Backup completed successfully ===${NC}"
echo -e "${GREEN}Backup location: $BACKUP_SUBDIR${NC}"
echo -e "${GREEN}Latest backup: $BACKUP_DIR/latest${NC}"

# Show backup sizes
echo -e "\n${YELLOW}Backup sizes:${NC}"
du -sh "$BACKUP_SUBDIR"/*

# Cleanup old backups (keep last 7 days by default)
KEEP_DAYS="${KEEP_DAYS:-7}"
echo -e "\n${YELLOW}Cleaning up backups older than $KEEP_DAYS days${NC}"
find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" -mtime +$KEEP_DAYS -exec rm -rf {} \; || true

echo -e "\n${GREEN}✓ All done!${NC}"