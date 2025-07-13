# Kanboard MCP Server - Subtask Default Assignee Implementation

## Summary

Updated the Kanboard MCP server to automatically assign subtasks to user ID 1 (admin) when no specific user_id is provided, matching the existing behavior for tasks and comments.

## Changes Made

### 1. Updated `/mcp-servers/kanboard/index.js` (Line 687)

**Before:**
```javascript
case 'create_subtask':
  const subtaskData = {
    task_id: args.task_id,
    title: args.title
  };
  
  if (args.user_id) subtaskData.user_id = args.user_id;
```

**After:**
```javascript
case 'create_subtask':
  const subtaskData = {
    task_id: args.task_id,
    title: args.title,
    user_id: args.user_id || 1  // Default to user ID 1 (same as task creation)
  };
```

### 2. Updated `/mcp-servers/kanboard/README.md`

- Added documentation for all subtask management tools
- Added usage examples for subtask operations
- Added "Default Behavior Notes" section explaining automatic assignment behavior

## Behavior Consistency

The MCP server now consistently assigns user ID 1 across all creation operations:

| Operation | Default Assignment | Code Reference |
|-----------|-------------------|----------------|
| Create Task | `owner_id: 1` | Line 425 |
| Add Comment | `user_id: 1` | Line 646 |
| Create Subtask | `user_id: args.user_id || 1` | Line 687 (updated) |

## Impact

- Subtasks created without explicit user assignment will now be automatically assigned to user ID 1
- Subtasks can still be assigned to specific users by providing the `user_id` parameter
- This ensures all content created through the MCP server has a consistent default assignee

## Testing

Created test script at `/test/test-kanboard-subtask-default-assignee.js` to demonstrate the expected behavior:
- Creating subtask without user_id → assigned to user 1
- Creating subtask with user_id=2 → assigned to user 2

## Related Files

1. `/mcp-servers/kanboard/index.js` - Main MCP server implementation
2. `/mcp-servers/kanboard/README.md` - Updated documentation
3. `/test/test-kanboard-subtask-default-assignee.js` - Test demonstration script
4. `/mcp-servers/kanboard/test-subtasks.js` - Existing subtask testing script