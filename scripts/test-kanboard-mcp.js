#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config({ path: '.env.kanboard' });

const apiToken = process.env.KANBOARD_API_TOKEN;
const apiEndpoint = process.env.KANBOARD_API_ENDPOINT || 'http://localhost:4041/jsonrpc.php';

console.log('Testing Kanboard MCP Integration...');
console.log('API Endpoint:', apiEndpoint);
console.log('API Token:', apiToken ? `${apiToken.substring(0, 20)}...` : 'NOT SET');

async function callAPI(method, params = {}) {
  try {
    const response = await axios.post(
      apiEndpoint,
      {
        jsonrpc: '2.0',
        method: method,
        id: Date.now(),
        params: params
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: 'jsonrpc',
          password: apiToken
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestTask() {
  try {
    // First, get the list of projects
    console.log('\n1. Getting projects...');
    const projectsResponse = await callAPI('getAllProjects');
    
    if (projectsResponse.error) {
      console.error('Error getting projects:', projectsResponse.error);
      return;
    }
    
    const projects = projectsResponse.result;
    console.log('Available projects:', projects.map(p => `${p.id}: ${p.name}`).join(', '));
    
    if (projects.length === 0) {
      console.log('No projects found. Creating a default project...');
      const createProjectResponse = await callAPI('createProject', {
        name: 'Test Project'
      });
      
      if (createProjectResponse.error) {
        console.error('Error creating project:', createProjectResponse.error);
        return;
      }
      
      projects.push({ id: createProjectResponse.result, name: 'Test Project' });
    }
    
    const projectId = projects[0].id;
    console.log(`Using project: ${projects[0].name} (ID: ${projectId})`);
    
    // Get columns for the project
    console.log('\n2. Getting columns...');
    const columnsResponse = await callAPI('getColumns', { project_id: projectId });
    
    if (columnsResponse.error) {
      console.error('Error getting columns:', columnsResponse.error);
      return;
    }
    
    const columns = columnsResponse.result;
    console.log('Available columns:', columns.map(c => `${c.id}: ${c.title}`).join(', '));
    
    const firstColumn = columns[0];
    
    // Create a test task
    console.log('\n3. Creating test task...');
    const taskData = {
      title: 'Test Task from MCP',
      project_id: projectId,
      column_id: firstColumn.id,
      owner_id: 1,  // Always assign to user ID 1
      description: 'This is a test task created via MCP integration\\n\\n**Created by**: Kanboard MCP Server\\n**Purpose**: Testing API connectivity',
      tags: ['test', 'mcp', 'api-test'],
      color_id: 'blue'
    };
    
    const createTaskResponse = await callAPI('createTask', taskData);
    
    if (createTaskResponse.error) {
      console.error('Error creating task:', createTaskResponse.error);
      return;
    }
    
    const taskId = createTaskResponse.result;
    console.log(`✅ Task created successfully! Task ID: ${taskId}`);
    console.log(`View it at: http://localhost:4041/?controller=TaskViewController&action=show&task_id=${taskId}&project_id=${projectId}`);
    
    // Add a comment to the task
    console.log('\n4. Adding comment to task...');
    const commentResponse = await callAPI('createComment', {
      task_id: taskId,
      user_id: 0, // 0 = current user
      content: 'This comment was added via the MCP server API integration.'
    });
    
    if (commentResponse.error) {
      console.error('Error adding comment:', commentResponse.error);
    } else {
      console.log('✅ Comment added successfully!');
    }
    
  } catch (error) {
    console.error('Failed to create test task:', error.message);
  }
}

// Run the test
createTestTask();