#!/bin/bash
# Test Infrastructure Setup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Setting up test infrastructure...${NC}"

# Function to wait for service
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}⏳ Waiting for $service on port $port...${NC}"
    
    while ! nc -z localhost $port; do
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ $service failed to start on port $port${NC}"
            exit 1
        fi
        sleep 1
    done
    
    echo -e "${GREEN}✅ $service is ready on port $port${NC}"
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}🔄 Running test database migrations...${NC}"
    cd "$PROJECT_ROOT/apps/api"
    
    # Wait a bit more for PostgreSQL to be fully ready
    sleep 2
    
    # Run migrations
    DATABASE_URL="postgresql://postgres:testpass123@localhost:5433/mono_test" pnpm prisma migrate deploy
    
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Function to seed test data
seed_test_data() {
    echo -e "${YELLOW}🌱 Seeding test database...${NC}"
    cd "$PROJECT_ROOT/apps/api"
    
    # Run test seeder
    DATABASE_URL="postgresql://postgres:testpass123@localhost:5433/mono_test" \
    REDIS_URL="redis://localhost:6380" \
    pnpm tsx scripts/seed-test-data.ts
    
    echo -e "${GREEN}✅ Test data seeded${NC}"
}

# Parse command line arguments
COMMAND=${1:-up}
PROFILE=${2:-default}

case $COMMAND in
    up)
        echo -e "${GREEN}🚀 Starting test infrastructure...${NC}"
        
        # Start Docker services
        if [ "$PROFILE" = "security" ]; then
            docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" --profile security up -d
        else
            docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" up -d
        fi
        
        # Wait for services
        wait_for_service "PostgreSQL" 5433
        wait_for_service "Redis" 6380
        wait_for_service "Mailpit" 1026
        
        # Run migrations
        run_migrations
        
        # Seed test data
        seed_test_data
        
        echo -e "${GREEN}✅ Test infrastructure is ready!${NC}"
        echo -e "${GREEN}📊 Services:${NC}"
        echo -e "  - PostgreSQL: localhost:5433"
        echo -e "  - Redis: localhost:6380"
        echo -e "  - Mailpit: http://localhost:8026"
        if [ "$PROFILE" = "security" ]; then
            echo -e "  - OWASP ZAP: http://localhost:8090"
        fi
        ;;
        
    down)
        echo -e "${YELLOW}🛑 Stopping test infrastructure...${NC}"
        docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" down -v
        echo -e "${GREEN}✅ Test infrastructure stopped${NC}"
        ;;
        
    reset)
        echo -e "${YELLOW}♻️ Resetting test database...${NC}"
        cd "$PROJECT_ROOT/apps/api"
        DATABASE_URL="postgresql://postgres:testpass123@localhost:5433/mono_test" pnpm prisma migrate reset --force
        seed_test_data
        echo -e "${GREEN}✅ Test database reset${NC}"
        ;;
        
    logs)
        docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" logs -f
        ;;
        
    *)
        echo "Usage: $0 {up|down|reset|logs} [profile]"
        echo "Profiles: default, security"
        exit 1
        ;;
esac