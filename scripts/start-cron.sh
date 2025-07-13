#!/bin/bash

# start-cron.sh - Start the itellico Mono cron manager
# This script starts the automated task scheduler for database backups and maintenance

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting itellico Mono Cron Manager${NC}"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "scripts" ]; then
    echo "❌ Please run this script from the mono project root directory."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p backups

echo -e "${YELLOW}📁 Created logs and backups directories${NC}"

# Check if Docker is running (needed for database backups)
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Docker is not running. Database backups will fail.${NC}"
    echo -e "${YELLOW}   Start Docker Desktop to enable database backups.${NC}"
fi

# Start the cron manager
echo -e "${GREEN}🕒 Starting scheduled tasks...${NC}"
echo -e "${GREEN}   Database backups: Daily at 2 AM${NC}"
echo -e "${GREEN}   Health checks: Every 5 minutes${NC}"
echo -e "${GREEN}   Log cleanup: Weekly on Sunday at 3 AM${NC}"
echo -e "${GREEN}   Redis cleanup: Hourly${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the cron manager${NC}"
echo ""

# Run the cron manager
node scripts/cron-manager.js start