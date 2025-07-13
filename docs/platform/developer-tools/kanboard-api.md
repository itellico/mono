# Kanboard API Integration

## Overview

Kanboard is integrated as the task management and roadmap tool for the Mono platform, with full API access for automation and MCP server integration.

## API Configuration

### Environment Variables

Create a `.env.kanboard` file in the project root (copy from `.env.kanboard.example`):

```bash
# Kanboard API Configuration
KANBOARD_API_TOKEN=your_api_token_here
KANBOARD_API_ENDPOINT=http://localhost:4040/kanboard/jsonrpc.php
KANBOARD_API_USER=admin
```

### Getting Your API Token

1. Log into Kanboard at http://localhost:4040/kanboard/
2. Go to Settings → API
3. Copy your personal API token

## API Usage Examples

### Using cURL

```bash
# Get all projects
curl -X POST http://localhost:4040/kanboard/jsonrpc.php \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getAllProjects",
    "id": 1,
    "params": {
      "api_key": "YOUR_API_TOKEN"
    }
  }'

# Create a task
curl -X POST http://localhost:4040/kanboard/jsonrpc.php \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "createTask",
    "id": 1,
    "params": {
      "api_key": "YOUR_API_TOKEN",
      "project_id": 1,
      "title": "New feature: User dashboard"
    }
  }'
```

### Using Node.js

```javascript
const axios = require('axios');

const kanboardAPI = async (method, params = {}) => {
  const response = await axios.post(process.env.KANBOARD_API_ENDPOINT, {
    jsonrpc: '2.0',
    method: method,
    id: 1,
    params: {
      api_key: process.env.KANBOARD_API_TOKEN,
      ...params
    }
  });
  return response.data.result;
};

// Example usage
const projects = await kanboardAPI('getAllProjects');
const task = await kanboardAPI('createTask', {
  project_id: 1,
  title: 'Implement new feature'
});
```

## MCP Server Configuration

To use Kanboard with an MCP server, add this to your MCP configuration:

```json
{
  "mcpServers": {
    "kanboard": {
      "command": "node",
      "args": ["./mcp-servers/kanboard/index.js"],
      "env": {
        "KANBOARD_API_TOKEN": "${KANBOARD_API_TOKEN}",
        "KANBOARD_API_ENDPOINT": "${KANBOARD_API_ENDPOINT}"
      }
    }
  }
}
```

## Available API Methods

### Project Management
- `getAllProjects` - Get all projects
- `getProjectById` - Get project details
- `createProject` - Create new project
- `updateProject` - Update project
- `removeProject` - Delete project

### Task Management
- `getAllTasks` - Get all tasks
- `getTask` - Get task details
- `createTask` - Create new task
- `updateTask` - Update task
- `closeTask` - Close task
- `openTask` - Reopen task
- `removeTask` - Delete task
- `moveTaskPosition` - Move task in board

### Board Operations
- `getBoard` - Get board layout
- `getColumns` - Get columns for a project
- `moveTaskToPosition` - Move task to specific position
- `getActiveSwimlanes` - Get swimlanes

### User Management
- `getMe` - Get current user info
- `getAllUsers` - Get all users
- `getUser` - Get user details

## Integration with Mono Platform

### Automatic Task Creation

You can integrate Kanboard with the Mono platform to automatically create tasks:

```typescript
// apps/api/src/services/kanboard.service.ts
export class KanboardService {
  private apiToken = process.env.KANBOARD_API_TOKEN;
  private apiEndpoint = process.env.KANBOARD_API_ENDPOINT;

  async createFeatureTask(feature: Feature) {
    return this.callAPI('createTask', {
      project_id: 1, // Mono Development Project
      title: `Implement: ${feature.name}`,
      description: feature.description,
      tags: ['feature', feature.category]
    });
  }

  async createBugReport(error: Error, context: any) {
    return this.callAPI('createTask', {
      project_id: 2, // Bug Tracking Project
      title: `Bug: ${error.message}`,
      description: `${error.stack}\n\nContext: ${JSON.stringify(context)}`,
      color_id: 'red',
      priority: 3
    });
  }
}
```

### Webhook Integration

Kanboard can send webhooks to the Mono platform for task updates:

1. In Kanboard, go to Project Settings → Integrations → Webhooks
2. Add webhook URL: `http://localhost:3001/api/webhooks/kanboard`
3. Select events to trigger webhooks

## Security Notes

- Never commit `.env.kanboard` to version control
- Use environment-specific API tokens
- Rotate API tokens regularly
- Use HTTPS in production
- Implement rate limiting for API calls

## Troubleshooting

### Connection Issues

If you can't connect to the API:

1. Check the API endpoint URL
2. Verify the API token is correct
3. Ensure Kanboard is running: `docker-compose ps`
4. Check nginx logs: `docker-compose logs nginx`

### Database Issues

If Kanboard shows database errors:

```bash
# Recreate the database
docker-compose exec postgres psql -U developer -d postgres -c "DROP DATABASE kanboard;"
docker-compose exec postgres psql -U developer -d postgres -c "CREATE DATABASE kanboard;"
```

## Resources

- [Kanboard API Documentation](https://docs.kanboard.org/v1/api/)
- [JSON-RPC Specification](https://www.jsonrpc.org/specification)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)