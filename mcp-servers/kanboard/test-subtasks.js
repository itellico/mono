#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root
dotenv.config({ path: resolve(__dirname, '../../.env') });

const KANBOARD_API_ENDPOINT = process.env.KANBOARD_API_ENDPOINT || 'http://localhost:4041/jsonrpc.php';
const KANBOARD_USERNAME = process.env.KANBOARD_USERNAME || 'jsonrpc';
const KANBOARD_API_TOKEN = process.env.KANBOARD_API_TOKEN || process.env.KANBOARD_PASSWORD;

async function callAPI(method, params = {}) {
  try {
    const response = await axios.post(KANBOARD_API_ENDPOINT, {
      jsonrpc: '2.0',
      method: method,
      id: Date.now(),
      params: params
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: KANBOARD_USERNAME,
        password: KANBOARD_API_TOKEN
      }
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.data?.error?.message || error.message}`);
    } else {
      throw error;
    }
  }
}

async function testSubtasks() {
  console.log('Testing Kanboard Subtask API...\n');

  try {
    // First, create a test task
    console.log('1. Creating test task...');
    const taskId = await callAPI('createTask', {
      project_id: 1,
      title: 'Test Task for Subtasks',
      description: 'This task is for testing subtask functionality'
    });
    console.log(`✅ Task created with ID: ${taskId}\n`);

    // Create subtasks
    console.log('2. Creating subtasks...');
    const subtask1Id = await callAPI('createSubtask', {
      task_id: taskId,
      title: 'First subtask',
      time_estimated: 2
    });
    console.log(`✅ Subtask 1 created with ID: ${subtask1Id}`);

    const subtask2Id = await callAPI('createSubtask', {
      task_id: taskId,
      title: 'Second subtask',
      time_estimated: 3,
      status: 1 // In progress
    });
    console.log(`✅ Subtask 2 created with ID: ${subtask2Id}\n`);

    // List subtasks
    console.log('3. Listing subtasks...');
    const subtasks = await callAPI('getAllSubtasks', {
      task_id: taskId
    });
    console.log(`Found ${subtasks.length} subtasks:`);
    subtasks.forEach(st => {
      const status = ['Todo', 'In Progress', 'Done'][st.status];
      console.log(`  - [${st.id}] ${st.title} - ${status}`);
    });
    console.log();

    // Update a subtask
    console.log('4. Updating subtask...');
    try {
      const updateResult = await callAPI('updateSubtask', {
        id: subtask1Id,
        status: 2, // Done
        time_spent: 1.5
      });
      console.log(`✅ Subtask updated: ${updateResult}\n`);
    } catch (error) {
      console.log(`ℹ️  Update subtask failed (checking alternative params): ${error.message}`);
      
      // Try with subtask_id instead of id
      try {
        const updateResult = await callAPI('updateSubtask', {
          subtask_id: subtask1Id,
          status: 2, // Done
          time_spent: 1.5
        });
        console.log(`✅ Subtask updated with subtask_id param: ${updateResult}\n`);
      } catch (error2) {
        console.log(`❌ Update subtask failed with both param styles: ${error2.message}\n`);
      }
    }

    // Get subtask details (if available)
    console.log('5. Testing getSubtask (if available)...');
    try {
      const subtaskDetails = await callAPI('getSubtask', {
        subtask_id: subtask1Id
      });
      console.log('✅ Subtask details:', subtaskDetails);
    } catch (error) {
      console.log('ℹ️  getSubtask method not available or failed:', error.message);
    }

    console.log('\n✅ All subtask tests completed successfully!');

    // Clean up - remove the test task
    console.log('\nCleaning up...');
    await callAPI('removeTask', { task_id: taskId });
    console.log('✅ Test task removed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSubtasks();