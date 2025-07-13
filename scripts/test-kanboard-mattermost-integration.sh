#!/bin/bash

# Test Kanboard Mattermost Integration with Authentication
# This script logs into Kanboard and checks if Mattermost integration is available

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Kanboard Mattermost Integration Test               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

KANBOARD_URL="http://192.168.178.94:4041"
USERNAME="mm"
PASSWORD="developer"

# Create a session with cookies
COOKIE_JAR="/tmp/kanboard_cookies.txt"
rm -f $COOKIE_JAR

echo -e "${YELLOW}Step 1: Testing Kanboard accessibility...${NC}"
if curl -s --max-time 10 "$KANBOARD_URL" > /dev/null; then
    echo -e "${GREEN}✅ Kanboard is accessible${NC}"
else
    echo -e "${RED}❌ Kanboard is not accessible${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Getting login page...${NC}"
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" "$KANBOARD_URL/?controller=AuthController&action=login")

# Extract CSRF token
CSRF_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o 'name="csrf_token" value="[^"]*"' | sed 's/name="csrf_token" value="//;s/"//')

if [ -z "$CSRF_TOKEN" ]; then
    echo -e "${RED}❌ Could not extract CSRF token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CSRF token extracted: ${CSRF_TOKEN:0:10}...${NC}"

echo -e "${YELLOW}Step 3: Logging in...${NC}"
LOGIN_RESULT=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -d "username=$USERNAME&password=$PASSWORD&csrf_token=$CSRF_TOKEN" \
    -X POST "$KANBOARD_URL/?controller=AuthController&action=check")

if echo "$LOGIN_RESULT" | grep -q "login"; then
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESULT" | head -3
    exit 1
else
    echo -e "${GREEN}✅ Login successful${NC}"
fi

echo -e "${YELLOW}Step 4: Checking integrations page...${NC}"
INTEGRATIONS_PAGE=$(curl -s -b "$COOKIE_JAR" "$KANBOARD_URL/?controller=ConfigController&action=integrations")

if echo "$INTEGRATIONS_PAGE" | grep -qi "mattermost"; then
    echo -e "${GREEN}🎉 SUCCESS: Mattermost integration found!${NC}"
    echo -e "${BLUE}Mattermost integration is available in settings.${NC}"
    
    # Extract Mattermost configuration section
    echo ""
    echo -e "${BLUE}Mattermost configuration section:${NC}"
    echo "$INTEGRATIONS_PAGE" | grep -A 5 -B 5 -i "mattermost" | head -10
else
    echo -e "${YELLOW}⚠️  Mattermost integration not found on integrations page${NC}"
    
    # Check plugins page
    echo -e "${YELLOW}Step 5: Checking plugins page...${NC}"
    PLUGINS_PAGE=$(curl -s -b "$COOKIE_JAR" "$KANBOARD_URL/?controller=PluginController&action=show")
    
    if echo "$PLUGINS_PAGE" | grep -qi "mattermost"; then
        echo -e "${GREEN}✅ Mattermost plugin found in plugins list${NC}"
    else
        echo -e "${RED}❌ Mattermost plugin not found in plugins list${NC}"
        echo ""
        echo -e "${BLUE}Available plugins:${NC}"
        echo "$PLUGINS_PAGE" | grep -o 'class="plugin-title"[^>]*>[^<]*' | sed 's/.*>//g' || echo "No plugins found"
    fi
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo -e "${BLUE}Manual verification:${NC}"
echo -e "${YELLOW}1. Login: $KANBOARD_URL (admin/admin)${NC}"
echo -e "${YELLOW}2. Go to: Settings > Integrations${NC}"
echo -e "${YELLOW}3. Look for: Mattermost section${NC}"
echo ""