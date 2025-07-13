#!/bin/bash

# API Server Startup Script for itellico Mono
# Runs the NestJS API server with Fastify adapter

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     itellico Mono API Server Startup      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
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
check_command pnpm

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
    echo -e "\n${YELLOW}Shutting down API server...${NC}"
    # Only kill the specific process we started
    if [ ! -z "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
        echo -e "${YELLOW}Stopping API server (PID: $API_PID)...${NC}"
        kill "$API_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Check if .env file exists
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
echo -e "\n${BLUE}Checking pnpm packages...${NC}"
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

# Kill all Node.js processes on port 3001 (excluding Docker)
echo -e "\n${BLUE}Checking for processes on port 3001...${NC}"
PIDS=$(lsof -ti:3001 2>/dev/null || true)
if [ ! -z "$PIDS" ]; then
    echo -e "${YELLOW}Found processes on port 3001, killing them...${NC}"
    for pid in $PIDS; do
        # Check if process exists and get its command
        if ps -p $pid > /dev/null 2>&1; then
            PROCESS_CMD=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            PROCESS_ARGS=$(ps -p $pid -o args= 2>/dev/null || echo "")
            
            # Skip Docker processes
            if echo "$PROCESS_ARGS" | grep -q "docker"; then
                echo -e "${CYAN}Skipping Docker process $pid${NC}"
                continue
            fi
            
            # Kill the process
            echo -e "${YELLOW}Killing process $pid ($PROCESS_CMD)${NC}"
            kill -TERM $pid 2>/dev/null || true
        fi
    done
    
    # Wait for graceful shutdown
    echo -e "${YELLOW}Waiting for processes to terminate...${NC}"
    sleep 3
    
    # Force kill any remaining processes
    REMAINING_PIDS=$(lsof -ti:3001 2>/dev/null || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        for pid in $REMAINING_PIDS; do
            if ps -p $pid > /dev/null 2>&1; then
                PROCESS_ARGS=$(ps -p $pid -o args= 2>/dev/null || echo "")
                if ! echo "$PROCESS_ARGS" | grep -q "docker"; then
                    echo -e "${RED}Force killing stubborn process $pid${NC}"
                    kill -9 $pid 2>/dev/null || true
                fi
            fi
        done
        sleep 1
    fi
else
    echo -e "${GREEN}✓ Port 3001 is already free${NC}"
fi

echo -e "${GREEN}✓ Port 3001 cleared for API server${NC}"

# Always use port 3001 for consistency
API_PORT=3001

echo -e "\n${CYAN}Starting NestJS API (with Fastify adapter) on port $API_PORT...${NC}"
cd apps/api-nest
PORT=$API_PORT NODE_OPTIONS="--trace-deprecation" pnpm start:dev &
API_PID=$!
cd ../..

# Wait for API to start
echo -e "${YELLOW}Waiting for API to start...${NC}"
sleep 10

# Check if API is running on port 3001
if curl -s http://192.168.178.94:3001/api/v2/health > /dev/null || curl -s http://192.168.178.94:3001/api/v2/public/health > /dev/null; then
    echo -e "${GREEN}✓ NestJS API is running on port 3001${NC}"
else
    echo -e "${RED}✗ Failed to start NestJS API on port 3001${NC}"
    echo -e "${YELLOW}Checking what's using port 3001...${NC}"
    lsof -i:3001 || echo "No processes found on port 3001"
    exit 1
fi

# Print success message
echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        API Server Started Successfully     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${CYAN}Platform API:${NC}    http://api.mono.local:3001"
echo -e "${CYAN}API Docs:${NC}        http://192.168.178.94:3001/docs"
echo -e "${CYAN}Metrics:${NC}         http://api.mono.local:3001/metrics"
echo -e ""
echo -e "${BLUE}Alternative URLs:${NC}"
echo -e "${CYAN}Localhost:${NC}       http://192.168.178.94:3001"
echo -e "${CYAN}Tenant API:${NC}      http://api.go-models.local:3001"
echo -e ""
echo -e "${YELLOW}Press Ctrl+C to stop the API server${NC}"
echo -e ""

# Show logs
echo -e "${BLUE}Showing API server logs...${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"

# Wait for process
wait $API_PID