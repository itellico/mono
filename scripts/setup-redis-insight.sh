#!/bin/bash

# setup-redis-insight.sh - Configure Redis Insight with persistent connections
# This script sets up database connections for both main and test Redis instances

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Docker command path
DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
if ! command -v "$DOCKER" &> /dev/null; then
    DOCKER="docker"
fi

echo -e "${GREEN}Setting up Redis Insight with persistent connections...${NC}"

# Wait for Redis Insight to be ready
echo -e "${YELLOW}Waiting for Redis Insight to be ready...${NC}"
sleep 5

# Function to add Redis connection via API
add_redis_connection() {
    local name=$1
    local host=$2
    local port=$3
    local container_name=$4
    
    echo -e "${YELLOW}Adding Redis connection: $name${NC}"
    
    # Check if Redis Insight is accessible
    if ! curl -s http://localhost:5540/api/health > /dev/null; then
        echo -e "${RED}Redis Insight is not accessible at http://localhost:5540${NC}"
        return 1
    fi
    
    # Add connection via Redis Insight API
    curl -X POST http://localhost:5540/api/databases \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"host\": \"$host\",
            \"port\": $port,
            \"username\": \"\",
            \"password\": \"\",
            \"connectionType\": \"STANDALONE\",
            \"db\": 0,
            \"timeout\": 30000
        }" \
        --silent --show-error || {
        echo -e "${YELLOW}Connection might already exist or API method differs${NC}"
    }
}

# Check if Redis containers are running
if ! $DOCKER ps --format '{{.Names}}' | grep -q "^mono-redis$"; then
    echo -e "${RED}Main Redis container (mono-redis) is not running${NC}"
    exit 1
fi

if ! $DOCKER ps --format '{{.Names}}' | grep -q "^mono-test-redis$"; then
    echo -e "${YELLOW}Test Redis container (mono-test-redis) is not running${NC}"
    echo -e "${YELLOW}Starting test environment...${NC}"
    docker-compose -f docker-compose.test.yml up -d redis-test
    sleep 5
fi

# Add connections
add_redis_connection "mono" "host.docker.internal" 6379 "mono-redis"
add_redis_connection "mono-test" "host.docker.internal" 6380 "mono-test-redis"

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}Access Redis Insight at: http://localhost:5540${NC}"
echo -e "${GREEN}Connections configured:${NC}"
echo -e "  - ${YELLOW}mono${NC}: Main Redis (localhost:6379)"
echo -e "  - ${YELLOW}mono-test${NC}: Test Redis (localhost:6380)"