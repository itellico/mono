#!/bin/bash

# Mono Platform - Start Development with Domain Simulation
# This script starts both API and frontend servers with domain routing enabled

set -e

echo "🚀 Starting Mono Platform with Domain Routing"
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if hosts file is configured
if ! grep -q "app.monolocal.com" /etc/hosts; then
    echo -e "${YELLOW}⚠️  Domain simulation not configured${NC}"
    echo "   Run: pnpm domains:setup"
    echo "   to configure local domains"
    echo ""
fi

# Kill any existing processes on our ports
echo "🔄 Cleaning up existing processes..."
source scripts/utils/safe-port-utils.sh 2>/dev/null || {
    # Fallback if safe-port-utils doesn't exist
    echo "Killing processes on ports 3000 and 3001..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
}

# Start API server in background
echo -e "${GREEN}📡 Starting API server on port 3001...${NC}"
cd apps/api && pnpm run dev &
API_PID=$!

# Wait for API to be ready
echo "Waiting for API server to start..."
sleep 5

# Start Next.js frontend
echo -e "${GREEN}🌐 Starting frontend with domain routing on port 3000...${NC}"
pnpm run dev &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

echo ""
echo -e "${GREEN}✅ Development servers started!${NC}"
echo ""
echo "📍 Access URLs:"
echo "   Admin Portal:  http://app.monolocal.com:3000"
echo "   API Server:    http://api.monolocal.com:3001"
echo "   API Docs:      http://api.monolocal.com:3001/docs"
echo ""
echo "   Example Tenant Sites:"
echo "   - http://tenant1.monolocal.com:3000"
echo "   - http://modelagency.monolocal.com:3000"
echo ""
echo "   Fallback (if domains not configured):"
echo "   - http://localhost:3000"
echo "   - http://localhost:3001"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT TERM

# Keep script running
wait