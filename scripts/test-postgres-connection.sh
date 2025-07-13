#!/bin/bash

# Test PostgreSQL Connection and List Databases
# This script helps troubleshoot PostgreSQL admin connection issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            PostgreSQL Connection Test                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker PostgreSQL is running
echo -e "${BLUE}🐳 Checking Docker PostgreSQL container...${NC}"
if docker-compose ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker PostgreSQL container is running${NC}"
else
    echo -e "${RED}❌ Docker PostgreSQL container is not running${NC}"
    echo -e "${YELLOW}Run: docker-compose up -d postgres${NC}"
    exit 1
fi

# Test connection from inside container
echo -e "\n${BLUE}🔗 Testing connection from inside Docker container...${NC}"
docker-compose exec postgres psql -U developer -d postgres -c "SELECT version();" | head -3

# Test external connection
echo -e "\n${BLUE}🌐 Testing external connection (port 5432)...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}psql command found, testing connection...${NC}"
    PGPASSWORD=developer psql -h 192.168.178.94 -p 5432 -U developer -d postgres -c "SELECT current_database(), current_user;" || {
        echo -e "${RED}❌ External connection failed${NC}"
        echo -e "${YELLOW}💡 This might be why your admin tool only sees some databases${NC}"
    }
else
    echo -e "${YELLOW}⚠️  psql not found locally, skipping external test${NC}"
fi

# List all databases
echo -e "\n${BLUE}📊 All databases in Docker PostgreSQL:${NC}"
docker-compose exec postgres psql -U developer -d postgres -c "
SELECT 
    datname as \"Database Name\",
    pg_size_pretty(pg_database_size(datname)) as \"Size\",
    datcollate as \"Collation\"
FROM pg_database 
WHERE datistemplate = false 
ORDER BY datname;
"

# Check connection details
echo -e "\n${CYAN}📋 Connection Details for your PostgreSQL Admin Tool:${NC}"
echo -e "${GREEN}  Host:     192.168.178.94 (or localhost)${NC}"
echo -e "${GREEN}  Port:     5432${NC}"
echo -e "${GREEN}  Username: developer${NC}"
echo -e "${GREEN}  Password: developer${NC}"
echo -e "${GREEN}  Database: postgres (or mono)${NC}"
echo ""

# Check for local PostgreSQL
echo -e "${BLUE}🔍 Checking for local PostgreSQL instances...${NC}"
if pgrep -f "postgres" > /dev/null; then
    echo -e "${YELLOW}⚠️  Local PostgreSQL processes found:${NC}"
    pgrep -fl "postgres" | head -5
    echo -e "${YELLOW}💡 You might have a local PostgreSQL instance on the same port${NC}"
    echo -e "${YELLOW}   This could cause your admin tool to connect to the wrong instance${NC}"
else
    echo -e "${GREEN}✅ No local PostgreSQL processes found${NC}"
fi

# Check port usage
echo -e "\n${BLUE}🔌 Checking what's listening on port 5432...${NC}"
lsof -i :5432 | head -5 || echo "No processes found on port 5432"

echo ""
echo -e "${CYAN}🔧 Troubleshooting Tips:${NC}"
echo -e "${YELLOW}1. Make sure your admin tool connects to 192.168.178.94:5432${NC}"
echo -e "${YELLOW}2. Use credentials: developer/developer${NC}"
echo -e "${YELLOW}3. If you have local PostgreSQL, stop it or use different port${NC}"
echo -e "${YELLOW}4. Try connecting to 'postgres' database first, then browse others${NC}"
echo ""