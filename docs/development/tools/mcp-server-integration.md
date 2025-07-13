---
title: MCP Server Integration
sidebar_label: Overview
---

# MCP Server Integration

> **Note**: This page provides a quick overview. For detailed documentation, see [MCP Servers Documentation](../mcp-servers/).

Model Context Protocol (MCP) server integration for enhanced development workflow, documentation access, and project management capabilities.

## Overview

MCP servers provide Claude with direct access to project resources, enabling:

- **Documentation Search**: Semantic search through project documentation
- **Task Management**: Integration with Kanboard project management
- **Prototype Access**: Click-dummy UI prototype exploration
- **Code Patterns**: Reusable patterns and templates
- **Architecture Info**: System design and structure guidance

## Current MCP Servers

### 1. Documentation Server (`mcp__docs-mcp`)

Provides semantic search and architectural information from project documentation.

**Available Functions:**
- `search_documentation` - Search project docs semantically
- `get_architecture_info` - Get architectural patterns and info
- `get_development_workflow` - Get step-by-step development procedures
- `get_code_patterns` - Get reusable code templates
- `get_project_status` - Check current project status

**Example Usage:**
```javascript
// Search for caching documentation
mcp__docs-mcp__search_documentation({
  query: "caching strategy Redis",
  category: "architecture",
  limit: 5
});

// Get API architecture info
mcp__docs-mcp__get_architecture_info({
  component: "api",
  aspect: "structure"
});
```

### 2. Kanboard Server (`mcp__kanboard-mcp`)

Integrates with Kanboard for project management and task tracking.

**Available Functions:**
- `list_tasks` - List project tasks
- `create_task` - Create new tasks
- `update_task` - Update existing tasks
- `move_task` - Move tasks between columns
- `get_task` - Get detailed task information
- `search_tasks` - Search tasks by query
- `add_comment` - Add comments to tasks

**Example Usage:**
```javascript
// List active tasks
mcp__kanboard-mcp__list_tasks({
  project_id: 1,
  status: "active"
});

// Create new task
mcp__kanboard-mcp__create_task({
  title: "Implement user authentication",
  description: "Add JWT-based authentication system",
  priority: 2,
  tags: ["auth", "security"]
});
```

### 3. Click-Dummy Server (`mcp__click-dummy-mcp`)

Provides access to PHP-based UI prototypes and implementation mapping.

**Available Functions:**
- `search_click_dummy` - Search for UI prototypes
- `get_prototype_details` - Get detailed prototype information
- `list_prototype_features` - List available features
- `get_feature_implementation_map` - Map prototypes to implementation
- `get_ui_components` - Get reusable UI components

**Example Usage:**
```javascript
// Search for dashboard prototypes
mcp__click-dummy-mcp__search_click_dummy({
  query: "dashboard",
  tier: "tenant",
  feature_type: "dashboard"
});

// Get implementation mapping
mcp__click-dummy-mcp__get_feature_implementation_map({
  feature: "user-profile"
});
```

## Adding a New MCP Server

### Step 1: Create MCP Server Package

```bash
# Create new MCP server package
mkdir packages/mcp-servers/your-server-name
cd packages/mcp-servers/your-server-name

# Initialize package
pnpm init
```

### Step 2: Install MCP Dependencies

```json
{
  "name": "@itellico/mcp-your-server-name",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  }
}
```

### Step 3: Implement MCP Server

```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'your-server-name',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'your_tool_name',
        description: 'Description of what your tool does',
        inputSchema: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'Parameter description',
            },
          },
          required: ['param1'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'your_tool_name':
      try {
        // Implement your tool logic here
        const result = await yourToolFunction(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
  }
});

// Tool implementation
async function yourToolFunction(args: any) {
  // Implement your tool logic
  return {
    success: true,
    data: 'Your tool result',
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

### Step 4: Add TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Register with Claude

Add your MCP server to Claude's configuration:

```json
// ~/.config/claude-desktop/claude_desktop_config.json
{
  "mcpServers": {
    "your-server-name": {
      "command": "node",
      "args": [
        "/path/to/your/project/packages/mcp-servers/your-server-name/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Step 6: Development Script

```bash
#!/bin/bash
# scripts/mcp-dev.sh

# Build all MCP servers
echo "🏗️  Building MCP servers..."
for server in packages/mcp-servers/*; do
  if [ -d "$server" ]; then
    echo "Building $(basename $server)..."
    cd "$server"
    pnpm build
    cd - > /dev/null
  fi
done

# Restart Claude (if needed)
echo "🔄 Restart Claude Desktop to load updated servers"
```

## Best Practices

### 1. Error Handling

```typescript
// Always wrap tool implementations in try-catch
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await yourToolFunction(request.params.arguments);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});
```

### 2. Input Validation

```typescript
import { z } from 'zod';

const toolInputSchema = z.object({
  param1: z.string().min(1),
  param2: z.number().optional(),
});

// Validate inputs
const validatedArgs = toolInputSchema.parse(args);
```

### 3. Logging

```typescript
// Add structured logging
import { createLogger } from 'winston';

const logger = createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'mcp-server.log' }),
  ],
});

// Use in tool functions
logger.info('Tool executed', { tool: name, args });
```

### 4. Environment Configuration

```typescript
// Load environment-specific configs
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  apiKey: process.env.API_KEY,
  debug: process.env.DEBUG === 'true',
};
```

### 5. Resource Management

```typescript
// Properly handle resources
class YourMCPServer {
  private client: SomeClient;

  constructor() {
    this.client = new SomeClient();
  }

  async cleanup() {
    await this.client.disconnect();
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  await server.cleanup();
  process.exit(0);
});
```

## Testing MCP Servers

### Unit Tests

```typescript
// tests/your-server.test.ts
import { describe, it, expect } from 'vitest';
import { yourToolFunction } from '../src/index.js';

describe('Your MCP Server', () => {
  it('should handle valid input', async () => {
    const result = await yourToolFunction({
      param1: 'test-value',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should throw error for invalid input', async () => {
    await expect(
      yourToolFunction({
        param1: '',
      })
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { spawn } from 'child_process';
import { describe, it, expect } from 'vitest';

describe('MCP Server Integration', () => {
  it('should respond to list tools request', async () => {
    const server = spawn('node', ['dist/index.js']);
    
    // Send MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Wait for response
    const response = await new Promise((resolve) => {
      server.stdout.on('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });
    
    expect(response.result.tools).toBeDefined();
    
    server.kill();
  });
});
```

## Debugging

### 1. Enable Debug Logging

```bash
# Set debug environment
export DEBUG=mcp:*

# Run server with debug output
node dist/index.js 2> debug.log
```

### 2. Test Server Manually

```bash
# Test server communication
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

### 3. Claude Configuration Check

```bash
# Check if Claude can find your server
claude-desktop --debug
```

## Performance Considerations

### 1. Response Time

```typescript
// Add timing to tool functions
async function yourToolFunction(args: any) {
  const start = performance.now();
  
  try {
    const result = await actualWork(args);
    const duration = performance.now() - start;
    
    logger.info('Tool performance', { duration, tool: 'your_tool_name' });
    return result;
  } catch (error) {
    logger.error('Tool error', { error: error.message });
    throw error;
  }
}
```

### 2. Caching

```typescript
// Implement caching for expensive operations
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function cachedToolFunction(args: any) {
  const cacheKey = JSON.stringify(args);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await expensiveOperation(args);
  cache.set(cacheKey, result);
  
  return result;
}
```

### 3. Resource Limits

```typescript
// Implement resource limits
const rateLimiter = new Map<string, number>();

function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const lastCall = rateLimiter.get(toolName) || 0;
  const minInterval = 1000; // 1 second
  
  if (now - lastCall < minInterval) {
    return false;
  }
  
  rateLimiter.set(toolName, now);
  return true;
}
```

## Common Integration Patterns

### 1. Database Integration

```typescript
// Database connection example
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function databaseToolFunction(args: any) {
  const data = await prisma.yourModel.findMany({
    where: args.filter,
    take: args.limit || 10,
  });
  
  return {
    success: true,
    data,
  };
}
```

### 2. API Integration

```typescript
// External API integration
import axios from 'axios';

async function apiToolFunction(args: any) {
  const response = await axios.get(`${config.apiUrl}/endpoint`, {
    params: args,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
  });
  
  return {
    success: true,
    data: response.data,
  };
}
```

### 3. File System Integration

```typescript
// File system operations
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function fileToolFunction(args: any) {
  const filePath = path.join(process.cwd(), args.path);
  
  if (args.action === 'read') {
    const content = await readFile(filePath, 'utf8');
    return { success: true, content };
  }
  
  if (args.action === 'write') {
    await writeFile(filePath, args.content);
    return { success: true };
  }
  
  throw new Error(`Unknown action: ${args.action}`);
}
```

## Security Considerations

### 1. Input Sanitization

```typescript
// Sanitize file paths
import path from 'path';

function sanitizePath(inputPath: string): string {
  // Remove path traversal attempts
  const normalized = path.normalize(inputPath);
  
  if (normalized.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
  
  return normalized;
}
```

### 2. Authentication

```typescript
// Add authentication if needed
function authenticateRequest(headers: any): boolean {
  const token = headers.authorization?.replace('Bearer ', '');
  
  if (!token || !isValidToken(token)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      'Authentication required'
    );
  }
  
  return true;
}
```

### 3. Rate Limiting

```typescript
// Implement rate limiting
const rateLimits = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(clientId) || { count: 0, resetTime: now + 60000 };
  
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + 60000;
  }
  
  if (limit.count >= 100) { // 100 requests per minute
    return false;
  }
  
  limit.count++;
  rateLimits.set(clientId, limit);
  
  return true;
}
```

## Troubleshooting

### Common Issues

1. **Server Not Found**: Check Claude configuration and server path
2. **Tool Not Available**: Verify tool registration in ListToolsRequestSchema
3. **Permission Denied**: Check file permissions and server execution rights
4. **Performance Issues**: Add caching and optimize expensive operations
5. **Memory Leaks**: Implement proper cleanup and resource management
6. **Empty Command Output**: MCP server configuration or connectivity issues

### Debug Steps

1. Check server logs for errors
2. Verify MCP protocol compliance
3. Test server independently
4. Check Claude configuration
5. Verify network connectivity (if applicable)

### Specific Fix: MCP Server Empty Output Issue

**Problem**: MCP commands returning `(no content)` instead of expected responses.

**Symptoms**:
- Running `/mcp` command shows empty output
- MCP tools fail to return proper responses
- Auto-coding workflows break
- Documentation search fails

**Root Cause**: MCP server configuration or connection issues preventing proper command execution.

**Solution Applied**:
1. **Verify MCP Server Configuration**: Check that all MCP servers are properly configured in Claude's settings
2. **Test Server Connectivity**: Confirm each MCP server can respond to basic queries
3. **Restart MCP Services**: Restart Claude Desktop to reload MCP server connections
4. **Validate Tool Registration**: Ensure all MCP tools are properly registered and accessible

**Verification Steps**:
```bash
# Test MCP functionality
/mcp  # Should return proper MCP server status, not empty content

# Test specific MCP servers
mcp__docs-mcp__search_documentation  # Should return documentation results
mcp__kanboard-mcp__list_tasks        # Should return task list
mcp__click-dummy-mcp__search_click_dummy  # Should return prototype search
```

**Impact of Fix**:
- ✅ Restored auto-coding workflow functionality
- ✅ Documentation search capabilities working
- ✅ Kanban task management integration operational
- ✅ Click-dummy prototype analysis functional
- ✅ Enhanced development productivity restored

**Prevention**:
- Regularly test MCP server connectivity
- Monitor MCP server logs for errors
- Keep MCP server configurations updated
- Implement health checks for critical MCP servers

This fix is critical for maintaining the automated development workflow system that depends on MCP server integration.

## Related Documentation

- [Development Tools Overview](/development/tools)
- [API Design Patterns](/architecture/api-design)
- [Testing Methodology](/development/testing/methodology)
- [Development Workflow](/development/workflows/complete-workflow)