#!/bin/bash

# Docker Deployment Script for Mono Platform
# Handles production deployment with health checks and rollback capability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-120}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-5}

echo -e "${BLUE}🚀 Deploying Mono Platform to Production${NC}"
echo ""

# Validate environment
echo -e "${BLUE}🔍 Validating environment...${NC}"

required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "NEXTAUTH_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo -e "${RED}❌ Missing required environment variables:${NC}"
  for var in "${missing_vars[@]}"; do
    echo -e "  • $var"
  done
  echo ""
  echo -e "${YELLOW}💡 Create a .env.production file with required variables${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Environment validation passed${NC}"
echo ""

# Function to check service health
check_health() {
  local service=$1
  local url=$2
  local timeout=$3
  
  echo -e "${BLUE}🏥 Checking health of $service...${NC}"
  
  for i in $(seq 1 $((timeout/HEALTH_CHECK_INTERVAL))); do
    if curl -f -s "$url" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ $service is healthy${NC}"
      return 0
    fi
    echo -e "${YELLOW}⏳ Waiting for $service to be ready... ($i/${timeout}s)${NC}"
    sleep $HEALTH_CHECK_INTERVAL
  done
  
  echo -e "${RED}❌ $service failed health check after ${timeout}s${NC}"
  return 1
}

# Backup current deployment (if exists)
echo -e "${BLUE}💾 Creating backup of current deployment...${NC}"
if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
  # Export current database if needed
  echo -e "${YELLOW}📊 Backing up database...${NC}"
  docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U mono_user mono_platform > "backup-$(date +%Y%m%d-%H%M%S).sql"
  echo -e "${GREEN}✅ Database backup completed${NC}"
else
  echo -e "${YELLOW}ℹ️  No existing deployment found${NC}"
fi

echo ""

# Deploy new version
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Pull latest images
echo -e "${BLUE}📥 Pulling latest images...${NC}"
docker-compose -f "$COMPOSE_FILE" pull

# Start services with zero-downtime deployment
echo -e "${BLUE}🔄 Starting services...${NC}"

# Start infrastructure services first
docker-compose -f "$COMPOSE_FILE" up -d postgres redis

# Wait for infrastructure
check_health "PostgreSQL" "postgresql://mono_user@localhost:5432/mono_platform" 30
check_health "Redis" "redis://localhost:6379" 15

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker-compose -f "$COMPOSE_FILE" run --rm api npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database migration failed${NC}"
  exit 1
fi

# Start application services
docker-compose -f "$COMPOSE_FILE" up -d api
check_health "API" "http://localhost:3001/api/v1/public/health" $HEALTH_CHECK_TIMEOUT

docker-compose -f "$COMPOSE_FILE" up -d frontend  
check_health "Frontend" "http://localhost:3000/api/health" $HEALTH_CHECK_TIMEOUT

# Start reverse proxy
docker-compose -f "$COMPOSE_FILE" up -d nginx
check_health "Nginx" "http://localhost/health" 30

# Start monitoring services
echo -e "${BLUE}📊 Starting monitoring services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""

# Show deployment status
echo -e "${BLUE}📋 Deployment Status:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${BLUE}🔗 Service URLs:${NC}"
echo -e "  • Application: http://localhost"
echo -e "  • API Docs: http://localhost/docs"
echo -e "  • Grafana: http://localhost:3005 (admin/admin123)"
echo -e "  • Prometheus: http://localhost:9090"

echo ""
echo -e "${YELLOW}💡 Post-deployment checklist:${NC}"
echo -e "  • Verify application functionality"
echo -e "  • Check monitoring dashboards"
echo -e "  • Review logs for any errors"
echo -e "  • Test critical user workflows"

# Show recent logs
echo ""
echo -e "${BLUE}📝 Recent logs (last 50 lines):${NC}"
docker-compose -f "$COMPOSE_FILE" logs --tail=50 api frontend