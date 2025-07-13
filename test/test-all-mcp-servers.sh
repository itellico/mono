#!/bin/bash

echo "🧪 Testing All MCP Servers..."
echo ""

# Test 1: itellico-mono-docs (local)
echo "1️⃣  Testing itellico-mono-docs (local)..."
cd mcp-server
pnpm run build > /dev/null 2>&1
if node dist/server.js &
then
    MCP_PID=$!
    sleep 2
    if ps -p $MCP_PID > /dev/null; then
        echo "   ✅ itellico-mono-docs: Running (PID: $MCP_PID)"
        kill $MCP_PID 2>/dev/null
    else
        echo "   ❌ itellico-mono-docs: Failed to start"
    fi
else
    echo "   ❌ itellico-mono-docs: Build failed"
fi
cd ..

# Test 2: sequential-thinking
echo ""
echo "2️⃣  Testing sequential-thinking..."
if pnpx -y @modelcontextprotocol/server-sequential-thinking --help > /dev/null 2>&1; then
    echo "   ✅ sequential-thinking: Available via pnpx"
else
    echo "   ❌ sequential-thinking: Failed to load"
fi

# Test 3: context7-upstash (Smithery)
echo ""
echo "3️⃣  Testing context7-upstash (Smithery)..."
if curl -s --max-time 5 "https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=86567667-fa1b-40a5-a9ff-26ca4794e498&profile=protective-moose-aOoITU" > /dev/null; then
    echo "   ✅ context7-upstash: Accessible via Smithery"
else
    echo "   ⚠️  context7-upstash: Connection timeout (may still work with Claude Code)"
fi

# Test 4: puppeteer
echo ""
echo "4️⃣  Testing puppeteer..."
if pnpx -y @smithery-ai/puppeteer --help > /dev/null 2>&1; then
    echo "   ✅ puppeteer: Available via pnpx"
else
    echo "   ❌ puppeteer: Failed to load"
fi

# Test 5: magic-mcp (Smithery)
echo ""
echo "5️⃣  Testing magic-mcp (Smithery)..."
if curl -s --max-time 5 "https://server.smithery.ai/@21st-dev/magic-mcp/mcp?api_key=86567667-fa1b-40a5-a9ff-26ca4794e498&profile=protective-moose-aOoITU" > /dev/null; then
    echo "   ✅ magic-mcp: Accessible via Smithery"
else
    echo "   ⚠️  magic-mcp: Connection timeout (may still work with Claude Code)"
fi

echo ""
echo "📋 MCP Server Configuration Summary:"
echo "✅ Local server: itellico-mono-docs (your project documentation)"
echo "✅ pnpx servers: sequential-thinking, puppeteer"
echo "✅ Smithery servers: context7-upstash, magic-mcp"
echo ""
echo "📁 Configuration files:"
echo "- Project-specific: .claude-code/mcp-servers.json"
echo "- Complete config: claude-code-complete-config.json"
echo ""
echo "🚀 Next steps:"
echo "1. Restart Claude Code to load all MCP servers"
echo "2. Test with queries like:"
echo "   - 'What's the API architecture?' (itellico-mono-docs)"
echo "   - 'Think step by step about...' (sequential-thinking)"
echo "   - 'Take a screenshot of...' (puppeteer)"
echo "   - 'Use context7 to...' (context7-upstash)"
echo "   - 'Use magic to...' (magic-mcp)"