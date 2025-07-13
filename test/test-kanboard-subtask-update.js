#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root
dotenv.config({ path: resolve(__dirname, '../.env') });

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

async function testSubtaskUpdate() {
  console.log('Testing Kanboard Subtask Update with different parameter combinations...\n');

  try {
    // First, create a test task
    console.log('1. Creating test task...');
    const taskId = await callAPI('createTask', {
      project_id: 1,
      title: 'Test Task for Subtask Update',
      description: 'Testing subtask update parameters'
    });
    console.log(`✅ Task created with ID: ${taskId}\n`);

    // Create a subtask
    console.log('2. Creating subtask...');
    const subtaskId = await callAPI('createSubtask', {
      task_id: taskId,
      title: 'Test subtask',
      time_estimated: 5,
      status: 0  // Todo
    });
    console.log(`✅ Subtask created with ID: ${subtaskId}`);

    // Get subtask details first
    const subtaskDetails = await callAPI('getSubtask', {
      subtask_id: subtaskId
    });
    console.log('Current subtask:', subtaskDetails);
    console.log();

    // Test different parameter combinations for updateSubtask
    console.log('3. Testing updateSubtask with different parameters...\n');

    // Test 1: Just id and status
    console.log('Test 1: id + status');
    try {
      const result = await callAPI('updateSubtask', {
        id: subtaskId,
        status: 1
      });
      console.log(`✅ Success with just id + status: ${result}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

    // Test 2: id + task_id + status
    console.log('\nTest 2: id + task_id + status');
    try {
      const result = await callAPI('updateSubtask', {
        id: subtaskId,
        task_id: taskId,
        status: 1
      });
      console.log(`✅ Success with id + task_id + status: ${result}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

    // Test 3: subtask_id instead of id
    console.log('\nTest 3: subtask_id + task_id + status');
    try {
      const result = await callAPI('updateSubtask', {
        subtask_id: subtaskId,
        task_id: taskId,
        status: 1
      });
      console.log(`✅ Success with subtask_id + task_id + status: ${result}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

    // Test 4: All parameters including title, time_spent, etc
    console.log('\nTest 4: id + task_id + all fields');
    try {
      const result = await callAPI('updateSubtask', {
        id: subtaskId,
        task_id: taskId,
        title: 'Updated subtask title',
        status: 2,  // Done
        time_spent: 3,
        user_id: 1
      });
      console.log(`✅ Success with all fields: ${result}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

    // Clean up
    console.log('\nCleaning up...');
    await callAPI('removeTask', { task_id: taskId });
    console.log('✅ Test task removed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSubtaskUpdate();