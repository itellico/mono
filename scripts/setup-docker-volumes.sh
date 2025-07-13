#!/bin/bash

# ============================================
# Docker Persistent Volumes Setup Script
# Best Practice Folder Structure
# ============================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Docker Persistent Volumes Setup ===${NC}"
echo ""

# Base directory for all Docker data (can be customized via env var)
DOCKER_DATA_ROOT="${DOCKER_DATA_ROOT:-./docker-data}"

echo -e "${YELLOW}Creating volume directory structure at: ${DOCKER_DATA_ROOT}${NC}"
echo ""

# Create main directory
mkdir -p "$DOCKER_DATA_ROOT"

# ===== DATABASES =====
echo -e "${BLUE}Creating database volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/databases/postgres/data"
mkdir -p "$DOCKER_DATA_ROOT/databases/postgres/config"
mkdir -p "$DOCKER_DATA_ROOT/databases/postgres/backup"

# ===== CACHE =====
echo -e "${BLUE}Creating cache volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/cache/redis/data"
mkdir -p "$DOCKER_DATA_ROOT/cache/redis/config"

# ===== MESSAGING =====
echo -e "${BLUE}Creating messaging volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/messaging/rabbitmq/data"
mkdir -p "$DOCKER_DATA_ROOT/messaging/rabbitmq/config"
mkdir -p "$DOCKER_DATA_ROOT/messaging/rabbitmq/logs"

# ===== APPLICATIONS =====
echo -e "${BLUE}Creating application volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/apps/kanboard/data"
mkdir -p "$DOCKER_DATA_ROOT/apps/kanboard/plugins"
mkdir -p "$DOCKER_DATA_ROOT/apps/clickdummy/data"

# ===== WORKFLOWS =====
echo -e "${BLUE}Creating workflow volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/workflows/n8n/data"
mkdir -p "$DOCKER_DATA_ROOT/workflows/n8n/workflows"
mkdir -p "$DOCKER_DATA_ROOT/workflows/n8n/custom"
mkdir -p "$DOCKER_DATA_ROOT/workflows/temporal/data"
mkdir -p "$DOCKER_DATA_ROOT/workflows/temporal/config"

# ===== MONITORING =====
echo -e "${BLUE}Creating monitoring volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/monitoring/prometheus/data"
mkdir -p "$DOCKER_DATA_ROOT/monitoring/prometheus/config"
mkdir -p "$DOCKER_DATA_ROOT/monitoring/grafana/data"
mkdir -p "$DOCKER_DATA_ROOT/monitoring/grafana/config"
mkdir -p "$DOCKER_DATA_ROOT/monitoring/grafana/plugins"

# ===== TOOLS =====
echo -e "${BLUE}Creating tool volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/tools/redisinsight/data"
mkdir -p "$DOCKER_DATA_ROOT/tools/mailpit/data"

# ===== RUNTIME =====
echo -e "${BLUE}Creating runtime volumes...${NC}"
mkdir -p "$DOCKER_DATA_ROOT/runtime/php/sessions"
mkdir -p "$DOCKER_DATA_ROOT/runtime/php/logs"
mkdir -p "$DOCKER_DATA_ROOT/runtime/nginx/logs"

# ===== SET PERMISSIONS =====
echo ""
echo -e "${YELLOW}Setting permissions...${NC}"

# PostgreSQL (UID 999)
chown -R 999:999 "$DOCKER_DATA_ROOT/databases/postgres" 2>/dev/null || true

# Redis (UID 999)
chown -R 999:999 "$DOCKER_DATA_ROOT/cache/redis" 2>/dev/null || true

# RabbitMQ (UID 999)
chown -R 999:999 "$DOCKER_DATA_ROOT/messaging/rabbitmq" 2>/dev/null || true

# Grafana (UID 472)
chown -R 472:472 "$DOCKER_DATA_ROOT/monitoring/grafana" 2>/dev/null || true

# Prometheus (UID 65534 - nobody)
chown -R 65534:65534 "$DOCKER_DATA_ROOT/monitoring/prometheus" 2>/dev/null || true

# N8N (UID 1000 - node user)
chown -R 1000:1000 "$DOCKER_DATA_ROOT/workflows/n8n" 2>/dev/null || true

# PHP/Nginx (UID 33 - www-data)
chown -R 33:33 "$DOCKER_DATA_ROOT/apps" 2>/dev/null || true
chown -R 33:33 "$DOCKER_DATA_ROOT/runtime/php" 2>/dev/null || true
chmod -R 755 "$DOCKER_DATA_ROOT/apps"

# ===== CREATE .env FILE =====
echo ""
echo -e "${YELLOW}Creating .env configuration...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

# Add Docker data root to .env if not present
if ! grep -q "DOCKER_DATA_ROOT" .env; then
    echo "" >> .env
    echo "# Docker persistent data location" >> .env
    echo "DOCKER_DATA_ROOT=$DOCKER_DATA_ROOT" >> .env
fi

# Add compose file configuration
if ! grep -q "COMPOSE_FILE" .env; then
    echo "" >> .env
    echo "# Docker Compose files to use" >> .env
    echo "COMPOSE_FILE=docker-compose.yml:docker-compose.volumes.yml" >> .env
fi

# ===== DISPLAY VOLUME STRUCTURE =====
echo ""
echo -e "${GREEN}✅ Volume structure created successfully!${NC}"
echo ""
echo -e "${BLUE}📁 Volume Directory Structure:${NC}"
echo ""
echo "$DOCKER_DATA_ROOT/"
echo "├── databases/"
echo "│   └── postgres/          # PostgreSQL data, config, backups"
echo "├── cache/"
echo "│   └── redis/             # Redis persistence and config"
echo "├── messaging/"
echo "│   └── rabbitmq/          # RabbitMQ data, config, logs"
echo "├── apps/"
echo "│   ├── kanboard/          # Kanboard data and plugins"
echo "│   └── clickdummy/        # Click-dummy application data"
echo "├── workflows/"
echo "│   ├── n8n/               # N8N workflows and custom nodes"
echo "│   └── temporal/          # Temporal workflow data"
echo "├── monitoring/"
echo "│   ├── prometheus/        # Metrics time-series data"
echo "│   └── grafana/           # Dashboards and plugins"
echo "├── tools/"
echo "│   ├── redisinsight/      # Redis GUI data"
echo "│   └── mailpit/           # Email testing data"
echo "└── runtime/"
echo "    ├── php/               # PHP sessions and logs"
echo "    └── nginx/             # Web server logs"

# ===== SERVICE MAPPING =====
echo ""
echo -e "${BLUE}🔗 Service → Volume Mapping:${NC}"
echo ""
echo "PostgreSQL    → $DOCKER_DATA_ROOT/databases/postgres/"
echo "Redis         → $DOCKER_DATA_ROOT/cache/redis/"
echo "RabbitMQ      → $DOCKER_DATA_ROOT/messaging/rabbitmq/"
echo "Kanboard      → $DOCKER_DATA_ROOT/apps/kanboard/"
echo "Click-dummy   → $DOCKER_DATA_ROOT/apps/clickdummy/"
echo "N8N           → $DOCKER_DATA_ROOT/workflows/n8n/"
echo "Temporal      → $DOCKER_DATA_ROOT/workflows/temporal/"
echo "Prometheus    → $DOCKER_DATA_ROOT/monitoring/prometheus/"
echo "Grafana       → $DOCKER_DATA_ROOT/monitoring/grafana/"
echo "RedisInsight  → $DOCKER_DATA_ROOT/tools/redisinsight/"
echo "Mailpit       → $DOCKER_DATA_ROOT/tools/mailpit/"

# ===== NEXT STEPS =====
echo ""
echo -e "${GREEN}📋 Next Steps:${NC}"
echo ""
echo "1. Stop current containers:"
echo "   ${YELLOW}docker-compose down${NC}"
echo ""
echo "2. Start with persistent volumes:"
echo "   ${YELLOW}docker-compose up -d${NC}"
echo ""
echo "3. Migrate Kanboard to PostgreSQL:"
echo "   ${YELLOW}./scripts/migrate-kanboard-to-postgres.sh${NC}"
echo ""
echo "4. Verify volumes are mounted:"
echo "   ${YELLOW}docker-compose exec postgres df -h /var/lib/postgresql/data${NC}"
echo "   ${YELLOW}docker-compose exec redis df -h /data${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "• Backup entire data: ${YELLOW}tar -czf docker-data-backup.tar.gz $DOCKER_DATA_ROOT${NC}"
echo "• Change data location: ${YELLOW}export DOCKER_DATA_ROOT=/path/to/storage${NC}"
echo "• Monitor disk usage: ${YELLOW}du -sh $DOCKER_DATA_ROOT/*${NC}"
echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"