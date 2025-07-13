#!/bin/bash

# Development Startup Script for itellico Mono
# Runs both NestJS API (with Fastify adapter) and Next.js frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    itellico Mono Development Startup      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 For best experience, set up local domains first:${NC}"
echo -e "   ${CYAN}./scripts/setup-local-domains.sh${NC}"
echo ""

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
    fi
}

echo -e "${BLUE}Checking dependencies...${NC}"
check_command node
check_command npm

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version must be 18 or higher${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Node.js version is compatible${NC}"
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    # Only kill the specific processes we started
    if [ ! -z "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
        echo -e "${YELLOW}Stopping API server (PID: $API_PID)...${NC}"
        kill "$API_PID" 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Check if .env files exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found, creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓ Created .env.local${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
fi

if [ ! -f "apps/api-nest/.env" ]; then
    echo -e "${YELLOW}⚠️  apps/api-nest/.env not found, creating from example...${NC}"
    if [ -f "apps/api-nest/.env.example" ]; then
        cp apps/api-nest/.env.example apps/api-nest/.env
        echo -e "${GREEN}✓ Created apps/api-nest/.env${NC}"
    else
        echo -e "${RED}✗ apps/api-nest/.env.example not found${NC}"
        exit 1
    fi
fi

# Install dependencies if needed
echo -e "\n${BLUE}Checking npm packages...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "apps/api-nest/node_modules" ]; then
    echo -e "${YELLOW}Installing API dependencies...${NC}"
    cd apps/api-nest && pnpm install && cd ../..
fi

# Start Redis if available
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is not running. Some features may not work properly.${NC}"
        echo -e "   Start Redis with: ${CYAN}redis-server${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Redis is not installed. Some features may not work properly.${NC}"
fi

# Kill only Node.js processes on ports 3000 and 3001
echo -e "\n${BLUE}Killing Node.js processes on development ports (3000, 3001)...${NC}"
for port in 3000 3001; do
    # Get PIDs using the port
    PIDS=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PIDS" ]; then
        for pid in $PIDS; do
            # Check if it's a Node.js process and not a Docker process
            if ps -p $pid -o comm= 2>/dev/null | grep -q "node" && ! ps -p $pid -o args= 2>/dev/null | grep -q "docker"; then
                echo -e "${YELLOW}Killing Node.js process $pid on port $port${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
        done
    fi
done
echo -e "${GREEN}✓ Node.js processes cleared on ports 3000 and 3001${NC}"

# Start services
echo -e "\n${BLUE}Starting services...${NC}"

# Start Fastify API with port fallback
API_PORT=3001
if lsof -i:$API_PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}Port $API_PORT is busy, trying backup port 3010...${NC}"
    API_PORT=3010
fi

echo -e "${CYAN}Starting NestJS API (with Fastify adapter) on port $API_PORT...${NC}"
(cd apps/api-nest && PORT=$API_PORT NODE_OPTIONS="--trace-deprecation" pnpm start:dev) &
API_PID=$!

# Wait for API to start
echo -e "${YELLOW}Waiting for API to start...${NC}"
sleep 5

# Check if API is running
if curl -s http://localhost:$API_PORT/health > /dev/null; then
    echo -e "${GREEN}✓ Fastify API is running on port $API_PORT${NC}"
else
    echo -e "${RED}✗ Failed to start Fastify API${NC}"
    exit 1
fi

# Start Next.js frontend
echo -e "${CYAN}Starting Next.js frontend on port 3000...${NC}"
NODE_OPTIONS="--trace-deprecation" npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
sleep 10

# Print success message
echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Services Started Successfully     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${CYAN}Platform:${NC}     http://mono.local:3000"
echo -e "${CYAN}API:${NC}          http://api.mono.local:$API_PORT"
echo -e "${CYAN}API Docs:${NC}     http://docs.mono.local:$API_PORT"
echo -e ""
echo -e "${BLUE}Multi-Tenant URLs:${NC}"
echo -e "${CYAN}Go Models:${NC}    http://go-models.local:3000"
echo -e "${CYAN}Fashion:${NC}      http://fashion-agency.local:3000"
echo -e ""
echo -e "${BLUE}Localhost URLs:${NC}"
echo -e "${CYAN}Frontend:${NC}     http://localhost:3000"
echo -e "${CYAN}API:${NC}          http://localhost:$API_PORT"
echo -e ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e ""

# Show logs
echo -e "${BLUE}Showing combined logs...${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"

# Wait for processes
wait