# Kanboard MCP Server Subtask Update Issue Report

## Issue Summary
The Kanboard MCP server's `update_subtask` function is failing with "Invalid params" or "Method not found" errors, despite the underlying Kanboard API working correctly.

## Investigation Results

### 1. Kanboard API Requirements
According to the official Kanboard documentation and our tests:
- The `updateSubtask` method requires both `id` and `task_id` as required parameters
- Optional parameters: `title`, `user_id`, `time_estimated`, `time_spent`, `status`

### 2. Test Results

#### Direct API Tests (Working ✅)
```javascript
// This works correctly
await callAPI('updateSubtask', {
  id: subtaskId,
  task_id: taskId,
  status: 1
});
```

#### MCP Server Tests (Failing ❌)
```javascript
// This fails with "Invalid params"
mcp__kanboard-mcp__update_subtask({
  subtask_id: 42,
  status: 1
});
```

### 3. MCP Server Implementation Analysis
The MCP server code (lines 739-795 in `/mcp-servers/kanboard/index.js`) correctly:
1. Fetches the current subtask to get the `task_id`
2. Prepares update parameters with both `id` and `task_id`
3. Calls the `updateSubtask` API method

### 4. Root Cause
The issue appears to be in the MCP server runtime, not in the code logic. Possible causes:
1. The MCP server might be caching an old version of the code
2. There might be a parameter transformation issue in the MCP protocol layer
3. The server might need to be restarted to pick up recent changes

### 5. Workaround
Until the MCP server issue is resolved, subtasks can be updated using direct API calls:

```javascript
// 1. Get the subtask details
const subtask = await callAPI('getSubtask', { subtask_id: subtaskId });

// 2. Update with both required parameters
await callAPI('updateSubtask', {
  id: subtaskId,
  task_id: subtask.task_id,
  status: newStatus,
  // ... other fields
});
```

### 6. Recommendations
1. Restart the MCP server to ensure it's running the latest code
2. Add more detailed error logging to the MCP server for debugging
3. Consider adding a test suite for all MCP server functions
4. Document the parameter requirements clearly in the MCP tool descriptions

## Test Scripts Created
- `/test/test-kanboard-subtask-update.js` - Tests different parameter combinations
- `/debug/debug-mcp-subtask.js` - Direct API debugging
- `/debug/debug-kanboard-methods.js` - Lists available Kanboard API methods
- `/debug/debug-mcp-flow.js` - Simulates the MCP server flow

All test scripts confirm that the Kanboard API works correctly when called with the proper parameters.