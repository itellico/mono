#!/bin/bash

# Start Docker services with persistent storage and fix PHP issues
# This script ensures all services start properly with persistent volumes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Mono Platform - Docker Persistent Startup            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "Please start Docker first"
    exit 1
fi

echo -e "${BLUE}📦 Starting all services with persistent storage...${NC}"

# Start services with persistent overlay
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

echo -e "${YELLOW}⏳ Waiting for services to initialize (30 seconds)...${NC}"
sleep 30

# Fix PHP pdo_pgsql extension
echo -e "${BLUE}🔧 Checking PHP pdo_pgsql extension...${NC}"
if ! docker-compose exec php php -m | grep -q "pdo_pgsql" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Installing pdo_pgsql extension...${NC}"
    
    docker-compose exec -u root php sh -c "
        apk add --no-cache postgresql-dev && \
        docker-php-ext-install pdo_pgsql && \
        docker-php-ext-enable pdo_pgsql
    " || {
        echo -e "${RED}❌ Failed to install pdo_pgsql extension${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ pdo_pgsql extension installed${NC}"
else
    echo -e "${GREEN}✅ pdo_pgsql extension already loaded${NC}"
fi

# Check service health
echo -e "\n${BLUE}🏥 Checking service health...${NC}"
sleep 10

services=(
    "postgres:5432"
    "redis:6379"
    "n8n:5678"
    "temporal-web:4080"
    "grafana:5005"
    "mailpit:4025"
    "kanboard:4041"
    "clickdummy:4040"
    "redis-insight:5540"
)

all_healthy=true
for service_port in "${services[@]}"; do
    service=$(echo $service_port | cut -d: -f1)
    port=$(echo $service_port | cut -d: -f2)
    
    if curl -s --max-time 5 http://192.168.178.94:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service (port $port)${NC}"
    else
        echo -e "${YELLOW}⚠️  $service (port $port) - still starting${NC}"
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services are still starting up${NC}"
    echo -e "${BLUE}💡 Wait a few more minutes and check again${NC}"
fi

echo ""
echo -e "${CYAN}📋 Service URLs:${NC}"
echo -e "${GREEN}  Frontend Development:${NC}"
echo -e "    Next.js App:     http://192.168.178.94:3000"
echo -e "    API Server:      http://192.168.178.94:3001"
echo -e ""
echo -e "${GREEN}  Management Tools:${NC}"
echo -e "    Kanboard:        http://192.168.178.94:4041"
echo -e "    N8N Workflows:   http://192.168.178.94:5678"
echo -e "    Temporal UI:     http://192.168.178.94:4080"
echo -e "    RedisInsight:    http://192.168.178.94:5540"
echo -e ""
echo -e "${GREEN}  Monitoring:${NC}"
echo -e "    Grafana:         http://192.168.178.94:5005"
echo -e "    Prometheus:      http://192.168.178.94:9090"
echo -e ""
echo -e "${GREEN}  Testing Tools:${NC}"
echo -e "    Mailpit (Email): http://192.168.178.94:4025"
echo -e "    Click-dummy:     http://192.168.178.94:4040"
echo -e ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo -e "    docker-compose ps                    # Check service status"
echo -e "    docker-compose logs -f <service>     # View logs"
echo -e "    docker-compose restart <service>     # Restart service"
echo -e "    ./scripts/fix-php-pgsql.sh          # Fix PHP extension"
echo -e ""
echo -e "${GREEN}🚀 Docker environment is ready!${NC}"
echo ""