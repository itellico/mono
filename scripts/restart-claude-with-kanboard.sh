#!/bin/bash

# Script to restart Claude Desktop with Kanboard environment variables
# This ensures the MCP server has access to the credentials

echo "Restarting Claude Desktop with Kanboard environment variables..."

# Source the main .env file to get credentials
source /Users/mm2/dev_mm/mono/.env

# Kill existing Claude Desktop process
pkill -f "Claude.app" || true

# Wait a moment
sleep 2

# Start Claude Desktop with environment variables
KANBOARD_USERNAME="$KANBOARD_USERNAME" \
KANBOARD_PASSWORD="$KANBOARD_PASSWORD" \
KANBOARD_API_TOKEN="$KANBOARD_API_TOKEN" \
KANBOARD_API_ENDPOINT="$KANBOARD_API_ENDPOINT" \
open -a "Claude"

echo "Claude Desktop restarted with Kanboard credentials."
echo ""
echo "The MCP server should now have access to:"
echo "- KANBOARD_USERNAME: $KANBOARD_USERNAME"
echo "- KANBOARD_API_ENDPOINT: $KANBOARD_API_ENDPOINT"
echo ""
echo "Try creating a task again with the mcp__kanboard-mcp__create_task tool."