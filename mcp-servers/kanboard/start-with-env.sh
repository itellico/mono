#!/bin/bash

# Load environment variables from main .env file
if [ -f "/Users/mm2/dev_mm/mono/.env" ]; then
    export $(cat /Users/mm2/dev_mm/mono/.env | grep -E '^KANBOARD_' | xargs)
fi

# Start the MCP server
exec node /Users/mm2/dev_mm/mono/mcp-servers/kanboard/index.js