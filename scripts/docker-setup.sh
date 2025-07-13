#!/bin/bash

# Mono Platform Docker Infrastructure Setup
# Complete development environment with all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              Mono Platform Docker Setup                    ║${NC}"
echo -e "${CYAN}║     Complete Development Environment with All Services     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo -e "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo -e "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Create necessary directories
echo -e "\n${BLUE}Creating Docker directories...${NC}"
mkdir -p docker/postgres/init
mkdir -p docker/prometheus/rules
mkdir -p docker/grafana/dashboards
mkdir -p docker/grafana/datasources
mkdir -p docker/n8n/workflows

# Stop any existing containers
echo -e "\n${BLUE}Stopping any existing containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Kill any processes using required ports (Docker-safe)
echo -e "\n${BLUE}Clearing required ports (Docker-safe)...${NC}"
# Source safe port utilities
source scripts/utils/safe-port-utils.sh

for port in 5432 6379 1025 8025 5678 7233 8080 9090 3005 9100 8081; do
    safe_kill_port $port
done

# Setup environment variables
echo -e "\n${BLUE}Setting up environment variables...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from Docker template...${NC}"
    cp .env.docker .env.local
    echo -e "${GREEN}✓ Created .env.local${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}Creating apps/api/.env from Docker template...${NC}"
    cp .env.docker apps/api/.env
    echo -e "${GREEN}✓ Created apps/api/.env${NC}"
else
    echo -e "${GREEN}✓ apps/api/.env already exists${NC}"
fi

# Install Node.js dependencies if needed
echo -e "\n${BLUE}Checking Node.js dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "apps/api/node_modules" ]; then
    echo -e "${YELLOW}Installing API dependencies...${NC}"
    cd apps/api && npm install && cd ../..
fi

# Add monitoring dependencies
echo -e "\n${BLUE}Installing monitoring dependencies...${NC}"
cd apps/api
if ! npm list prom-client > /dev/null 2>&1; then
    echo -e "${YELLOW}Installing Prometheus client...${NC}"
    npm install prom-client
    echo -e "${GREEN}✓ Prometheus client installed${NC}"
else
    echo -e "${GREEN}✓ Prometheus client already installed${NC}"
fi
cd ../..

# Start Docker services
echo -e "\n${BLUE}Starting Docker services...${NC}"
echo -e "${CYAN}This will start:${NC}"
echo -e "${CYAN}  📊 PostgreSQL Database (Port 5432)${NC}"
echo -e "${CYAN}  🗄️  Redis Cache (Port 6379)${NC}"
echo -e "${CYAN}  📧 Mailpit Email Testing (Port 8025)${NC}"
echo -e "${CYAN}  🔄 N8N Workflow Automation (Port 5678)${NC}"
echo -e "${CYAN}  ⏰ Temporal Workflow Engine (Port 7233, 8080)${NC}"
echo -e "${CYAN}  📈 Prometheus Metrics (Port 9090)${NC}"
echo -e "${CYAN}  📊 Grafana Dashboards (Port 3005)${NC}"
echo -e "${CYAN}  🖥️  System Monitoring (Ports 9100, 8081)${NC}"
echo ""

docker-compose up -d

# Wait for services to start
echo -e "\n${YELLOW}Waiting for services to initialize...${NC}"
echo -e "${BLUE}This may take 2-3 minutes for first-time setup...${NC}"

# Check service health
echo -e "\n${BLUE}Checking service health...${NC}"
sleep 30

services=(
    "postgres:5432:PostgreSQL Database"
    "localhost:6379:Redis Cache"
    "localhost:8025:Mailpit Email UI"
    "localhost:5678:N8N Workflow Engine"
    "localhost:7233:Temporal Server"
    "localhost:8080:Temporal Web UI"
    "localhost:9090:Prometheus"
    "localhost:5005:Grafana"
    "localhost:9100:Node Exporter"
    "localhost:8081:cAdvisor"
)

for service in "${services[@]}"; do
    IFS=':' read -r host port name <<< "$service"
    if nc -z $host $port 2>/dev/null; then
        echo -e "${GREEN}✓ $name${NC}"
    else
        echo -e "${RED}✗ $name (may still be starting)${NC}"
    fi
done

# Run database migrations
echo -e "\n${BLUE}Running database migrations...${NC}"
sleep 10  # Give PostgreSQL more time
npx prisma migrate dev --name docker-setup || echo -e "${YELLOW}⚠️  Migration failed - database may need more time${NC}"

# Add monitoring permissions
echo -e "\n${BLUE}Setting up monitoring permissions...${NC}"
npx tsx scripts/add-monitoring-permissions.ts || echo -e "${YELLOW}⚠️  Permission setup failed - run manually later${NC}"

# Success message
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 Setup Complete! 🎉                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${CYAN}🚀 Your Mono Platform development environment is ready!${NC}"
echo -e ""
echo -e "${PURPLE}📊 Core Services:${NC}"
echo -e "${CYAN}  Database:        ${NC}PostgreSQL on localhost:5432"
echo -e "${CYAN}  Cache:           ${NC}Redis on localhost:6379"
echo -e "${CYAN}  Email Testing:   ${NC}http://localhost:8025 (Mailpit)"
echo -e "${CYAN}  Workflows:       ${NC}http://localhost:5678 (N8N: admin/admin123)"
echo -e "${CYAN}  Temporal:        ${NC}http://localhost:8080 (Temporal Web UI)"
echo -e ""
echo -e "${PURPLE}📈 Monitoring Stack:${NC}"
echo -e "${CYAN}  Grafana:         ${NC}http://localhost:5005 (admin/admin123)"
echo -e "${CYAN}  Prometheus:      ${NC}http://localhost:9090"
echo -e "${CYAN}  System Metrics:  ${NC}http://localhost:9100, http://localhost:8081"
echo -e ""
echo -e "${PURPLE}🖥️  Next Steps:${NC}"
echo -e "${CYAN}1. Start your applications:${NC}"
echo -e "   cd apps/api && npm run dev  ${BLUE}# Fastify API (Port 3001)${NC}"
echo -e "   npm run dev                 ${BLUE}# Next.js Frontend (Port 3000)${NC}"
echo -e ""
echo -e "${CYAN}2. Access your admin panel:${NC}"
echo -e "   http://localhost:3000/admin/monitoring"
echo -e ""
echo -e "${CYAN}3. Useful commands:${NC}"
echo -e "   docker-compose logs -f      ${BLUE}# View all service logs${NC}"
echo -e "   docker-compose down         ${BLUE}# Stop all services${NC}"
echo -e "   docker-compose up -d        ${BLUE}# Start all services${NC}"
echo -e ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo -e ""