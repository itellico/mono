---
title: Kanboard MCP Server
sidebar_label: Kanboard Server
description: Project management integration through Kanboard API
---

# Kanboard MCP Server

Integrates Claude with Kanboard project management system for task tracking, project organization, and workflow automation.

## Overview

The Kanboard MCP server provides direct access to your project management system, enabling:
- Task creation and management
- Project board visualization
- Workflow automation
- Comment tracking
- Subtask management

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# Kanboard API Configuration
KANBOARD_USERNAME=jsonrpc
KANBOARD_PASSWORD=your_api_token_here
KANBOARD_API_TOKEN=your_api_token_here
KANBOARD_API_ENDPOINT=http://192.168.178.94:4041/jsonrpc.php
```

### 2. Claude Desktop Settings

Update your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "itellico-mono-kanboard": {
      "command": "bash",
      "args": ["/Users/mm2/dev_mm/mono/mcp-servers/kanboard/start-with-env.sh"],
      "cwd": "/Users/mm2/dev_mm/mono"
    }
  }
}
```

### 3. Verify Installation

Test the connection:
```bash
# Test API directly
curl -X POST $KANBOARD_API_ENDPOINT \
  -u "$KANBOARD_USERNAME:$KANBOARD_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "getVersion", "id": 1}'
```

## Available Functions

### Task Management

#### Create Task
```javascript
mcp__kanboard-mcp__create_task({
  title: "Implement user dashboard",
  project_id: 1,
  description: "Create responsive user dashboard",
  priority: 2,
  tags: ["frontend", "priority"],
  color_id: "blue"
});
```

#### List Tasks
```javascript
mcp__kanboard-mcp__list_tasks({
  project_id: 1,
  status: "active" // active, closed, all
});
```

#### Update Task
```javascript
mcp__kanboard-mcp__update_task({
  task_id: 42,
  title: "Updated title",
  is_active: 1, // 1 = active, 0 = closed
  priority: 3
});
```

#### Move Task
```javascript
mcp__kanboard-mcp__move_task({
  task_id: 42,
  column_id: 3,
  position: 1 // 1 = top of column
});
```

### Project Management

#### List Projects
```javascript
mcp__kanboard-mcp__list_projects();
```

#### Get Board Layout
```javascript
mcp__kanboard-mcp__get_board({
  project_id: 1
});
```

### Comments & Collaboration

#### Add Comment
```javascript
mcp__kanboard-mcp__add_comment({
  task_id: 42,
  content: "Task completed with all tests passing"
});
```

#### Get Comments
```javascript
mcp__kanboard-mcp__get_task_comments({
  task_id: 42
});
```

### Search

```javascript
mcp__kanboard-mcp__search_tasks({
  query: "status:open assignee:me",
  project_id: 1 // optional
});
```

## KB Workflows

### KB Auto-Coding Workflow

When a message starts with `kb <task-id>`:

1. **Get task**: Retrieve task details
2. **Update status**: Move to "in_progress"
3. **Research**: Search docs and prototypes
4. **Implement**: Complete the feature
5. **Document**: Add links and comments
6. **Complete**: Move to "ready" with "testing" tag

Example:
```
User: kb 42
Claude: [Automatically executes full workflow]
```

### KB Check Workflow

When a message starts with `kb check`:

1. **Research**: Search all documentation
2. **Analyze**: Review click-dummy prototypes
3. **Create/Update**: Task with findings
4. **Document**: Add all relevant links

### KB Feedback Workflow

When a message starts with `kb feedback <task-id>`:

1. **Find feedback**: Read latest comments
2. **Apply corrections**: Update task
3. **Acknowledge**: Add response comment
4. **Reassign**: Back to user

## Task Properties

### Colors
- `yellow`, `blue`, `green`, `purple`, `red`
- `orange`, `grey`, `brown`, `deep_orange`
- `dark_grey`, `pink`, `teal`, `cyan`
- `lime`, `light_green`, `amber`

### Priority Levels
- `0` - Low
- `1` - Normal
- `2` - High
- `3` - Urgent

### Task Status
- `1` - Active
- `0` - Closed

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Authentication failed | Check API token in `.env` |
| Connection refused | Verify Kanboard is running |
| Task not found | Confirm task ID exists |
| Permission denied | Check user permissions |

### Debug Commands

```bash
# Check Kanboard container
docker ps | grep kanboard

# View Kanboard logs
docker logs mono-php

# Test Kanboard access
curl http://192.168.178.94:4041
```

### Configuration Issues

1. **Missing credentials**: Ensure all environment variables are set
2. **Wrong endpoint**: Verify `KANBOARD_API_ENDPOINT` URL
3. **Token vs password**: Use API token, not user password
4. **Network issues**: Check Docker network connectivity

## Best Practices

1. **Task Organization**
   - Use clear, descriptive titles
   - Add relevant tags for categorization
   - Set appropriate priority levels
   - Include detailed descriptions

2. **Workflow Management**
   - Move tasks through columns systematically
   - Add comments for important updates
   - Use subtasks for complex features
   - Link related tasks

3. **Automation**
   - Use KB workflows for efficiency
   - Batch similar operations
   - Keep task status updated
   - Document implementation details

## Integration with Other MCP Servers

The Kanboard server works seamlessly with:
- **docs-mcp**: Link documentation to tasks
- **click-dummy-mcp**: Reference UI prototypes
- **sequential-thinking**: Plan complex implementations

## API Reference

Full Kanboard API documentation: https://docs.kanboard.org/en/latest/api/

## Related Documentation

- [MCP Servers Overview](./)
- [KB Workflows](../../workflows/intelligent-auto-coding.md)
- [Docker Services](../deployment/docker/)
- [CLAUDE.md KB Instructions](/CLAUDE.md#-kb-auto-coding-workflow)