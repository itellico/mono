# itellico Mono MCP Server

Model Context Protocol (MCP) server that provides structured access to itellico Mono project documentation, architecture patterns, development workflows, and current project status.

## Purpose

This MCP server replaces the static `CLAUDE.md` file with a dynamic, queryable system that allows Claude Code to:

- Search documentation semantically
- Get architectural information on-demand
- Access development workflows and procedures
- Retrieve code patterns and templates
- Check current project status and priorities

## Architecture

```
mcp-server/
├── src/
│   ├── server.ts              # Main MCP server
│   ├── handlers/              # Tool handlers
│   │   ├── base.ts           # Base handler with common functionality
│   │   ├── documentation.ts  # Document search and retrieval
│   │   ├── architecture.ts   # System architecture information
│   │   ├── workflows.ts      # Development procedures
│   │   ├── patterns.ts       # Code patterns and templates
│   │   └── project-status.ts # Current project state
│   └── data/                  # Structured documentation
│       ├── architecture/      # Architecture documentation
│       ├── workflows/         # Development workflows
│       └── patterns/          # Code patterns
├── dist/                      # Compiled JavaScript
└── test-server.ts            # Test script
```

## MCP Tools

### 1. `search_documentation`
**Purpose**: Semantic search across all project documentation

**Parameters**:
- `query` (required): Search query
- `category` (optional): Filter by category (architecture, features, guides, etc.)
- `limit` (optional): Maximum results (default: 5)

**Example**:
```json
{
  "query": "API authentication",
  "category": "architecture",
  "limit": 3
}
```

### 2. `get_architecture_info`
**Purpose**: Get specific architectural information and patterns

**Parameters**:
- `component` (required): System component (api, frontend, database, cache, auth, monitoring)
- `aspect` (optional): Specific aspect (structure, patterns, conventions, security, performance)

**Example**:
```json
{
  "component": "api",
  "aspect": "structure"
}
```

### 3. `get_development_workflow`
**Purpose**: Get step-by-step development workflows

**Parameters**:
- `task` (required): Development task type (new-feature, bug-fix, testing, api-route, component)
- `context` (optional): Additional context

**Example**:
```json
{
  "task": "new-feature",
  "context": "Adding user profile management"
}
```

### 4. `get_code_patterns`
**Purpose**: Get reusable code patterns and templates

**Parameters**:
- `pattern_type` (required): Pattern type (component, service, route, hook, util, test)
- `technology` (optional): Technology stack (react, fastify, prisma, typescript)

**Example**:
```json
{
  "pattern_type": "route",
  "technology": "fastify"
}
```

### 5. `get_project_status`
**Purpose**: Get current project status and priorities

**Parameters**:
- `area` (optional): Project area (overall, frontend, backend, features, infrastructure, documentation)

**Example**:
```json
{
  "area": "backend"
}
```

## Setup

### 1. Install Dependencies
```bash
cd mcp-server
pnpm install
```

### 2. Build Server
```bash
pnpm run build
```

### 3. Test Server
```bash
pnpm run test
```

### 4. Configure Claude Code
Add to Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "itellico-mono-docs": {
      "command": "node",
      "args": ["./dist/server.js"],
      "cwd": "/path/to/mono/mcp-server",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Development

### Start in Development Mode
```bash
pnpm run dev
```

### Add New Documentation
1. Create YAML files in `src/data/` with frontmatter:
```yaml
---
title: "Document Title"
category: "architecture"
tags: ["api", "routes"]
priority: "high"
---

# Content here
```

2. Rebuild: `pnpm run build`

### Add New Patterns
Add patterns to `src/handlers/patterns.ts` following the existing structure.

### Add New Workflows
Add workflows to `src/handlers/workflows.ts` with step-by-step instructions.

## Integration with Claude Code

Once configured, Claude Code will:

1. **On startup**: Call `get_project_status` to understand current state
2. **Before implementing**: Call `search_documentation` for relevant info  
3. **When coding**: Call `get_code_patterns` for proper templates
4. **For architecture decisions**: Call `get_architecture_info`
5. **For procedures**: Call `get_development_workflow`

This replaces the static `CLAUDE.md` with dynamic, contextual knowledge retrieval.

## Benefits

- **Dynamic Knowledge**: Always up-to-date project information
- **Semantic Search**: Find relevant information using natural language
- **Structured Patterns**: Consistent code generation templates
- **Project Awareness**: Claude understands current status and priorities
- **Centralized Truth**: Single source of documentation truth
- **Contextual Help**: Get specific information based on current task

## File Structure

### Documentation Loading
- **Project Docs**: Automatically loads from `../docs/**/*.md`
- **Structured Docs**: Loads from `src/data/**/*.{yaml,yml,md}`
- **Search Index**: Uses Fuse.js for fuzzy search across all content

### Data Organization
- **architecture/**: System design and patterns
- **workflows/**: Development procedures
- **patterns/**: Code templates and examples
- **features/**: Feature-specific documentation

The MCP server provides a modern, queryable interface to all project knowledge, making Claude Code significantly more effective at understanding and working with the itellico Mono codebase.