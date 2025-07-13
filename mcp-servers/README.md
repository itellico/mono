# itellico Mono MCP Servers

This directory contains multiple Model Context Protocol (MCP) servers that provide specialized functionality for the itellico Mono project.

## Server Architecture

We use a domain-driven approach with multiple focused MCP servers instead of a single monolithic server:

```
mcp-servers/
├── docs-server/     # Documentation, roadmap, and knowledge base
├── api-server/      # API testing, mocking, and specifications
├── dev-server/      # Development tools and code generation
├── kanboard/        # Kanboard task management integration
└── shared/          # Shared types and utilities
```

## Available Servers

### 1. **mono-docs** - Documentation Server
**Purpose**: Manages project documentation, roadmap tracking, and knowledge base

**Key Features**:
- Search documentation by query and category
- Get architecture information and patterns
- Track development workflows
- Access code patterns and templates
- Monitor project status and priorities

**Tools**:
- `search_documentation` - Semantic search across docs
- `get_architecture_info` - Architecture patterns and conventions
- `get_development_workflow` - Step-by-step procedures
- `get_code_patterns` - Reusable code templates
- `get_project_status` - Current implementation state

### 2. **mono-api** - API Server
**Purpose**: API testing, mocking, and endpoint management

**Key Features**:
- Test API endpoints with various HTTP methods
- Generate mock data for endpoints
- Validate API responses against schemas
- Track API coverage statistics

**Tools**:
- `test_api_endpoint` - Test any API endpoint
- `get_api_coverage` - API implementation statistics
- `generate_api_mock` - Create mock responses
- `validate_api_response` - Schema validation

### 3. **mono-dev** - Development Server
**Purpose**: Code generation and development utilities

**Key Features**:
- Generate React components with TypeScript
- Create API routes following 5-tier structure
- Analyze code quality and imports
- Generate database migrations

**Tools**:
- `generate_component` - Create React components
- `generate_api_route` - Create Fastify routes
- `analyze_imports` - Import analysis
- `generate_migration` - Database migrations
- `check_code_quality` - Code quality checks

### 4. **itellico-mono-kanboard** - Task Management Server
**Purpose**: Integration with Kanboard for task and project management

**Key Features**:
- Create and manage tasks with full metadata
- Move tasks between columns and swimlanes
- Search tasks with Kanboard query syntax
- Track project status and board layout
- Add comments and collaborate

**Tools**:
- `create_task` - Create tasks with title, description, priority, color, tags
- `list_tasks` - List tasks filtered by status (active/closed/all)
- `update_task` - Update task properties
- `move_task` - Move tasks between columns
- `get_task` - Get detailed task information
- `search_tasks` - Search using Kanboard syntax
- `list_projects` - List all projects
- `get_board` - View board layout and task counts
- `add_comment` - Add comments to tasks

## Installation & Setup

### 1. Install Dependencies
```bash
# Install dependencies for all servers
cd mcp-servers/docs-server && pnpm install
cd ../api-server && pnpm install
cd ../dev-server && pnpm install
cd ../kanboard && pnpm install
```

### 2. Build Servers
```bash
# Build all servers
cd mcp-servers/docs-server && pnpm build
cd ../api-server && pnpm build
cd ../dev-server && pnpm build
```

### 3. Configuration
The servers are already configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "mono-docs": {
      "command": "node",
      "args": ["./mcp-servers/docs-server/dist/server.js"]
    },
    "mono-api": {
      "command": "node",
      "args": ["./mcp-servers/api-server/dist/server.js"]
    },
    "mono-dev": {
      "command": "node",
      "args": ["./mcp-servers/dev-server/dist/server.js"]
    }
  }
}
```

## Usage Examples

### Documentation Server
```typescript
// Search for RBAC documentation
await mcp.callTool('mono-docs', 'search_documentation', {
  query: 'RBAC permissions',
  category: 'architecture'
});

// Get current project status
await mcp.callTool('mono-docs', 'get_project_status', {
  area: 'frontend'
});
```

### API Server
```typescript
// Test an API endpoint
await mcp.callTool('mono-api', 'test_api_endpoint', {
  method: 'GET',
  path: '/api/v1/public/health'
});

// Get API coverage statistics
await mcp.callTool('mono-api', 'get_api_coverage', {
  tier: 'all'
});
```

### Development Server
```typescript
// Generate a new component
await mcp.callTool('mono-dev', 'generate_component', {
  name: 'UserDashboard',
  path: 'src/components/dashboards',
  type: 'functional'
});

// Generate API route
await mcp.callTool('mono-dev', 'generate_api_route', {
  tier: 'user',
  resource: 'notifications',
  methods: ['GET', 'POST', 'DELETE']
});
```

### Kanboard Server
```typescript
// Create a new task
await mcp.callTool('itellico-mono-kanboard', 'create_task', {
  title: 'Implement user authentication',
  project_id: 1,
  description: 'Add OAuth2 support',
  priority: 3
});

// Search for tasks
await mcp.callTool('itellico-mono-kanboard', 'search_tasks', {
  query: 'status:open assignee:me'
});
```

## Adding New Servers

To add a new MCP server:

1. Create directory: `mcp-servers/[name]-server/`
2. Copy package.json and tsconfig.json from existing server
3. Implement server.ts with your tools
4. Add to `.mcp.json` configuration
5. Build and test

## Development

### Watch Mode
```bash
# Run servers in development mode
cd mcp-servers/docs-server && pnpm dev
cd mcp-servers/api-server && pnpm dev
cd mcp-servers/dev-server && pnpm dev
```

### Testing
```bash
# Test individual server
cd mcp-servers/[server-name]
node test-server.ts
```

## Best Practices

1. **Keep servers focused** - Each server should have a single responsibility
2. **Share common code** - Use the `shared/` directory for utilities
3. **Consistent naming** - Use `mono-[domain]` pattern for server names
4. **Document tools** - Provide clear descriptions and schemas
5. **Error handling** - Always return meaningful error messages

## Troubleshooting

### Server not starting
- Check if dependencies are installed: `pnpm install`
- Ensure server is built: `pnpm build`
- Check logs in Claude's developer console

### Tool not found
- Verify server name in `.mcp.json`
- Ensure tool name matches exactly
- Check if server is running

### Permission errors
- Ensure file permissions are correct
- Check if paths are accessible

## Migration from Single Server

We migrated from `mcp-server/` to `mcp-servers/` structure:

**Old**: `mcp-server/` (single monolithic server)
**New**: `mcp-servers/[domain]-server/` (multiple focused servers)

All existing documentation YAML files are now in:
`mcp-servers/docs-server/src/data/`

## Future Servers

Planned additional servers:
- **mono-metrics** - Performance and analytics
- **mono-security** - Security scanning and policies
- **mono-deploy** - Deployment and CI/CD tools
- **mono-test** - Testing utilities and coverage