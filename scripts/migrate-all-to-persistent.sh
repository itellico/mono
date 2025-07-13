#!/bin/bash

# ============================================
# Complete Docker Persistence Migration
# For both mono and mono-test environments
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Complete Docker Persistence Migration ===${NC}"
echo ""

# Timestamp for backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/Users/mm2/dev_mm/mono/backups/full-migration/$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_ROOT"

# ============================================
# STEP 1: Backup Everything
# ============================================
echo -e "${YELLOW}Step 1: Creating complete backups...${NC}"

# Backup all databases
echo "Backing up PostgreSQL databases..."
mkdir -p "$BACKUP_ROOT/postgres"

# Production databases
docker-compose exec -T postgres pg_dumpall -U developer > "$BACKUP_ROOT/postgres/mono-all-databases.sql" 2>/dev/null || echo "No production postgres running"

# Test databases (if running)
docker-compose -p mono-test -f docker-compose.test.yml exec -T postgres pg_dumpall -U developer > "$BACKUP_ROOT/postgres/mono-test-all-databases.sql" 2>/dev/null || echo "No test postgres running"

# Backup Redis
echo "Backing up Redis data..."
mkdir -p "$BACKUP_ROOT/redis"
docker-compose exec -T redis redis-cli BGSAVE 2>/dev/null || echo "No production redis running"
sleep 2
docker-compose exec -T redis cat /data/dump.rdb > "$BACKUP_ROOT/redis/mono-dump.rdb" 2>/dev/null || true

# Backup current configs
echo "Backing up current configurations..."
cp -r docker/grafana "$BACKUP_ROOT/" 2>/dev/null || true
cp -r docker/prometheus "$BACKUP_ROOT/" 2>/dev/null || true
cp -r docker/rabbitmq "$BACKUP_ROOT/" 2>/dev/null || true

echo -e "${GREEN}✓ Backups created at: $BACKUP_ROOT${NC}"

# ============================================
# STEP 2: Create Persistent Config Structure
# ============================================
echo ""
echo -e "${YELLOW}Step 2: Creating persistent config structure...${NC}"

# Create config directories
mkdir -p docker/configs/{postgres,redis,grafana,prometheus,rabbitmq,nginx,temporal,n8n}

# Copy existing configs to persistent location
cp -r docker/grafana/* docker/configs/grafana/ 2>/dev/null || true
cp -r docker/prometheus/* docker/configs/prometheus/ 2>/dev/null || true
cp -r docker/rabbitmq/* docker/configs/rabbitmq/ 2>/dev/null || true
cp docker/redis/redis.conf docker/configs/redis/ 2>/dev/null || echo "Creating default redis.conf"

# Create Redis config if not exists
if [ ! -f docker/configs/redis/redis.conf ]; then
    cat > docker/configs/redis/redis.conf << 'EOF'
# Redis configuration
bind 0.0.0.0
protected-mode no
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
always-show-logo yes
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-disable-tcp-nodelay no
replica-priority 100
maxmemory 256mb
maxmemory-policy allkeys-lru
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF
fi

# Create PostgreSQL config
mkdir -p docker/configs/postgres/conf.d
cat > docker/configs/postgres/postgresql.conf << 'EOF'
# PostgreSQL configuration
listen_addresses = '*'
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
log_timezone = 'UTC'
datestyle = 'iso, mdy'
timezone = 'UTC'
lc_messages = 'en_US.utf8'
lc_monetary = 'en_US.utf8'
lc_numeric = 'en_US.utf8'
lc_time = 'en_US.utf8'
default_text_search_config = 'pg_catalog.english'
EOF

echo -e "${GREEN}✓ Config structure created${NC}"

# ============================================
# STEP 3: Stop All Services
# ============================================
echo ""
echo -e "${YELLOW}Step 3: Stopping all services...${NC}"
docker-compose down
docker-compose -p mono-test -f docker-compose.test.yml down 2>/dev/null || true

# ============================================
# STEP 4: Update Docker Compose Override
# ============================================
echo ""
echo -e "${YELLOW}Step 4: Creating comprehensive docker-compose override...${NC}"

cat > docker-compose.persistent.yml << 'EOF'
# Persistent storage configuration for all services
# This ensures all configs and data are stored in predictable locations

services:
  # PostgreSQL - Full persistence
  postgres:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/databases/postgres/data:/var/lib/postgresql/data
      - ./docker/configs/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./docker/configs/postgres/conf.d:/etc/postgresql/conf.d
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
      - ${DOCKER_DATA_ROOT:-./docker-data}/databases/postgres/backup:/backup
    command: postgres -c config_file=/etc/postgresql/postgresql.conf

  # Redis - Full persistence
  redis:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/cache/redis/data:/data
      - ./docker/configs/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf

  # RabbitMQ - Full persistence
  rabbitmq:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/messaging/rabbitmq/data:/var/lib/rabbitmq
      - ${DOCKER_DATA_ROOT:-./docker-data}/messaging/rabbitmq/logs:/var/log/rabbitmq
      - ./docker/configs/rabbitmq:/etc/rabbitmq
    environment:
      - RABBITMQ_CONFIG_FILE=/etc/rabbitmq/rabbitmq

  # Grafana - Full persistence
  grafana:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/monitoring/grafana/data:/var/lib/grafana
      - ./docker/configs/grafana/grafana.ini:/etc/grafana/grafana.ini
      - ./docker/configs/grafana/provisioning:/etc/grafana/provisioning
      - ${DOCKER_DATA_ROOT:-./docker-data}/monitoring/grafana/plugins:/var/lib/grafana/plugins

  # Prometheus - Full persistence
  prometheus:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/monitoring/prometheus/data:/prometheus
      - ./docker/configs/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./docker/configs/prometheus/rules:/etc/prometheus/rules:ro
      - ./docker/configs/prometheus/targets:/etc/prometheus/targets:ro

  # N8N - Full persistence
  n8n:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/workflows/n8n/data:/home/node/.n8n
      - ${DOCKER_DATA_ROOT:-./docker-data}/workflows/n8n/files:/files
      - ./docker/configs/n8n:/home/node/.n8n/config

  # Temporal - Full persistence
  temporal:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/workflows/temporal/data:/etc/temporal
      - ./docker/configs/temporal:/etc/temporal/config

  # PHP - Session and log persistence
  php:
    volumes:
      - ./php:/var/www/html
      - ${DOCKER_DATA_ROOT:-./docker-data}/runtime/php/sessions:/var/lib/php/sessions
      - ${DOCKER_DATA_ROOT:-./docker-data}/runtime/php/logs:/var/log/php
      - ${DOCKER_DATA_ROOT:-./docker-data}/apps/kanboard/data:/var/www/html/kanboard/data
      - ${DOCKER_DATA_ROOT:-./docker-data}/apps/kanboard/plugins:/var/www/html/kanboard/plugins
      - ./docker/configs/php/php.ini:/usr/local/etc/php/conf.d/custom.ini:ro
      - ./docker/configs/kanboard/config.php:/var/www/html/kanboard/config.php:ro

  # Nginx - Log persistence
  nginx-clickdummy:
    volumes:
      - ./php/click-dummy:/var/www/html:ro
      - ${DOCKER_DATA_ROOT:-./docker-data}/runtime/nginx/logs:/var/log/nginx
      - ./docker/configs/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/configs/nginx/sites:/etc/nginx/conf.d:ro

  nginx-kanboard:
    volumes:
      - ./php/kanboard:/var/www/html:ro
      - ${DOCKER_DATA_ROOT:-./docker-data}/runtime/nginx/logs:/var/log/nginx
      - ./docker/configs/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/configs/nginx/sites:/etc/nginx/conf.d:ro

  # RedisInsight - Full persistence
  redisinsight:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/tools/redisinsight/data:/data

  # Mailpit - Full persistence
  mailpit:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/tools/mailpit/data:/data
EOF

echo -e "${GREEN}✓ Docker compose override created${NC}"

# ============================================
# STEP 5: Copy configs to new structure
# ============================================
echo ""
echo -e "${YELLOW}Step 5: Organizing configuration files...${NC}"

# Move configs to persistent locations
cp -r docker/grafana/dashboards docker/configs/grafana/provisioning/ 2>/dev/null || true
cp -r docker/grafana/datasources docker/configs/grafana/provisioning/ 2>/dev/null || true
cp docker/prometheus/prometheus.yml docker/configs/prometheus/ 2>/dev/null || true
cp -r docker/prometheus/rules docker/configs/prometheus/ 2>/dev/null || true
cp docker/rabbitmq/enabled_plugins docker/configs/rabbitmq/ 2>/dev/null || true
cp docker/rabbitmq/definitions.json docker/configs/rabbitmq/ 2>/dev/null || true
cp docker/nginx/nginx.conf docker/configs/nginx/ 2>/dev/null || true
cp -r docker/nginx/conf.d docker/configs/nginx/sites 2>/dev/null || true
cp docker/php/php.ini docker/configs/php/ 2>/dev/null || true
cp docker/kanboard/config.php docker/configs/kanboard/ 2>/dev/null || true
cp -r docker/temporal/dynamicconfig docker/configs/temporal/ 2>/dev/null || true

echo -e "${GREEN}✓ Configuration files organized${NC}"

# ============================================
# STEP 6: Update .env file
# ============================================
echo ""
echo -e "${YELLOW}Step 6: Updating environment configuration...${NC}"

# Add to .env if not present
if ! grep -q "COMPOSE_FILE.*docker-compose.persistent.yml" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Docker Compose files (includes persistent storage)" >> .env
    echo "COMPOSE_FILE=docker-compose.yml:docker-compose.persistent.yml" >> .env
fi

# ============================================
# STEP 7: Create test environment configs
# ============================================
echo ""
echo -e "${YELLOW}Step 7: Creating test environment configuration...${NC}"

cat > docker-compose.test.persistent.yml << 'EOF'
# Test environment persistent storage

services:
  postgres:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/test/databases/postgres/data:/var/lib/postgresql/data
      - ./docker/configs/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    command: postgres -c config_file=/etc/postgresql/postgresql.conf

  redis:
    volumes:
      - ${DOCKER_DATA_ROOT:-./docker-data}/test/cache/redis/data:/data
      - ./docker/configs/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
EOF

# ============================================
# STEP 8: Start services with new config
# ============================================
echo ""
echo -e "${YELLOW}Step 8: Starting services with persistent storage...${NC}"
docker-compose up -d

# Wait for services
echo "Waiting for services to start..."
sleep 15

# ============================================
# STEP 9: Restore data
# ============================================
echo ""
echo -e "${YELLOW}Step 9: Restoring data...${NC}"

# Restore PostgreSQL
if [ -f "$BACKUP_ROOT/postgres/mono-all-databases.sql" ]; then
    echo "Restoring PostgreSQL databases..."
    docker-compose exec -T postgres psql -U developer -f - < "$BACKUP_ROOT/postgres/mono-all-databases.sql"
    echo -e "${GREEN}✓ PostgreSQL restored${NC}"
fi

# Restore Redis
if [ -f "$BACKUP_ROOT/redis/mono-dump.rdb" ]; then
    echo "Restoring Redis data..."
    docker-compose exec -T redis sh -c "cat > /data/dump.rdb" < "$BACKUP_ROOT/redis/mono-dump.rdb"
    docker-compose restart redis
    echo -e "${GREEN}✓ Redis restored${NC}"
fi

# ============================================
# STEP 10: Verification
# ============================================
echo ""
echo -e "${YELLOW}Step 10: Verifying migration...${NC}"

# Check services
docker-compose ps

# Check data directories
echo ""
echo "Data directories:"
ls -la docker-data/*/

echo ""
echo "Config directories:"
ls -la docker/configs/*/

# ============================================
# Complete!
# ============================================
echo ""
echo -e "${GREEN}=== Migration Complete! ===${NC}"
echo ""
echo -e "${BLUE}📁 New Structure:${NC}"
echo "Configuration files: ./docker/configs/*"
echo "Persistent data: ./docker-data/*"
echo ""
echo -e "${BLUE}📋 What changed:${NC}"
echo "✅ All configs now in docker/configs/ (tracked in Git)"
echo "✅ All data now in docker-data/ (not in Git)"
echo "✅ Both production and test environments configured"
echo "✅ Full persistence for all services"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "1. Verify services: http://localhost:4041 (Kanboard)"
echo "2. Check Grafana: http://localhost:5005"
echo "3. For test environment: docker-compose -p mono-test -f docker-compose.test.yml -f docker-compose.test.persistent.yml up -d"
echo ""
echo "Backup location: $BACKUP_ROOT"