#!/bin/bash

# Fix Kanboard Mattermost Plugin Integration
# This script ensures the Mattermost plugin is properly configured with persistent storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Kanboard Mattermost Plugin Integration Fix            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Ensure persistent directories exist
echo -e "${YELLOW}Step 1: Creating persistent directories...${NC}"
mkdir -p docker-data/apps/kanboard/plugins
mkdir -p docker-data/apps/kanboard/data
echo -e "${GREEN}✅ Directories created${NC}"

# Step 2: Copy Mattermost plugin if not already there
if [ ! -d "docker-data/apps/kanboard/plugins/Mattermost" ]; then
    echo -e "${YELLOW}Step 2: Copying Mattermost plugin...${NC}"
    cp -r php/kanboard/plugins/Mattermost docker-data/apps/kanboard/plugins/
    echo -e "${GREEN}✅ Mattermost plugin copied${NC}"
else
    echo -e "${GREEN}✅ Mattermost plugin already in persistent storage${NC}"
fi

# Step 3: Set proper permissions
echo -e "${YELLOW}Step 3: Setting permissions...${NC}"
chmod -R 755 docker-data/apps/kanboard/plugins/Mattermost
echo -e "${GREEN}✅ Permissions set${NC}"

# Step 4: Verify plugin files exist
echo -e "${YELLOW}Step 4: Verifying plugin files...${NC}"
if [ -f "docker-data/apps/kanboard/plugins/Mattermost/Plugin.php" ]; then
    echo -e "${GREEN}✅ Plugin.php exists${NC}"
else
    echo -e "${RED}❌ Plugin.php missing${NC}"
    exit 1
fi

# Step 5: Restart services
echo -e "${YELLOW}Step 5: Restarting services...${NC}"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker-compose restart php nginx-kanboard
echo -e "${GREEN}✅ Services restarted${NC}"

# Step 6: Wait and test
echo -e "${YELLOW}Step 6: Testing integration...${NC}"
sleep 10

# Test if Mattermost plugin is loaded
if curl -s "http://192.168.178.94:4041/?controller=ConfigController&action=integrations" | grep -qi mattermost; then
    echo -e "${GREEN}🎉 SUCCESS: Mattermost integration is available!${NC}"
    echo -e "${BLUE}Access it at: http://192.168.178.94:4041/?controller=ConfigController&action=integrations${NC}"
else
    echo -e "${YELLOW}⚠️  Plugin may need manual activation in Kanboard admin${NC}"
    echo -e "${BLUE}1. Go to: http://192.168.178.94:4041/?controller=PluginController&action=show${NC}"
    echo -e "${BLUE}2. Check if Mattermost plugin is listed${NC}"
    echo -e "${BLUE}3. If not, check the logs for errors${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Troubleshooting:${NC}"
echo -e "${YELLOW}• Plugin directory: docker-data/apps/kanboard/plugins/Mattermost${NC}"
echo -e "${YELLOW}• Config file: docker/configs/kanboard/config.php${NC}"
echo -e "${YELLOW}• Check logs: docker-compose logs php${NC}"
echo ""
echo -e "${GREEN}✅ Mattermost plugin setup complete!${NC}"