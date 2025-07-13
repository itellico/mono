#!/bin/bash
# Restart Claude Desktop to reload MCP servers

echo "🔄 Restarting Claude Desktop to reload MCP servers..."

# Kill Claude Desktop process
pkill -f "Claude"

# Wait a moment
sleep 2

# Restart Claude Desktop
echo "🚀 Starting Claude Desktop..."
open -a "Claude"

echo "✅ Claude Desktop restarted. MCP servers should now be available."
echo ""
echo "Available MCP servers:"
echo "• puppeteer (Browser automation)"
echo "• server-sequential-thinking (Problem solving)"
echo "• magic-mcp (UI component generation)"
echo "• context7-mcp (Context management)"
echo "• itellico-mono-docs (Documentation search)"
echo "• kanboard (Task management)"
echo "• prisma-mcp (Database operations)"
echo ""
echo "Test with: /mcp"