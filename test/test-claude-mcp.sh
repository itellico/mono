#!/bin/bash

# Test Claude Code MCP Integration

echo "🧪 Testing Claude Code MCP Integration..."

# Ensure MCP server is built
echo "📦 Building MCP server..."
cd mcp-server
pnpm run build

# Start MCP server in background for testing
echo "🚀 Starting MCP server..."
node dist/server.js &
MCP_PID=$!

# Wait a moment for server to start
sleep 2

# Test if server is responsive
echo "🔍 Testing MCP server responsiveness..."
if ps -p $MCP_PID > /dev/null; then
    echo "✅ MCP server is running (PID: $MCP_PID)"
else
    echo "❌ MCP server failed to start"
    exit 1
fi

# Clean up
echo "🧹 Cleaning up..."
kill $MCP_PID 2>/dev/null

echo ""
echo "📋 Next Steps:"
echo "1. Restart Claude Code to load MCP configuration"
echo "2. In Claude Code, try asking: 'What's the API architecture?'"
echo "3. Claude should automatically call the get_architecture_info tool"
echo ""
echo "📁 Configuration files created:"
echo "- Project: .claude-code/mcp-servers.json"
echo "- Global: claude-code-global-config.json"
echo ""
echo "🎯 If Claude Code doesn't recognize MCP servers:"
echo "- Copy claude-code-global-config.json to ~/.config/claude-code/mcp-servers.json"
echo "- Or check Claude Code documentation for MCP configuration location"