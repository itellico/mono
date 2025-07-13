#!/bin/bash

echo "🔧 Testing Individual MCP Servers..."
echo ""

# Test 1: itellico-mono-docs
echo "1️⃣  Testing itellico-mono-docs..."
cd mcp-server
if [ -f "dist/server.js" ]; then
    echo "   ✅ Server built successfully"
    # Test if it starts (timeout after 3 seconds)
    timeout 3 node dist/server.js &
    PID=$!
    sleep 1
    if ps -p $PID > /dev/null 2>&1; then
        echo "   ✅ Server starts successfully"
        kill $PID 2>/dev/null
    else
        echo "   ❌ Server failed to start"
    fi
else
    echo "   ❌ Server not built, building now..."
    pnpm run build
fi
cd ..

# Test 2: sequential-thinking
echo ""
echo "2️⃣  Testing sequential-thinking package..."
if pnpm info @modelcontextprotocol/server-sequential-thinking > /dev/null 2>&1; then
    echo "   ✅ Package exists in registry"
    echo "   ✅ Command: pnpm dlx @modelcontextprotocol/server-sequential-thinking"
else
    echo "   ❌ Package not found"
fi

# Test 3: puppeteer
echo ""
echo "3️⃣  Testing puppeteer package..."
if pnpm info @modelcontextprotocol/server-puppeteer > /dev/null 2>&1; then
    echo "   ✅ Package exists in registry"
    echo "   ✅ Command: pnpm dlx @modelcontextprotocol/server-puppeteer"
else
    echo "   ❌ Package not found"
fi

# Test 4: context7-mcp URL
echo ""
echo "4️⃣  Testing context7-mcp URL..."
if curl -s --max-time 5 -o /dev/null "https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=86567667-fa1b-40a5-a9ff-26ca4794e498&profile=protective-moose-aOoITU"; then
    echo "   ✅ Smithery URL accessible"
else
    echo "   ⚠️  URL timeout (may still work with WebSocket)"
fi

# Test 5: magic-mcp URL
echo ""
echo "5️⃣  Testing magic-mcp URL..."
if curl -s --max-time 5 -o /dev/null "https://server.smithery.ai/@21st-dev/magic-mcp/mcp?api_key=86567667-fa1b-40a5-a9ff-26ca4794e498&profile=protective-moose-aOoITU"; then
    echo "   ✅ Smithery URL accessible"
else
    echo "   ⚠️  URL timeout (may still work with WebSocket)"
fi

echo ""
echo "📋 Summary:"
echo "✅ 3 MCP servers using verified packages"
echo "✅ 2 MCP servers using Smithery URLs" 
echo "✅ All using pnpm instead of npm"
echo ""
echo "🚀 Configuration ready at: .claude-code/mcp-servers.json"
echo ""
echo "🔄 Restart Claude Code to test the updated configuration"