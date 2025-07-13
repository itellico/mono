# Kanboard MCP Server - Subtask Update Fix

## Issue Summary
The Kanboard MCP server was failing with "Invalid params" error when trying to update subtasks. The error occurred when calling:
```javascript
update_subtask(subtask_id: 1, user_id: 1)
```

## Root Cause
The Kanboard JSON-RPC API's `updateSubtask` method has specific requirements:

1. **Required Parameters:**
   - `id`: The subtask ID
   - `task_id`: The parent task ID (THIS WAS MISSING!)

2. **Optional Parameters:**
   - `title`, `user_id`, `time_estimated`, `time_spent`, `status`, `position`

The MCP server implementation was only sending the `id` parameter without the required `task_id`, causing the "Invalid params" error.

## The Fix

### Before (Broken Implementation)
```javascript
// Individual update calls without task_id
await kanboard.callAPI('updateSubtask', {
  id: args.subtask_id,
  user_id: args.user_id
});
```

### After (Fixed Implementation)
```javascript
// First get the subtask to obtain task_id
const currentSubtask = await kanboard.callAPI('getSubtask', {
  subtask_id: args.subtask_id
});

// Then update with both id and task_id
const updateParams = {
  id: args.subtask_id,
  task_id: currentSubtask.task_id,  // Required parameter!
  user_id: args.user_id
};

result = await kanboard.callAPI('updateSubtask', updateParams);
```

## Key Changes

1. **Get Subtask First**: Retrieve the subtask details to obtain the `task_id`
2. **Include task_id**: Always include the `task_id` parameter in update calls
3. **Single API Call**: Changed from multiple individual update calls to a single call with all parameters
4. **Better Error Handling**: Check if subtask exists before attempting update

## Testing

To test the fix, you can:

1. Run the test script:
   ```bash
   node /Users/mm2/dev_mm/mono/test/test-kanboard-subtask-update.js
   ```

2. Or use the MCP server directly to update subtasks:
   ```javascript
   // This will now work correctly
   mcp__kanboard-mcp__update_subtask({
     subtask_id: 1,
     user_id: 1
   })
   ```

## Files Modified
- `/Users/mm2/dev_mm/mono/mcp-servers/kanboard/index.js` - Fixed the update_subtask case handler

## Additional Notes
- The Kanboard PHP API source confirms this requirement in `/php/kanboard/app/Api/Procedure/SubtaskProcedure.php`
- The `updateSubtask` method signature clearly shows both `$id` and `$task_id` as required parameters
- This fix ensures compatibility with the Kanboard JSON-RPC API specification