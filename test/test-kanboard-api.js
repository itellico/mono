#!/usr/bin/env node
import Kanboard from '../mcp-servers/kanboard/node_modules/kanboard/index.js';

const kanboard = new Kanboard({
  endpoint: process.env.KANBOARD_API_URL || 'http://localhost:4041/jsonrpc.php',
  token: process.env.KANBOARD_API_TOKEN || 'd17d3453dd6b8f9cf19ae5f2a070c3fabe821bdf93b97fcb4f42bb60ad1d'
});

async function testAPI() {
  try {
    console.log('Testing Kanboard API...\n');
    
    // Test getAllTasks with status_id
    console.log('1. Testing getAllTasks with status_id = 1 (active):');
    const activeTasks = await kanboard.callAPI('getAllTasks', {
      project_id: 1,
      status_id: 1
    });
    console.log(`Found ${activeTasks.length} active tasks`);
    activeTasks.forEach(task => {
      console.log(`  - Task #${task.id}: "${task.title}" - is_active: ${task.is_active} (${typeof task.is_active})`);
    });
    
    console.log('\n2. Testing getAllTasks with status_id = 0 (closed):');
    const closedTasks = await kanboard.callAPI('getAllTasks', {
      project_id: 1,
      status_id: 0
    });
    console.log(`Found ${closedTasks.length} closed tasks`);
    closedTasks.forEach(task => {
      console.log(`  - Task #${task.id}: "${task.title}" - is_active: ${task.is_active} (${typeof task.is_active})`);
    });
    
    // Test getTask
    console.log('\n3. Testing getTask for task #2:');
    const task = await kanboard.callAPI('getTask', { task_id: 2 });
    if (task) {
      console.log(`Task #${task.id}: "${task.title}"`);
      console.log(`  - is_active: ${task.is_active} (${typeof task.is_active})`);
      console.log(`  - Column: ${task.column_name}`);
      console.log(`  - Status interpretation: ${task.is_active == 1 ? 'Active' : 'Closed'}`);
    }
    
    // Test searchTasks
    console.log('\n4. Testing searchTasks with "status:open":');
    const searchResults = await kanboard.callAPI('searchTasks', {
      project_id: 1,
      query: 'status:open'
    });
    console.log(`Found ${searchResults.length} tasks matching "status:open"`);
    searchResults.forEach(task => {
      console.log(`  - Task #${task.id}: "${task.title}" - is_active: ${task.is_active}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();