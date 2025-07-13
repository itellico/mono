#!/bin/bash

# Frontend Server Startup Script for itellico Mono
# Runs only the Next.js frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   itellico Mono Frontend Server Startup   ║${NC}"
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
    echo -e "\n${YELLOW}Shutting down frontend server...${NC}"
    # Only kill the specific process we started
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Check if .env.local file exists
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

# Install dependencies if needed
echo -e "\n${BLUE}Checking pnpm packages...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    pnpm install
fi

# Check if API server is running
echo -e "\n${BLUE}Checking API server status...${NC}"
API_PORT=3001
if curl -s http://192.168.178.94:$API_PORT/health > /dev/null; then
    echo -e "${GREEN}✓ API server is running on port $API_PORT${NC}"
else
    # Try backup port
    API_PORT=3010
    if curl -s http://192.168.178.94:$API_PORT/health > /dev/null; then
        echo -e "${GREEN}✓ API server is running on backup port $API_PORT${NC}"
    else
        echo -e "${YELLOW}⚠️  API server is not running. The frontend will work but API calls will fail.${NC}"
        echo -e "   Start the API server with: ${CYAN}./start-api.sh${NC}"
    fi
fi

# Kill ALL processes on port 3000 (preserving Docker)
echo -e "\n${BLUE}Clearing all processes on frontend port (3000)...${NC}"
PIDS=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$PIDS" ]; then
    echo -e "${CYAN}Found processes using port 3000, analyzing...${NC}"
    for pid in $PIDS; do
        # Get process details
        PROCESS_CMD=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        PROCESS_ARGS=$(ps -p $pid -o args= 2>/dev/null || echo "unknown")
        
        # Always show what we found
        echo -e "${CYAN}Process $pid: $PROCESS_CMD${NC}"
        
        # Skip Docker processes completely
        if [[ "$PROCESS_ARGS" == *"docker"* ]] || [[ "$PROCESS_ARGS" == *"com.docker"* ]]; then
            echo -e "${CYAN}  → Skipping Docker process${NC}"
            continue
        fi
        
        # Kill everything else (Node.js and non-Node.js)
        echo -e "${YELLOW}  → Killing process $pid ($PROCESS_CMD)${NC}"
        kill -9 $pid 2>/dev/null || true
    done
    
    # Wait for processes to die
    sleep 3
    
    # Final verification and cleanup
    REMAINING_PIDS=$(lsof -ti:3000 2>/dev/null || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo -e "${YELLOW}⚠️  Port 3000 still occupied, running final cleanup...${NC}"
        for pid in $REMAINING_PIDS; do
            PROCESS_ARGS=$(ps -p $pid -o args= 2>/dev/null || echo "unknown")
            if [[ "$PROCESS_ARGS" != *"docker"* ]] && [[ "$PROCESS_ARGS" != *"com.docker"* ]]; then
                echo -e "${YELLOW}Force killing remaining process $pid${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
        done
        sleep 2
    fi
    
    # Final check
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo -e "${RED}✗ Port 3000 still occupied after all cleanup attempts${NC}"
        echo -e "${RED}You may need to manually kill the process or restart your system${NC}"
        echo -e "${CYAN}Remaining processes:${NC}"
        lsof -i :3000 2>/dev/null || true
    else
        echo -e "${GREEN}✓ Port 3000 successfully cleared${NC}"
    fi
else
    echo -e "${GREEN}✓ No processes found on port 3000${NC}"
fi

# Start Next.js frontend
echo -e "\n${CYAN}Starting Next.js frontend on port 3000...${NC}"
cd apps/web && NODE_OPTIONS="--trace-deprecation" pnpm next dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
sleep 10

# Check if frontend is running
if curl -s http://192.168.178.94:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting up...${NC}"
fi

# Print success message
echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Frontend Server Started Successfully   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${CYAN}Platform Admin:${NC}  http://mono.local:3000"
echo -e "${CYAN}Platform App:${NC}    http://app.mono.local:3000"
echo -e "${CYAN}Admin Panel:${NC}     http://admin.mono.local:3000"
echo -e ""
echo -e "${BLUE}Multi-Tenant URLs:${NC}"
echo -e "${CYAN}Go Models:${NC}       http://go-models.local:3000"
echo -e "${CYAN}Fashion Agency:${NC}  http://fashion-agency.local:3000"
echo -e "${CYAN}Pet Models:${NC}      http://pet-models.local:3000"
echo -e ""
echo -e "${BLUE}Alternative URLs:${NC}"
echo -e "${CYAN}Localhost:${NC}       http://192.168.178.94:3000"
echo -e ""
echo -e "${YELLOW}Press Ctrl+C to stop the frontend server${NC}"
echo -e ""

# Show logs
echo -e "${BLUE}Showing frontend server logs...${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"

# Wait for process
wait $FRONTEND_PID