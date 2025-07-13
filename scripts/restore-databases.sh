#!/bin/bash

# restore-databases.sh - Restore Docker database volumes from backups
# This script restores your Docker databases from backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Function to list available backups
list_backups() {
    echo -e "${YELLOW}Available backups:${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        ls -1d "$BACKUP_DIR"/20* 2>/dev/null | sort -r | head -20 || echo "No backups found"
        if [ -L "$BACKUP_DIR/latest" ]; then
            echo -e "\n${GREEN}Latest backup: $(readlink $BACKUP_DIR/latest)${NC}"
        fi
    else
        echo -e "${RED}Backup directory does not exist: $BACKUP_DIR${NC}"
        exit 1
    fi
}

# Function to restore PostgreSQL
restore_postgres() {
    local container=$1
    local backup_file=$2
    
    echo -e "${YELLOW}Restoring PostgreSQL from: $backup_file${NC}"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${RED}✗ Container $container is not running. Please start it first.${NC}"
        return 1
    fi
    
    # Decompress and restore
    if [ -f "$backup_file" ]; then
        echo "Stopping all connections to database..."
        docker exec -t "$container" psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();" || true
        
        echo "Restoring database..."
        gunzip -c "$backup_file" | docker exec -i "$container" psql -U postgres
        
        echo -e "${GREEN}✓ PostgreSQL restore completed${NC}"
    else
        echo -e "${RED}✗ Backup file not found: $backup_file${NC}"
        return 1
    fi
}

# Function to restore Redis
restore_redis() {
    local container=$1
    local backup_file=$2
    
    echo -e "${YELLOW}Restoring Redis from: $backup_file${NC}"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${RED}✗ Container $container is not running. Please start it first.${NC}"
        return 1
    fi
    
    if [ -f "$backup_file" ]; then
        # Stop Redis persistence temporarily
        docker exec -t "$container" redis-cli CONFIG SET save ""
        
        # Copy backup file to container
        gunzip -c "$backup_file" > /tmp/redis_restore.rdb
        docker cp /tmp/redis_restore.rdb "${container}:/data/dump.rdb"
        rm /tmp/redis_restore.rdb
        
        # Restart Redis to load the backup
        echo "Restarting Redis to load backup..."
        docker restart "$container"
        
        # Wait for Redis to be ready
        echo "Waiting for Redis to be ready..."
        sleep 5
        
        # Re-enable persistence
        docker exec -t "$container" redis-cli CONFIG SET save "900 1 300 10 60 10000"
        docker exec -t "$container" redis-cli CONFIG SET appendonly yes
        
        echo -e "${GREEN}✓ Redis restore completed${NC}"
    else
        echo -e "${RED}✗ Backup file not found: $backup_file${NC}"
        return 1
    fi
}

# Function to restore volume
restore_volume() {
    local volume_name=$1
    local backup_file=$2
    
    echo -e "${YELLOW}Restoring volume $volume_name from: $backup_file${NC}"
    
    if [ -f "$backup_file" ]; then
        # Create volume if it doesn't exist
        docker volume create "$volume_name" 2>/dev/null || true
        
        # Clear existing data and restore
        docker run --rm -v "${volume_name}:/volume" -v "$(dirname $backup_file):/backup" \
            alpine sh -c "rm -rf /volume/* /volume/..?* /volume/.[!.]* 2>/dev/null || true; tar xzf /backup/$(basename $backup_file) -C /volume"
        
        echo -e "${GREEN}✓ Volume restore completed${NC}"
    else
        echo -e "${RED}✗ Backup file not found: $backup_file${NC}"
        return 1
    fi
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    list_backups
    echo -e "\n${YELLOW}Usage: $0 <backup_timestamp|latest> [service]${NC}"
    echo "Examples:"
    echo "  $0 latest                    # Restore all services from latest backup"
    echo "  $0 20240115_120000          # Restore from specific backup"
    echo "  $0 latest postgres          # Restore only PostgreSQL"
    echo "  $0 latest redis             # Restore only Redis"
    exit 0
fi

BACKUP_TIMESTAMP=$1
SERVICE_FILTER=${2:-all}

# Resolve 'latest' symlink
if [ "$BACKUP_TIMESTAMP" = "latest" ]; then
    if [ -L "$BACKUP_DIR/latest" ]; then
        BACKUP_TIMESTAMP=$(readlink "$BACKUP_DIR/latest")
        echo -e "${GREEN}Using latest backup: $BACKUP_TIMESTAMP${NC}"
    else
        echo -e "${RED}No 'latest' backup found${NC}"
        exit 1
    fi
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_TIMESTAMP"

if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${RED}Backup not found: $BACKUP_PATH${NC}"
    list_backups
    exit 1
fi

# Show backup info
if [ -f "$BACKUP_PATH/backup_metadata.json" ]; then
    echo -e "${YELLOW}Backup information:${NC}"
    cat "$BACKUP_PATH/backup_metadata.json" | grep -E '"date"|"timestamp"'
fi

# Confirm restore
echo -e "\n${YELLOW}This will restore data from: $BACKUP_PATH${NC}"
echo -e "${RED}WARNING: This will overwrite existing data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Main restore process
echo -e "\n${GREEN}=== Starting Database Restore ===${NC}"

case "$SERVICE_FILTER" in
    postgres|postgresql)
        restore_postgres "mono-postgres-1" "$BACKUP_PATH/postgres_main_${BACKUP_TIMESTAMP}.sql.gz"
        ;;
    redis)
        restore_redis "mono-redis-1" "$BACKUP_PATH/redis_${BACKUP_TIMESTAMP}.rdb.gz"
        ;;
    all)
        # Restore all services
        restore_postgres "mono-postgres-1" "$BACKUP_PATH/postgres_main_${BACKUP_TIMESTAMP}.sql.gz" || true
        restore_redis "mono-redis-1" "$BACKUP_PATH/redis_${BACKUP_TIMESTAMP}.rdb.gz" || true
        
        # Restore other volumes
        for volume_backup in "$BACKUP_PATH"/*.tar.gz; do
            if [ -f "$volume_backup" ]; then
                basename=$(basename "$volume_backup")
                service_name=$(echo "$basename" | cut -d'_' -f1)
                
                case "$service_name" in
                    rabbitmq)
                        restore_volume "mono_rabbitmq_data" "$volume_backup" || true
                        ;;
                    n8n)
                        restore_volume "mono_n8n_data" "$volume_backup" || true
                        ;;
                    temporal)
                        restore_volume "mono_temporal_data" "$volume_backup" || true
                        ;;
                    grafana)
                        restore_volume "mono_grafana_data" "$volume_backup" || true
                        ;;
                    prometheus)
                        restore_volume "mono_prometheus_data" "$volume_backup" || true
                        ;;
                esac
            fi
        done
        ;;
    *)
        echo -e "${RED}Unknown service: $SERVICE_FILTER${NC}"
        echo "Valid services: postgres, redis, all"
        exit 1
        ;;
esac

echo -e "\n${GREEN}=== Restore completed successfully ===${NC}"
echo -e "${YELLOW}Note: You may need to restart your services for changes to take effect${NC}"
echo "Run: docker-compose restart"