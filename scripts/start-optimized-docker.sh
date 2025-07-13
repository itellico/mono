#!/bin/bash

# Start optimized Docker services for itellico Mono
# This script uses the optimized Docker Compose configuration with resource limits

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Optimized Docker Services Startup       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop first${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check Docker resources
echo -e "\n${BLUE}Checking Docker Desktop resources...${NC}"
DOCKER_MEM=$(docker system info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
DOCKER_MEM_GB=$((DOCKER_MEM / 1073741824))

if [ "$DOCKER_MEM_GB" -lt 4 ]; then
    echo -e "${YELLOW}⚠️  Docker Desktop has less than 4GB RAM allocated${NC}"
    echo -e "${YELLOW}   Current: ${DOCKER_MEM_GB}GB${NC}"
    echo -e "${YELLOW}   Recommended: 8GB for optimal performance${NC}"
    echo -e "${YELLOW}   Adjust in Docker Desktop > Preferences > Resources${NC}"
fi

# Check if services are already running
echo -e "\n${BLUE}Checking existing services...${NC}"
RUNNING_SERVICES=$(docker-compose -f docker-compose.optimized.yml ps -q | wc -l | tr -d ' ')

if [ "$RUNNING_SERVICES" -gt 0 ]; then
    echo -e "${YELLOW}Found $RUNNING_SERVICES services already running${NC}"
    read -p "Do you want to restart all services? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping existing services...${NC}"
        docker-compose -f docker-compose.optimized.yml down
    else
        echo -e "${GREEN}Keeping existing services running${NC}"
        docker-compose -f docker-compose.optimized.yml ps
        exit 0
    fi
fi

# Create required directories
echo -e "\n${BLUE}Creating required directories...${NC}"
mkdir -p docker/postgres/init
mkdir -p docker/prometheus
mkdir -p docker/grafana/{dashboards,datasources}
mkdir -p docker/rabbitmq
mkdir -p docker/temporal/dynamicconfig
mkdir -p docker/n8n/workflows

# Create Prometheus config if it doesn't exist
if [ ! -f "docker/prometheus/prometheus.yml" ]; then
    echo -e "${YELLOW}Creating Prometheus configuration...${NC}"
    cat > docker/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'temporal'
    static_configs:
      - targets: ['temporal:9091']

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']

  - job_name: 'fastify-api'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'
EOF
fi

# Create Grafana datasource if it doesn't exist
if [ ! -f "docker/grafana/datasources/prometheus.yml" ]; then
    echo -e "${YELLOW}Creating Grafana datasource configuration...${NC}"
    cat > docker/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
fi

# Start services
echo -e "\n${BLUE}Starting optimized Docker services...${NC}"
docker-compose -f docker-compose.optimized.yml up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to become healthy...${NC}"
echo -e "${CYAN}This may take up to 2 minutes on first start${NC}"

# Function to check service health
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.optimized.yml ps | grep "$service" | grep -q "healthy\|running"; then
            echo -e "${GREEN}✓ $service is healthy${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}✗ $service failed to become healthy${NC}"
    return 1
}

# Check critical services
check_health "postgres"
check_health "redis"
check_health "rabbitmq"

# Display service URLs
echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Services Started Successfully! 🚀        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Service URLs:${NC}"
echo -e "  PostgreSQL:    ${BLUE}localhost:5432${NC} (developer/developer)"
echo -e "  Redis:         ${BLUE}localhost:6379${NC}"
echo -e "  RedisInsight:  ${BLUE}http://localhost:5540${NC}"
echo -e "  RabbitMQ:      ${BLUE}http://localhost:15672${NC} (admin/admin123)"
echo -e "  Mailpit:       ${BLUE}http://localhost:8025${NC}"
echo -e "  N8N:           ${BLUE}http://localhost:5678${NC} (admin/admin123)"
echo -e "  Temporal:      ${BLUE}http://localhost:8080${NC}"
echo -e "  Prometheus:    ${BLUE}http://localhost:9090${NC}"
echo -e "  Grafana:       ${BLUE}http://localhost:5005${NC} (admin/admin123)"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo -e "  View logs:     ${YELLOW}docker-compose -f docker-compose.optimized.yml logs -f [service]${NC}"
echo -e "  View stats:    ${YELLOW}docker stats${NC}"
echo -e "  Stop all:      ${YELLOW}docker-compose -f docker-compose.optimized.yml down${NC}"
echo -e "  Restart:       ${YELLOW}docker-compose -f docker-compose.optimized.yml restart [service]${NC}"
echo ""
echo -e "${GREEN}Resource Monitoring:${NC}"
echo -e "  1. Open Grafana: ${BLUE}http://localhost:5005${NC}"
echo -e "  2. Login with: admin/admin123"
echo -e "  3. Import dashboard ID: 1860 (Node Exporter Full)"
echo -e "  4. Import dashboard ID: 893 (Docker Container Stats)"
echo ""

# Show current resource usage
echo -e "${CYAN}Current Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"