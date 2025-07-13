#!/bin/bash

# test-redis-connections.sh - Add test data to Redis instances
# This helps verify that Redis Insight connections are working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
if ! command -v "$DOCKER" &> /dev/null; then
    DOCKER="docker"
fi

echo -e "${GREEN}Adding test data to Redis instances...${NC}"

# Add test data to main Redis
echo -e "${YELLOW}Adding test data to main Redis (mono)...${NC}"
$DOCKER exec mono-redis redis-cli SET "test:main" "Hello from main Redis!" > /dev/null
$DOCKER exec mono-redis redis-cli SET "app:name" "itellico-mono" > /dev/null
$DOCKER exec mono-redis redis-cli SET "app:version" "1.0.0" > /dev/null
$DOCKER exec mono-redis redis-cli HSET "user:1" "name" "John Doe" "email" "john@example.com" > /dev/null
$DOCKER exec mono-redis redis-cli LPUSH "recent:actions" "login" "view_dashboard" "create_project" > /dev/null

# Add test data to test Redis
echo -e "${YELLOW}Adding test data to test Redis (mono-test)...${NC}"
$DOCKER exec mono-test-redis redis-cli SET "test:environment" "Hello from test Redis!" > /dev/null
$DOCKER exec mono-test-redis redis-cli SET "test:status" "active" > /dev/null
$DOCKER exec mono-test-redis redis-cli SET "test:run_id" "test-$(date +%s)" > /dev/null
$DOCKER exec mono-test-redis redis-cli HSET "test:user:1" "name" "Test User" "email" "test@example.com" > /dev/null
$DOCKER exec mono-test-redis redis-cli LPUSH "test:queue" "test1" "test2" "test3" > /dev/null

echo -e "${GREEN}Test data added successfully!${NC}"
echo -e "${GREEN}You should now see data in Redis Insight:${NC}"
echo -e "  - ${YELLOW}Main Redis (mono)${NC}: 5 keys including user:1 hash and recent:actions list"
echo -e "  - ${YELLOW}Test Redis (mono-test)${NC}: 5 keys including test:user:1 hash and test:queue list"
echo -e "${GREEN}Access Redis Insight at: http://localhost:5540${NC}"

# Show current key counts
echo -e "\n${YELLOW}Current key counts:${NC}"
MAIN_KEYS=$($DOCKER exec mono-redis redis-cli DBSIZE)
TEST_KEYS=$($DOCKER exec mono-test-redis redis-cli DBSIZE)
echo -e "  - Main Redis: $MAIN_KEYS keys"
echo -e "  - Test Redis: $TEST_KEYS keys"