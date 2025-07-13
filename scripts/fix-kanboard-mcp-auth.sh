#!/bin/bash
# Quick fix for Kanboard MCP authentication issue

set -e

echo "🔧 Fixing Kanboard MCP Authentication"
echo "===================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env.kanboard exists
if [ ! -f ".env.kanboard" ]; then
    echo -e "${RED}Error: .env.kanboard file not found${NC}"
    echo "Creating .env.kanboard from example..."
    
    cat > .env.kanboard << 'EOF'
# Kanboard API Configuration
KANBOARD_USERNAME=jsonrpc
KANBOARD_PASSWORD=ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad
KANBOARD_API_TOKEN=ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad
KANBOARD_API_ENDPOINT=http://localhost:4041/jsonrpc.php
EOF
    echo -e "${GREEN}✓ Created .env.kanboard${NC}"
fi

# Source the Kanboard environment variables
source .env.kanboard

# Export them for MCP server
export KANBOARD_USERNAME
export KANBOARD_PASSWORD
export KANBOARD_API_TOKEN
export KANBOARD_API_ENDPOINT

echo -e "\n${YELLOW}Environment variables set:${NC}"
echo "KANBOARD_USERNAME=$KANBOARD_USERNAME"
echo "KANBOARD_API_ENDPOINT=$KANBOARD_API_ENDPOINT"
echo "KANBOARD_API_TOKEN=${KANBOARD_API_TOKEN:0:20}..."

# Test the Kanboard API connection
echo -e "\n${YELLOW}Testing Kanboard API connection...${NC}"

response=$(curl -s -X POST "$KANBOARD_API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -u "$KANBOARD_USERNAME:$KANBOARD_PASSWORD" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getVersion",
    "id": 1
  }' 2>/dev/null || echo "Connection failed")

if [[ "$response" == *"result"* ]]; then
    echo -e "${GREEN}✓ Kanboard API is accessible${NC}"
    echo "Response: $response"
else
    echo -e "${RED}✗ Failed to connect to Kanboard API${NC}"
    echo "Response: $response"
    echo -e "\n${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Make sure Kanboard is running: docker-compose ps kanboard"
    echo "2. Check if port 4041 is accessible: curl http://localhost:4041"
    echo "3. Verify the API token in Kanboard settings"
fi

# Create a wrapper script for MCP server
echo -e "\n${YELLOW}Creating MCP server wrapper...${NC}"

cat > mcp-servers/kanboard/start-with-env.sh << 'EOF'
#!/bin/bash
# Wrapper script to start Kanboard MCP server with environment variables

# Load environment variables
if [ -f "../../.env.kanboard" ]; then
    source ../../.env.kanboard
else
    echo "Warning: .env.kanboard not found, using defaults"
    export KANBOARD_USERNAME=jsonrpc
    export KANBOARD_API_ENDPOINT=http://localhost:4041/jsonrpc.php
fi

# Start the MCP server
exec node index.js
EOF

chmod +x mcp-servers/kanboard/start-with-env.sh

echo -e "${GREEN}✓ Created wrapper script${NC}"

echo -e "\n${GREEN}=== Fix Applied ===${NC}"
echo -e "\nFor Claude Desktop MCP configuration, use this in your config:"
echo -e '\n```json
{
  "mcpServers": {
    "itellico-mono-kanboard": {
      "command": "bash",
      "args": ["'$(pwd)'/mcp-servers/kanboard/start-with-env.sh"],
      "env": {
        "KANBOARD_USERNAME": "'$KANBOARD_USERNAME'",
        "KANBOARD_PASSWORD": "'$KANBOARD_PASSWORD'",
        "KANBOARD_API_ENDPOINT": "'$KANBOARD_API_ENDPOINT'"
      }
    }
  }
}
```'

echo -e "\nOr directly with node:"
echo -e '\n```json
{
  "mcpServers": {
    "itellico-mono-kanboard": {
      "command": "node",
      "args": ["'$(pwd)'/mcp-servers/kanboard/index.js"],
      "env": {
        "KANBOARD_USERNAME": "'$KANBOARD_USERNAME'",
        "KANBOARD_PASSWORD": "'$KANBOARD_PASSWORD'",
        "KANBOARD_API_ENDPOINT": "'$KANBOARD_API_ENDPOINT'"
      }
    }
  }
}
```'