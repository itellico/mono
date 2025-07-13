#!/bin/bash

# Setup and run Docusaurus documentation server
# This script sets up Docusaurus in Docker for offline documentation access

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Docusaurus Documentation Setup Script   ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Create .gitignore for Docusaurus if it doesn't exist
if [ ! -f "docker/docusaurus/.gitignore" ]; then
    echo -e "${YELLOW}Creating .gitignore for Docusaurus...${NC}"
    cat > docker/docusaurus/.gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
build/
dist/

# Generated files
.docusaurus
.cache-loader

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
EOF
    echo -e "${GREEN}✓ Created .gitignore${NC}"
fi

# Create placeholder images if they don't exist
if [ ! -f "docker/docusaurus/static/img/logo.svg" ]; then
    echo -e "${YELLOW}Creating placeholder logo...${NC}"
    cat > docker/docusaurus/static/img/logo.svg << 'EOF'
<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="#2563eb"/>
  <text x="20" y="25" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">M</text>
</svg>
EOF
    echo -e "${GREEN}✓ Created placeholder logo${NC}"
fi

# Create favicon if it doesn't exist
if [ ! -f "docker/docusaurus/static/img/favicon.ico" ]; then
    echo -e "${YELLOW}Creating favicon...${NC}"
    # Copy from main project if exists, otherwise create placeholder
    if [ -f "public/favicon.ico" ]; then
        cp public/favicon.ico docker/docusaurus/static/img/favicon.ico
    else
        # Create a simple 16x16 favicon (base64 encoded)
        echo "AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAAAAAAAAAAAAAD///8AJSblACUm5QAlJuUAJSblACUm5QAlJuUAJSblACUm5QAlJuUAJSblAP///wAAAAAAAAAAAAAAAAD///8AJSblFyUm5bAlJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSblsCUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSbl/yUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblFyUm5bAlJuX/JSbl/yUm5f8lJuX/JSbl/yUm5f8lJuX/JSblsCUm5Rf///8AAAAAAAAAAAAAAAD///8AJSblACUm5QAlJuUAJSblACUm5QAlJuUAJSblACUm5QAlJuUAJSblAP///wAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" | base64 -d > docker/docusaurus/static/img/favicon.ico
    fi
    echo -e "${GREEN}✓ Created favicon${NC}"
fi

# Check if mono-network exists
if ! docker network ls | grep -q mono-network; then
    echo -e "${YELLOW}Creating mono-network...${NC}"
    docker network create mono-network
    echo -e "${GREEN}✓ Created Docker network${NC}"
fi

# Build and start Docusaurus
echo -e "${BLUE}Building Docusaurus container...${NC}"
docker-compose -f docker-compose.docs.yml build

echo -e "${BLUE}Starting Docusaurus...${NC}"
docker-compose -f docker-compose.docs.yml up -d

# Wait for container to be ready
echo -e "${YELLOW}Waiting for Docusaurus to start...${NC}"
sleep 10

# Check if Docusaurus is running
if curl -s http://localhost:3005 > /dev/null; then
    echo -e "${GREEN}✓ Docusaurus is running!${NC}"
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Docusaurus Documentation is Ready!      ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Access your documentation at:${NC}"
    echo -e "${CYAN}→ http://localhost:3005${NC}"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  View logs:    ${CYAN}docker-compose -f docker-compose.docs.yml logs -f${NC}"
    echo -e "  Stop:         ${CYAN}docker-compose -f docker-compose.docs.yml down${NC}"
    echo -e "  Restart:      ${CYAN}docker-compose -f docker-compose.docs.yml restart${NC}"
    echo -e "  Rebuild:      ${CYAN}docker-compose -f docker-compose.docs.yml build --no-cache${NC}"
    echo ""
else
    echo -e "${RED}✗ Docusaurus failed to start. Check logs:${NC}"
    echo -e "${CYAN}docker-compose -f docker-compose.docs.yml logs${NC}"
    exit 1
fi