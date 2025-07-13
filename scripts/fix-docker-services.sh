#!/bin/bash

# Fix Docker Services Script
# This script safely restarts Docker services without killing essential processes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           Fixing Docker Services for Mono Platform         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop first${NC}"
    
    # Try to open Docker Desktop on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${BLUE}Attempting to start Docker Desktop...${NC}"
        open -a Docker
        echo -e "${YELLOW}Waiting for Docker to start (30 seconds)...${NC}"
        sleep 30
        
        # Check again
        if ! docker info >/dev/null 2>&1; then
            echo -e "${RED}Docker still not running. Please start it manually.${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Step 1: Check current Docker containers status
echo -e "\n${BLUE}Checking current Docker containers...${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -E "(mono-|temporal)" || echo "No Mono containers found"

# Step 2: Stop all Mono-related containers gracefully
echo -e "\n${BLUE}Stopping Mono services gracefully...${NC}"
docker-compose -f docker-compose.services.yml down || true

# Step 3: Clean up any orphaned containers
echo -e "\n${BLUE}Cleaning up orphaned containers...${NC}"
docker container prune -f

# Step 4: Check and free up ports (only non-essential services)
echo -e "\n${BLUE}Checking ports...${NC}"
DOCKER_PORTS=(6379 1025 8025 5678 7233 8080 5540 9090 5005 9100 8081)

# Source safe port utilities
source scripts/utils/safe-port-utils.sh

for port in "${DOCKER_PORTS[@]}"; do
    safe_kill_port $port
done

# Step 5: Reset Docker networks
echo -e "\n${BLUE}Resetting Docker networks...${NC}"
docker network prune -f

# Step 6: Start services with fresh state
echo -e "\n${BLUE}Starting Docker services...${NC}"
docker-compose -f docker-compose.services.yml up -d

# Step 7: Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to become healthy...${NC}"
sleep 10

# Step 8: Verify services
echo -e "\n${BLUE}Verifying services...${NC}"
SERVICES=(
    "redis:6379:Redis Cache"
    "mailpit:8025:Mailpit Email"
    "n8n:5678:N8N Workflows"
    "temporal:7233:Temporal Server"
    "temporal-ui:8080:Temporal UI"
    "prometheus:9090:Prometheus"
    "grafana:5005:Grafana"
)

ALL_GOOD=true
for service in "${SERVICES[@]}"; do
    IFS=':' read -r container port name <<< "$service"
    
    # Check if container is running
    if docker ps | grep -q "mono-$container"; then
        echo -e "${GREEN}✓ $name container is running${NC}"
        
        # Check if port is accessible
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}  └─ Port $port is accessible${NC}"
        else
            echo -e "${RED}  └─ Port $port is not accessible${NC}"
            ALL_GOOD=false
        fi
    else
        echo -e "${RED}✗ $name container is not running${NC}"
        ALL_GOOD=false
    fi
done

# Step 9: Show container logs if there are issues
if [ "$ALL_GOOD" = false ]; then
    echo -e "\n${RED}Some services failed to start properly${NC}"
    echo -e "${YELLOW}Checking logs for failed services...${NC}"
    docker-compose -f docker-compose.services.yml logs --tail=20
fi

# Step 10: Show status and next steps
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Docker Services Status                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(mono-|temporal)" || echo "No services running"

echo -e "\n${CYAN}Quick Commands:${NC}"
echo -e "${BLUE}View logs:${NC} docker-compose -f docker-compose.services.yml logs -f"
echo -e "${BLUE}Stop all:${NC} docker-compose -f docker-compose.services.yml down"
echo -e "${BLUE}Restart all:${NC} docker-compose -f docker-compose.services.yml restart"
echo -e "${BLUE}Check health:${NC} docker ps"

echo -e "\n${CYAN}Service URLs:${NC}"
echo -e "Redis GUI:    http://localhost:5540"
echo -e "Mailpit:      http://localhost:8025" 
echo -e "N8N:          http://localhost:5678 (admin/admin123)"
echo -e "Temporal:     http://localhost:8080"
echo -e "Grafana:      http://localhost:5005 (admin/admin123)"
echo -e "Prometheus:   http://localhost:9090"

# Final check - if Node.js is still running on main ports, show warning
if lsof -ti:3000 >/dev/null 2>&1 || lsof -ti:3001 >/dev/null 2>&1; then
    echo -e "\n${YELLOW}Note: Node.js services are running on ports 3000/3001${NC}"
    echo -e "${YELLOW}This is normal - they should not be killed${NC}"
fi

echo -e "\n${GREEN}✓ Docker services fix complete!${NC}"