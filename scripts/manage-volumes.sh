#!/bin/bash

# manage-volumes.sh - Docker volume management utility
# Provides safe operations for Docker volumes with data preservation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Show usage
usage() {
    echo -e "${BLUE}Docker Volume Management Utility${NC}"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  list                    List all project volumes with sizes"
    echo "  backup [volume]         Backup specific volume or all volumes"
    echo "  restore <volume>        Restore specific volume from backup"
    echo "  migrate-to-host         Migrate volumes to host directory mounts"
    echo "  migrate-to-volumes      Migrate host mounts back to Docker volumes"
    echo "  protect                 Set up volume protection (prevent accidental deletion)"
    echo "  check-health            Check health of all volumes and databases"
    echo "  export <volume> <file>  Export volume to tar file"
    echo "  import <volume> <file>  Import volume from tar file"
    echo "  clone <source> <dest>   Clone a volume"
    echo "  size [volume]           Show size of volumes"
    echo
    echo "Options:"
    echo "  -h, --help             Show this help message"
    echo
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 backup postgres_data"
    echo "  $0 restore postgres_data"
    echo "  $0 migrate-to-host"
    echo "  $0 check-health"
}

# Get project prefix from docker-compose
get_project_prefix() {
    local prefix=$(docker-compose config | grep -E "^name:" | cut -d' ' -f2 || echo "mono")
    echo "$prefix"
}

# List volumes with details
list_volumes() {
    echo -e "${BLUE}=== Project Volumes ===${NC}"
    local prefix=$(get_project_prefix)
    
    echo -e "\n${YELLOW}Docker Volumes:${NC}"
    docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" | grep -E "^${prefix}_|^VOLUME" || true
    
    echo -e "\n${YELLOW}Volume Details:${NC}"
    for volume in $(docker volume ls --format "{{.Name}}" | grep "^${prefix}_"); do
        local size=$(docker run --rm -v "$volume:/data" alpine du -sh /data 2>/dev/null | cut -f1 || echo "N/A")
        local mount=$(docker volume inspect "$volume" --format '{{.Mountpoint}}' 2>/dev/null || echo "N/A")
        echo -e "${GREEN}$volume${NC}"
        echo "  Size: $size"
        echo "  Mount: $mount"
    done
}

# Backup specific volume
backup_volume() {
    local volume=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="./volume-backups"
    
    mkdir -p "$backup_dir"
    
    if [ -z "$volume" ]; then
        echo -e "${YELLOW}Backing up all volumes...${NC}"
        ./scripts/backup-databases.sh
    else
        echo -e "${YELLOW}Backing up volume: $volume${NC}"
        local backup_file="$backup_dir/${volume}_${timestamp}.tar.gz"
        
        docker run --rm -v "$volume:/data" -v "$PWD/$backup_dir:/backup" \
            alpine tar czf "/backup/$(basename $backup_file)" -C /data .
        
        echo -e "${GREEN}✓ Backup created: $backup_file${NC}"
    fi
}

# Check volume and database health
check_health() {
    echo -e "${BLUE}=== Volume Health Check ===${NC}"
    
    # Check PostgreSQL
    echo -e "\n${YELLOW}PostgreSQL Status:${NC}"
    if docker ps --format '{{.Names}}' | grep -q "postgres"; then
        docker exec -t $(docker ps --format '{{.Names}}' | grep postgres | head -1) \
            psql -U postgres -c "SELECT current_database(), pg_database_size(current_database()) as size;" || echo "Failed to connect"
    else
        echo -e "${RED}PostgreSQL container not running${NC}"
    fi
    
    # Check Redis
    echo -e "\n${YELLOW}Redis Status:${NC}"
    if docker ps --format '{{.Names}}' | grep -q "redis"; then
        docker exec -t $(docker ps --format '{{.Names}}' | grep redis | head -1) \
            redis-cli INFO server | grep -E "redis_version|uptime_in_days" || echo "Failed to connect"
    else
        echo -e "${RED}Redis container not running${NC}"
    fi
    
    # Check volume integrity
    echo -e "\n${YELLOW}Volume Integrity:${NC}"
    local prefix=$(get_project_prefix)
    for volume in $(docker volume ls --format "{{.Name}}" | grep "^${prefix}_"); do
        if docker volume inspect "$volume" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $volume - OK${NC}"
        else
            echo -e "${RED}✗ $volume - ERROR${NC}"
        fi
    done
}

# Migrate volumes to host directory mounts
migrate_to_host() {
    echo -e "${BLUE}=== Migrating to Host Mounts ===${NC}"
    echo -e "${YELLOW}This will migrate Docker volumes to host directory mounts${NC}"
    echo -e "${RED}WARNING: This requires updating docker-compose.yml manually${NC}"
    
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Migration cancelled"
        return
    fi
    
    # Create host directories
    echo -e "\n${YELLOW}Creating host directories...${NC}"
    mkdir -p ./data/{postgres,redis,rabbitmq,n8n,temporal,grafana,prometheus}
    
    # Backup current volumes
    echo -e "\n${YELLOW}Backing up current volumes...${NC}"
    ./scripts/backup-databases.sh
    
    echo -e "\n${GREEN}Host directories created in ./data/${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update docker-compose.yml to use host mounts:"
    echo "   Example:"
    echo "   postgres:"
    echo "     volumes:"
    echo "       - ./data/postgres:/var/lib/postgresql/data"
    echo
    echo "2. Stop services: docker-compose down"
    echo "3. Start services: docker-compose up -d"
    echo "4. Restore data: ./scripts/restore-databases.sh latest"
}

# Export volume to file
export_volume() {
    local volume=$1
    local output=$2
    
    if [ -z "$volume" ] || [ -z "$output" ]; then
        echo -e "${RED}Usage: $0 export <volume> <output-file>${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Exporting volume $volume to $output${NC}"
    docker run --rm -v "$volume:/data" -v "$PWD:/backup" \
        alpine tar czf "/backup/$output" -C /data .
    
    echo -e "${GREEN}✓ Volume exported to $output${NC}"
}

# Import volume from file
import_volume() {
    local volume=$1
    local input=$2
    
    if [ -z "$volume" ] || [ -z "$input" ]; then
        echo -e "${RED}Usage: $0 import <volume> <input-file>${NC}"
        return 1
    fi
    
    if [ ! -f "$input" ]; then
        echo -e "${RED}File not found: $input${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Importing $input to volume $volume${NC}"
    
    # Create volume if it doesn't exist
    docker volume create "$volume" 2>/dev/null || true
    
    # Clear and import
    docker run --rm -v "$volume:/data" -v "$PWD:/backup" \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/$input -C /data"
    
    echo -e "${GREEN}✓ Volume imported from $input${NC}"
}

# Clone a volume
clone_volume() {
    local source=$1
    local dest=$2
    
    if [ -z "$source" ] || [ -z "$dest" ]; then
        echo -e "${RED}Usage: $0 clone <source-volume> <dest-volume>${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Cloning volume $source to $dest${NC}"
    
    # Create destination volume
    docker volume create "$dest" 2>/dev/null || true
    
    # Copy data
    docker run --rm -v "$source:/source:ro" -v "$dest:/dest" \
        alpine cp -av /source/. /dest/
    
    echo -e "${GREEN}✓ Volume cloned successfully${NC}"
}

# Show volume sizes
show_sizes() {
    local volume=$1
    local prefix=$(get_project_prefix)
    
    echo -e "${BLUE}=== Volume Sizes ===${NC}"
    
    if [ -z "$volume" ]; then
        # Show all volumes
        for vol in $(docker volume ls --format "{{.Name}}" | grep "^${prefix}_"); do
            local size=$(docker run --rm -v "$vol:/data" alpine du -sh /data 2>/dev/null | cut -f1 || echo "N/A")
            printf "%-30s %s\n" "$vol" "$size"
        done
    else
        # Show specific volume
        local size=$(docker run --rm -v "$volume:/data" alpine du -sh /data 2>/dev/null | cut -f1 || echo "N/A")
        echo "$volume: $size"
    fi
}

# Protect volumes setup
protect_volumes() {
    echo -e "${BLUE}=== Volume Protection Setup ===${NC}"
    echo -e "${YELLOW}Setting up protection against accidental volume deletion${NC}"
    
    # Create wrapper script
    cat > ./scripts/docker-compose-safe.sh << 'EOF'
#!/bin/bash
# Safe docker-compose wrapper that prevents volume deletion

if [[ "$*" == *"-v"* ]] && [[ "$1" == "down" ]]; then
    echo -e "\033[0;31mERROR: Refusing to run 'docker-compose down -v' as it would delete volumes!\033[0m"
    echo "Use 'docker-compose down' instead (without -v flag)"
    echo "To force volume deletion, use Docker commands directly"
    exit 1
fi

# Pass through to docker-compose
docker-compose "$@"
EOF
    
    chmod +x ./scripts/docker-compose-safe.sh
    
    echo -e "${GREEN}✓ Protection script created: ./scripts/docker-compose-safe.sh${NC}"
    echo
    echo "To use protected commands:"
    echo "  alias docker-compose='./scripts/docker-compose-safe.sh'"
    echo
    echo "Or add to your shell profile:"
    echo "  echo \"alias docker-compose='$PWD/scripts/docker-compose-safe.sh'\" >> ~/.bashrc"
}

# Main command handler
case "${1:-help}" in
    list)
        list_volumes
        ;;
    backup)
        backup_volume "$2"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}Please specify volume to restore${NC}"
            exit 1
        fi
        ./scripts/restore-databases.sh latest
        ;;
    migrate-to-host)
        migrate_to_host
        ;;
    check-health|health)
        check_health
        ;;
    export)
        export_volume "$2" "$3"
        ;;
    import)
        import_volume "$2" "$3"
        ;;
    clone)
        clone_volume "$2" "$3"
        ;;
    size|sizes)
        show_sizes "$2"
        ;;
    protect)
        protect_volumes
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac