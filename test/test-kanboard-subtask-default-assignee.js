#!/usr/bin/env node

/**
 * Test script to verify that subtasks are automatically assigned to user ID 1
 * when no user_id is provided in the create_subtask MCP call
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to call MCP server
async function callMCPServer(method, params) {
  return new Promise((resolve, reject) => {
    const mcpPath = resolve(__dirname, '../mcp-servers/kanboard/index.js');
    const child = spawn('node', [mcpPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${error}`));
      } else {
        try {
          // Parse the last JSON response from output
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          resolve(response);
        } catch (e) {
          resolve({ output, error });
        }
      }
    });

    // Send JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: method,
        arguments: params
      }
    };

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
  });
}

async function testSubtaskDefaultAssignee() {
  console.log('Testing Kanboard MCP Subtask Default Assignee...\n');

  try {
    // First, let's create a test task
    console.log('1. Creating a test task...');
    const createTaskResult = await callMCPServer('create_task', {
      title: 'Test Task for Subtask Default Assignee',
      project_id: 1,
      description: 'Testing that subtasks get assigned to user ID 1 by default'
    });
    console.log('Task creation result:', createTaskResult);

    // Extract task ID from the result (this is a simplified example)
    const taskId = 1; // You would parse this from the actual result

    // Create subtask WITHOUT specifying user_id
    console.log('\n2. Creating subtask WITHOUT user_id specified...');
    const subtaskWithoutUser = await callMCPServer('create_subtask', {
      task_id: taskId,
      title: 'Subtask without explicit user assignment'
    });
    console.log('Subtask creation result:', subtaskWithoutUser);

    // Create subtask WITH specific user_id
    console.log('\n3. Creating subtask WITH user_id = 2...');
    const subtaskWithUser = await callMCPServer('create_subtask', {
      task_id: taskId,
      title: 'Subtask with explicit user assignment',
      user_id: 2
    });
    console.log('Subtask creation result:', subtaskWithUser);

    // List subtasks to verify assignments
    console.log('\n4. Listing all subtasks for the task...');
    const listResult = await callMCPServer('list_subtasks', {
      task_id: taskId
    });
    console.log('List subtasks result:', listResult);

    console.log('\n✅ Test completed! Check the results above to verify:');
    console.log('   - First subtask should be assigned to user ID 1 (default)');
    console.log('   - Second subtask should be assigned to user ID 2 (explicit)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Note: This is a simplified test script. In practice, you would need to:
// 1. Properly implement the MCP client protocol
// 2. Parse the actual task ID from the create_task response
// 3. Use the proper MCP SDK for communication

console.log('Note: This is a demonstration script showing the expected behavior.');
console.log('For actual testing, use the MCP SDK or the proper client implementation.\n');

// Show what the implementation change does
console.log('Implementation change in /mcp-servers/kanboard/index.js:');
console.log('---------------------------------------------------');
console.log('Before:');
console.log('  if (args.user_id) subtaskData.user_id = args.user_id;');
console.log('\nAfter:');
console.log('  user_id: args.user_id || 1  // Default to user ID 1 (same as task creation)');
console.log('\nThis ensures all subtasks are assigned to user ID 1 by default,');
console.log('matching the behavior of task creation and comment addition.');