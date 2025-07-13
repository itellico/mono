---
title: Documentation MCP Server
sidebar_label: Documentation Server
description: Semantic search and knowledge retrieval from project documentation
---

# Documentation MCP Server

Provides intelligent access to project documentation through semantic search, architectural patterns, and development workflows.

## Overview

The Documentation MCP server enables:
- Semantic search across all documentation
- Architecture pattern retrieval
- Development workflow guidance
- Code pattern templates
- Project status tracking

## Available Functions

### Search Documentation

```javascript
mcp__docs-mcp__search_documentation({
  query: "caching strategy Redis",
  category: "architecture", // optional
  limit: 5
});
```

**Categories:**
- `architecture` - System design and patterns
- `features` - Feature documentation
- `guides` - How-to guides
- `api` - API documentation
- `testing` - Testing strategies
- `deployment` - Deployment guides

### Get Architecture Info

```javascript
mcp__docs-mcp__get_architecture_info({
  component: "api",
  aspect: "patterns" // optional
});
```

**Components:**
- `api` - Backend API architecture
- `frontend` - React/Next.js patterns
- `database` - PostgreSQL/Prisma design
- `cache` - Redis caching layer
- `auth` - Authentication system
- `monitoring` - Observability stack
- `deployment` - Infrastructure

**Aspects:**
- `structure` - Component organization
- `patterns` - Design patterns
- `conventions` - Coding standards
- `security` - Security measures
- `performance` - Optimization strategies

### Get Development Workflow

```javascript
mcp__docs-mcp__get_development_workflow({
  task: "new-feature",
  context: "Add user dashboard with real-time updates"
});
```

**Task Types:**
- `new-feature` - Feature implementation
- `bug-fix` - Bug resolution
- `testing` - Test implementation
- `deployment` - Deployment process
- `api-route` - API endpoint creation
- `component` - React component
- `migration` - Database migration

### Get Code Patterns

```javascript
mcp__docs-mcp__get_code_patterns({
  pattern_type: "component",
  technology: "react"
});
```

**Pattern Types:**
- `component` - UI components
- `service` - Business logic
- `route` - API routes
- `hook` - React hooks
- `util` - Utility functions
- `test` - Test patterns
- `migration` - DB migrations

**Technologies:**
- `react` - React/Next.js
- `fastify` - API framework
- `prisma` - ORM patterns
- `typescript` - Type patterns
- `tailwind` - Styling
- `tanstack-query` - Data fetching

### Get Project Status

```javascript
mcp__docs-mcp__get_project_status({
  area: "frontend" // optional
});
```

**Areas:**
- `overall` - Full project status
- `frontend` - UI implementation
- `backend` - API development
- `features` - Feature completion
- `infrastructure` - DevOps status
- `documentation` - Docs coverage

## Usage Examples

### Finding Implementation Patterns

```javascript
// Search for authentication patterns
const authDocs = await mcp__docs-mcp__search_documentation({
  query: "authentication JWT cookie",
  category: "architecture"
});

// Get specific auth architecture
const authArch = await mcp__docs-mcp__get_architecture_info({
  component: "auth",
  aspect: "patterns"
});

// Get auth implementation workflow
const authWorkflow = await mcp__docs-mcp__get_development_workflow({
  task: "new-feature",
  context: "Implement 2FA authentication"
});
```

### Implementing New Features

```javascript
// 1. Search existing patterns
const patterns = await mcp__docs-mcp__search_documentation({
  query: "table component pagination",
  category: "features"
});

// 2. Get component patterns
const componentPatterns = await mcp__docs-mcp__get_code_patterns({
  pattern_type: "component",
  technology: "react"
});

// 3. Get implementation workflow
const workflow = await mcp__docs-mcp__get_development_workflow({
  task: "component",
  context: "Data table with sorting and filtering"
});
```

## Documentation Structure

The server searches through:
```
/docs/
├── architecture/        # System design docs
├── platform/           # Platform features
├── tenant/            # Tenant features
├── account/           # Account features
├── user/              # User features
├── development/       # Dev guides
├── api/              # API documentation
└── installation/     # Setup guides
```

## Best Practices

### 1. Search Strategy
- Start with broad searches
- Refine with categories
- Use multiple related queries
- Check different perspectives

### 2. Pattern Discovery
```javascript
// Good: Comprehensive search
const caching = await mcp__docs-mcp__search_documentation({
  query: "caching Redis performance"
});

const architecture = await mcp__docs-mcp__get_architecture_info({
  component: "cache",
  aspect: "patterns"
});

// Better: Multiple perspectives
const patterns = await mcp__docs-mcp__get_code_patterns({
  pattern_type: "service",
  technology: "fastify"
});
```

### 3. Workflow Integration
- Always check existing patterns first
- Follow documented workflows
- Update docs after implementation
- Link documentation to tasks

## Integration with Other Servers

### With Kanboard
```javascript
// 1. Search documentation
const docs = await mcp__docs-mcp__search_documentation({
  query: "user profile implementation"
});

// 2. Create task with findings
await mcp__kanboard-mcp__create_task({
  title: "Implement user profile",
  description: `Based on docs:\n${docs.summary}`
});
```

### With Click-dummy
```javascript
// 1. Find UI patterns in docs
const uiDocs = await mcp__docs-mcp__search_documentation({
  query: "profile page design"
});

// 2. Find prototypes
const prototypes = await mcp__click-dummy-mcp__search_click_dummy({
  query: "user profile"
});
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| No results found | Try broader search terms |
| Wrong category results | Specify category parameter |
| Outdated information | Check document timestamps |
| Missing patterns | Request documentation update |

### Search Tips
1. Use specific technical terms
2. Include technology names
3. Try synonyms and variations
4. Check multiple categories

## Configuration

The documentation server is configured automatically and requires no additional setup. It indexes:
- Markdown files (`.md`)
- MDX files (`.mdx`)
- Code comments
- README files

## Related Documentation

- [MCP Servers Overview](./)
- [Documentation Structure](../../)
- [Contributing Docs](../../development/mdx-best-practices.md)