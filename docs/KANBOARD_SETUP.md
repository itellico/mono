# Kanboard Task Management Setup

## Overview

This document explains the comprehensive task management system for the itellico Mono project using Kanboard with MCP server integration.

## System Architecture

### Task Organization

Tasks are organized using a tag-based system with the following structure:

#### Component Tags
- `[api]` - Backend API endpoints
- `[frontend]` - UI components
- `[database]` - Database migrations
- `[test]` - Testing tasks
- `[docs]` - Documentation
- `[infra]` - Infrastructure/DevOps

#### Tier Tags
- `[tier:platform]` - Platform admin level
- `[tier:tenant]` - Tenant/marketplace level
- `[tier:account]` - Account/team level
- `[tier:user]` - Individual user level
- `[tier:public]` - Public/unauthenticated

#### Status Tags
- `[bug]` - Bug fixes
- `[feature]` - New features
- `[enhancement]` - Improvements
- `[missing-docs]` - Needs documentation
- `[missing-clickdummy]` - Needs mockup

### Task Format

Each task follows this structure:

```
Title: [TYPE] Brief description
Tags: [api] [tier:user] [auth] [priority:high]
Description:
  - Implementation details
  - Links:
    - 📚 Documentation: http://localhost:3005/...
    - 🎯 Clickdummy: http://localhost:4040/...
    - 📖 API Docs: http://localhost:3001/docs#/...
  - Acceptance criteria
```

## Setup Instructions

### 1. Environment Configuration

Create `.env.kanboard` file:

```bash
cp .env.kanboard.example .env.kanboard
```

Edit with your Kanboard API token:
```
KANBOARD_API_TOKEN=your_token_here
KANBOARD_API_ENDPOINT=http://localhost:4040/kanboard/jsonrpc.php
```

### 2. Access Kanboard

1. Open http://localhost:4040/kanboard
2. Login with default credentials:
   - Username: admin
   - Password: admin
3. Go to Settings → API to get your token

### 3. MCP Server Configuration

The enhanced MCP server provides:
- Task validation (checks for docs/clickdummy links)
- Bulk task creation
- Advanced search capabilities
- Automatic tagging and prioritization

To use with Claude or other MCP clients:

```json
{
  "mcpServers": {
    "kanboard": {
      "command": "node",
      "args": ["/path/to/mono/mcp-servers/kanboard-enhanced.js"],
      "env": {
        "KANBOARD_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### 4. Populate Tasks

Run the population script to create all tasks:

```bash
cd /path/to/mono
npm install axios dotenv
node scripts/populate-kanboard-tasks.js
```

This creates:
- 190+ API endpoint tasks
- 30+ frontend component tasks
- Database migration tasks
- Testing tasks for each component
- Documentation tasks
- Infrastructure tasks

## Task Management Workflow

### Finding Tasks

Use search queries:
- `tag:api status:open` - All open API tasks
- `tag:frontend tag:tier:user` - User tier frontend tasks
- `tag:missing-docs` - Tasks needing documentation
- `priority:3` - High priority tasks

### Task States

1. **Backlog** - New tasks, not started
2. **Ready** - Requirements clear, can start
3. **Work in progress** - Currently being worked on
4. **Done** - Completed and tested

### Priority Levels

- **3 (High)** - Critical bugs, security issues, blockers
- **2 (Medium)** - Feature development, important fixes
- **1 (Low)** - Enhancements, optimizations
- **0 (None)** - Documentation, nice-to-have

## MCP Server Tools

### create_task
Create a single task with validation:
```
title: "[API] POST /auth/login"
description: "Implement login endpoint"
tags: ["api", "auth", "tier:public"]
docLink: "http://localhost:3005/architecture/security/authentication"
clickdummyLink: "http://localhost:4040/public/auth/login.php"
priority: 3
```

### create_api_tasks
Bulk create API endpoint tasks:
```
endpoints: [
  {
    method: "POST",
    path: "/api/v1/auth/login",
    tier: "public",
    resource: "auth",
    description: "User login endpoint"
  }
]
```

### create_frontend_tasks
Bulk create UI component tasks:
```
components: [
  {
    name: "Login Form",
    tier: "public",
    page: "auth/login.php",
    description: "Authentication form component"
  }
]
```

### search_tasks
Search with Kanboard query syntax:
```
query: "tag:api status:open"
```

## Best Practices

### 1. Task Creation
- Always include documentation links
- Always include clickdummy links for UI tasks
- Use appropriate tags for filtering
- Set realistic priorities

### 2. Task Validation
- Tasks without docs/clickdummy are marked with warning tags
- Review `[missing-docs]` and `[missing-clickdummy]` regularly
- Update tasks when documentation is created

### 3. Progress Tracking
- Use search to find tasks by component
- Monitor completion by tier
- Track velocity with priority levels

### 4. Integration
- Link commits to tasks with #taskID
- Update task status in PR descriptions
- Use MCP server for automation

## Troubleshooting

### Connection Issues
1. Check Kanboard is running: http://localhost:4040/kanboard
2. Verify API token is correct
3. Check `.env.kanboard` file exists

### Task Creation Failures
1. Check for duplicate titles
2. Verify project exists (ID: 1)
3. Check API token permissions

### Search Not Working
1. Use proper Kanboard search syntax
2. Tags must match exactly
3. Status values: open, closed

## Resources

- [Kanboard API Docs](https://docs.kanboard.org/v1/api/)
- [MCP SDK Docs](https://modelcontextprotocol.io/)
- [Project Documentation](http://localhost:3005)
- [Clickdummy](http://localhost:4040)