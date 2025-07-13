# Kanboard MCP Server

This MCP server provides integration with Kanboard for task and project management.

## Installation

The server is already configured in your Claude Desktop app. If you need to reinstall:

```bash
cd /Users/mm2/dev_mm/mono/mcp-servers/kanboard
pnpm install
```

## Configuration

The server reads configuration from `/Users/mm2/dev_mm/mono/.env.kanboard`:

```bash
# Basic Auth credentials
KANBOARD_USERNAME=jsonrpc
KANBOARD_PASSWORD=your_api_token
# Or legacy API token (will be used as password with username 'jsonrpc')
KANBOARD_API_TOKEN=your_api_token
KANBOARD_API_ENDPOINT=http://localhost:4040/kanboard/jsonrpc.php
```

## Available Tools

### Task Management

- **create_task** - Create a new task with title, description, priority, color, and tags
- **list_tasks** - List tasks in a project (filter by active/closed/all)
- **update_task** - Update task properties
- **move_task** - Move task to different column or position
- **get_task** - Get detailed information about a specific task
- **search_tasks** - Search tasks using Kanboard query syntax

### Project Management

- **list_projects** - List all projects
- **get_board** - Get board layout with columns and task counts

### Collaboration

- **add_comment** - Add a comment to a task
- **get_task_comments** - Get all comments for a task

### Subtask Management

- **create_subtask** - Create a subtask for an existing task (automatically assigned to user ID 1 if no user_id specified)
- **list_subtasks** - List all subtasks for a task
- **update_subtask** - Update an existing subtask (title, status, assignee, time tracking)
- **get_subtask** - Get detailed information about a specific subtask

## Usage Examples

In Claude Desktop, you can use these commands:

```
# Create a new task
Use the create_task tool to add "Implement user authentication" to project 1

# List active tasks
Use the list_tasks tool to show all active tasks

# Move a task
Use the move_task tool to move task 5 to column 3

# Search for tasks
Use the search_tasks tool to find tasks with query "assignee:me status:open"

# Add a comment
Use the add_comment tool to add comment "Started working on this" to task 10

# Create a subtask
Use the create_subtask tool to add "Setup database schema" as a subtask of task 10

# List subtasks
Use the list_subtasks tool to show all subtasks for task 10

# Update subtask status
Use the update_subtask tool to mark subtask 5 as done (status 2)
```

## Default Behavior Notes

- **Tasks** are automatically assigned to user ID 1 (admin) when created
- **Subtasks** are automatically assigned to user ID 1 (admin) when created without a specific user_id
- **Comments** are automatically attributed to user ID 1 (admin) when added through this MCP server

## Troubleshooting

If the server fails to connect:

1. Ensure Kanboard is running: `docker-compose ps`
2. Check the API token is correct
3. Verify the endpoint URL is accessible
4. Check logs: `docker-compose logs php nginx`

## Development

To modify the server:

1. Edit `/Users/mm2/dev_mm/mono/mcp-servers/kanboard/index.js`
2. Restart Claude Desktop to reload the server

## API Reference

This server uses the Kanboard JSON-RPC API. For more methods:
https://docs.kanboard.org/v1/api/