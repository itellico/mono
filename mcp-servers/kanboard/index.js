#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root (two levels up from mcp-servers/kanboard)
dotenv.config({ path: resolve(__dirname, '../../.env') });

class KanboardClient {
  constructor() {
    // Get credentials from environment variables
    // First try KANBOARD_API_TOKEN, then fall back to KANBOARD_PASSWORD
    this.username = process.env.KANBOARD_USERNAME || 'jsonrpc';
    this.password = process.env.KANBOARD_API_TOKEN || process.env.KANBOARD_PASSWORD;
    this.apiEndpoint = process.env.KANBOARD_API_ENDPOINT || 'http://localhost:4041/jsonrpc.php';
    
    console.error(`Kanboard MCP: Using endpoint ${this.apiEndpoint}`);
    console.error(`Kanboard MCP: Using username ${this.username}`);
    console.error(`Kanboard MCP: API token loaded: ${this.password ? 'Yes' : 'No'}`);
    
    if (!this.password) {
      throw new Error('KANBOARD_API_TOKEN or KANBOARD_PASSWORD is required in .env file');
    }
  }

  async callAPI(method, params = {}) {
    try {
      const response = await axios.post(this.apiEndpoint, {
        jsonrpc: '2.0',
        method: method,
        id: Date.now(),
        params: params
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: this.username,
          password: this.password
        },
        timeout: 10000
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.data?.error?.message || error.message}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to Kanboard at ${this.apiEndpoint}`);
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  let kanboard;
  
  try {
    kanboard = new KanboardClient();
  } catch (error) {
    console.error('Warning: Kanboard client initialization failed:', error.message);
    console.error('Please ensure KANBOARD_API_TOKEN and KANBOARD_API_ENDPOINT are set in your .env file');
    console.error('Server will start but API calls will fail without proper credentials');
  }
  
  const server = new Server(
    {
      name: 'itellico-mono-kanboard',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'create_task',
        description: 'Create a new task in Kanboard',
        inputSchema: {
          type: 'object',
          properties: {
            title: { 
              type: 'string', 
              description: 'Task title (required)' 
            },
            project_id: { 
              type: 'number', 
              description: 'Project ID (default: 1)' 
            },
            description: { 
              type: 'string', 
              description: 'Task description (optional)' 
            },
            column_id: { 
              type: 'number', 
              description: 'Column ID where to create the task (optional)' 
            },
            color_id: { 
              type: 'string', 
              description: 'Task color: yellow, blue, green, purple, red, orange, grey, brown, deep_orange, dark_grey, pink, teal, cyan, lime, light_green, amber' 
            },
            priority: { 
              type: 'number', 
              description: 'Task priority: 0 (low) to 3 (high)' 
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tags for the task'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'list_tasks',
        description: 'List tasks in a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { 
              type: 'number', 
              description: 'Project ID (default: 1)' 
            },
            status: {
              type: 'string',
              enum: ['active', 'closed', 'all'],
              description: 'Filter by task status (default: active)'
            }
          }
        }
      },
      {
        name: 'update_task',
        description: 'Update an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Task ID (required)' 
            },
            title: { 
              type: 'string', 
              description: 'New title' 
            },
            description: { 
              type: 'string', 
              description: 'New description' 
            },
            is_active: { 
              type: 'number', 
              enum: [0, 1],
              description: 'Task status: 1 (active) or 0 (closed)' 
            },
            priority: { 
              type: 'number', 
              description: 'Task priority: 0 (low) to 3 (high)' 
            },
            color_id: { 
              type: 'string', 
              description: 'Task color' 
            }
          },
          required: ['task_id']
        }
      },
      {
        name: 'move_task',
        description: 'Move a task to a different column or position',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Task ID (required)' 
            },
            column_id: { 
              type: 'number', 
              description: 'Target column ID (required)' 
            },
            position: { 
              type: 'number', 
              description: 'Position in the column (1 = top)' 
            },
            swimlane_id: { 
              type: 'number', 
              description: 'Target swimlane ID (optional)' 
            }
          },
          required: ['task_id', 'column_id']
        }
      },
      {
        name: 'get_task',
        description: 'Get detailed information about a specific task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Task ID (required)' 
            }
          },
          required: ['task_id']
        }
      },
      {
        name: 'list_projects',
        description: 'List all projects',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_board',
        description: 'Get the board layout for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { 
              type: 'number', 
              description: 'Project ID (default: 1)' 
            }
          }
        }
      },
      {
        name: 'search_tasks',
        description: 'Search for tasks using a query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { 
              type: 'string', 
              description: 'Search query (e.g., "status:open assignee:me")' 
            },
            project_id: { 
              type: 'number', 
              description: 'Limit search to specific project (optional)' 
            }
          },
          required: ['query']
        }
      },
      {
        name: 'add_comment',
        description: 'Add a comment to a task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Task ID (required)' 
            },
            content: { 
              type: 'string', 
              description: 'Comment content in Markdown (required)' 
            }
          },
          required: ['task_id', 'content']
        }
      },
      {
        name: 'get_task_comments',
        description: 'Get all comments for a task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Task ID (required)' 
            }
          },
          required: ['task_id']
        }
      },
      {
        name: 'create_subtask',
        description: 'Create a subtask for an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Parent task ID (required)' 
            },
            title: { 
              type: 'string', 
              description: 'Subtask title (required)' 
            },
            user_id: { 
              type: 'number', 
              description: 'User to assign to (optional)' 
            },
            time_estimated: { 
              type: 'number', 
              description: 'Estimated time in hours (optional)' 
            },
            time_spent: { 
              type: 'number', 
              description: 'Time already spent in hours (optional)' 
            },
            status: { 
              type: 'number', 
              enum: [0, 1, 2],
              description: 'Subtask status: 0 = Todo, 1 = In progress, 2 = Done (default: 0)' 
            }
          },
          required: ['task_id', 'title']
        }
      },
      {
        name: 'list_subtasks',
        description: 'List all subtasks for a task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Parent task ID (required)' 
            }
          },
          required: ['task_id']
        }
      },
      {
        name: 'update_subtask',
        description: 'Update an existing subtask',
        inputSchema: {
          type: 'object',
          properties: {
            subtask_id: { 
              type: 'number', 
              description: 'Subtask ID (required)' 
            },
            title: { 
              type: 'string', 
              description: 'New title' 
            },
            user_id: { 
              type: 'number', 
              description: 'User to assign to' 
            },
            time_estimated: { 
              type: 'number', 
              description: 'Estimated time in hours' 
            },
            time_spent: { 
              type: 'number', 
              description: 'Time spent in hours' 
            },
            status: { 
              type: 'number', 
              enum: [0, 1, 2],
              description: 'Subtask status: 0 = Todo, 1 = In progress, 2 = Done' 
            }
          },
          required: ['subtask_id']
        }
      },
      {
        name: 'get_subtask',
        description: 'Get detailed information about a specific subtask',
        inputSchema: {
          type: 'object',
          properties: {
            subtask_id: { 
              type: 'number', 
              description: 'Subtask ID (required)' 
            }
          },
          required: ['subtask_id']
        }
      },
      {
        name: 'compact_task_comments',
        description: 'Compact and consolidate task comments by removing redundant information while preserving valuable content',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { 
              type: 'number', 
              description: 'Task ID to compact comments for (required)' 
            }
          },
          required: ['task_id']
        }
      }
    ]
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!kanboard) {
      return {
        content: [{
          type: 'text',
          text: '❌ Error: Kanboard client not initialized. Please check that KANBOARD_API_TOKEN and KANBOARD_API_ENDPOINT are properly set in your .env file.'
        }],
        isError: true
      };
    }

    try {
      let result;
      
      switch (name) {
        case 'create_task':
          const taskData = {
            project_id: args.project_id || 1,
            title: args.title,
            owner_id: 1,  // Always assign to user ID 1
            column_id: args.column_id || 3  // Default to "Work in progress" column
          };
          
          if (args.description) taskData.description = args.description;
          if (args.color_id) taskData.color_id = args.color_id;
          if (args.priority !== undefined) taskData.priority = args.priority;
          if (args.tags) taskData.tags = args.tags;
          
          result = await kanboard.callAPI('createTask', taskData);
          
          return {
            content: [{
              type: 'text',
              text: `✅ Task created successfully!\n\nTask ID: ${result}\nTitle: ${args.title}\nProject ID: ${taskData.project_id}`
            }]
          };

        case 'list_tasks':
          // Kanboard API: status_id 1 = active, 0 = closed
          const statusMap = { 'active': 1, 'closed': 0 };
          const status = args.status || 'active';
          
          if (status === 'all') {
            // Fetch both active and closed tasks
            const activeTasks = await kanboard.callAPI('getAllTasks', {
              project_id: args.project_id || 1,
              status_id: 1
            });
            const closedTasks = await kanboard.callAPI('getAllTasks', {
              project_id: args.project_id || 1,
              status_id: 0
            });
            result = [...(activeTasks || []), ...(closedTasks || [])];
          } else {
            result = await kanboard.callAPI('getAllTasks', {
              project_id: args.project_id || 1,
              status_id: statusMap[status]
            });
          }
          
          if (!result || result.length === 0) {
            return {
              content: [{
                type: 'text',
                text: 'No tasks found.'
              }]
            };
          }
          
          const taskList = result.map(task => 
            `• [${task.id}] ${task.title} (${task.column_name || 'Unknown'}) - ${task.is_active == 1 ? '🟢 Active' : '🔴 Closed'}`
          ).join('\n');
          
          return {
            content: [{
              type: 'text',
              text: `📋 Tasks (${result.length}):\n\n${taskList}`
            }]
          };

        case 'update_task':
          const updates = { id: args.task_id };
          
          if (args.title) updates.title = args.title;
          if (args.description !== undefined) updates.description = args.description;
          if (args.is_active !== undefined) updates.is_active = args.is_active;
          if (args.priority !== undefined) updates.priority = args.priority;
          if (args.color_id) updates.color_id = args.color_id;
          
          result = await kanboard.callAPI('updateTask', updates);
          
          return {
            content: [{
              type: 'text',
              text: result ? '✅ Task updated successfully!' : '❌ Failed to update task'
            }]
          };

        case 'move_task':
          // If swimlane_id not provided, get current task's swimlane
          let swimlaneId = args.swimlane_id;
          if (!swimlaneId) {
            const task = await kanboard.callAPI('getTask', { task_id: args.task_id });
            if (!task) {
              return {
                content: [{
                  type: 'text',
                  text: `❌ Task with ID ${args.task_id} not found`
                }]
              };
            }
            swimlaneId = task.swimlane_id || 1; // Default to swimlane 1 if not set
          }
          
          const moveParams = {
            project_id: args.project_id || 1,
            task_id: args.task_id,
            column_id: args.column_id,
            position: args.position || 1,
            swimlane_id: swimlaneId
          };
          
          result = await kanboard.callAPI('moveTaskPosition', moveParams);
          
          return {
            content: [{
              type: 'text',
              text: result ? '✅ Task moved successfully!' : '❌ Failed to move task'
            }]
          };

        case 'get_task':
          result = await kanboard.callAPI('getTask', { task_id: args.task_id });
          
          if (!result) {
            return {
              content: [{
                type: 'text',
                text: `❌ Task with ID ${args.task_id} not found`
              }]
            };
          }
          
          const taskInfo = `📋 Task Details:
          
ID: ${result.id}
Title: ${result.title}
Status: ${result.is_active == 1 ? '🟢 Active' : '🔴 Closed'}
Column: ${result.column_name || 'N/A'}
Priority: ${result.priority || 0}
Color: ${result.color_id || 'default'}
Created: ${new Date(result.date_creation * 1000).toLocaleString()}
${result.date_modification ? `Modified: ${new Date(result.date_modification * 1000).toLocaleString()}` : ''}

Description:
${result.description || 'No description'}`;
          
          return {
            content: [{
              type: 'text',
              text: taskInfo
            }]
          };

        case 'list_projects':
          result = await kanboard.callAPI('getAllProjects');
          
          if (!result || result.length === 0) {
            return {
              content: [{
                type: 'text',
                text: 'No projects found.'
              }]
            };
          }
          
          const projectList = result.map(project => 
            `• [${project.id}] ${project.name} ${project.is_active === '1' ? '🟢' : '🔴'}`
          ).join('\n');
          
          return {
            content: [{
              type: 'text',
              text: `📁 Projects (${result.length}):\n\n${projectList}`
            }]
          };

        case 'get_board':
          result = await kanboard.callAPI('getBoard', {
            project_id: args.project_id || 1
          });
          
          let boardView = '📊 Board Overview:\n\n';
          
          result.forEach(swimlane => {
            boardView += `**${swimlane.name}**\n`;
            swimlane.columns.forEach(column => {
              const taskCount = column.nb_tasks || 0;
              boardView += `  📍 ${column.title}: ${taskCount} task${taskCount !== 1 ? 's' : ''}\n`;
            });
            boardView += '\n';
          });
          
          return {
            content: [{
              type: 'text',
              text: boardView
            }]
          };

        case 'search_tasks':
          result = await kanboard.callAPI('searchTasks', {
            project_id: args.project_id || 1,
            query: args.query
          });
          
          if (!result || result.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No tasks found matching: "${args.query}"`
              }]
            };
          }
          
          const searchResults = result.map(task => 
            `• [${task.id}] ${task.title} (Project: ${task.project_name})`
          ).join('\n');
          
          return {
            content: [{
              type: 'text',
              text: `🔍 Search Results (${result.length}):\n\n${searchResults}`
            }]
          };

        case 'add_comment':
          result = await kanboard.callAPI('createComment', {
            task_id: args.task_id,
            content: args.content,
            user_id: 1 // Use admin user ID (same as task creation)
          });
          
          return {
            content: [{
              type: 'text',
              text: result ? `✅ Comment added to task ${args.task_id}` : '❌ Failed to add comment'
            }]
          };

        case 'get_task_comments':
          result = await kanboard.callAPI('getAllComments', {
            task_id: args.task_id
          });
          
          if (!result || result.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No comments found for task ${args.task_id}`
              }]
            };
          }
          
          const comments = result.map(comment => {
            const date = new Date(comment.date_creation * 1000).toLocaleString();
            const username = comment.username || comment.name || 'Unknown';
            return `### ${username} - ${date}\n${comment.comment}`;
          }).join('\n\n---\n\n');
          
          return {
            content: [{
              type: 'text',
              text: `💬 Comments for Task ${args.task_id}:\n\n${comments}`
            }]
          };

        case 'create_subtask':
          const subtaskData = {
            task_id: args.task_id,
            title: args.title,
            user_id: args.user_id || 1  // Default to user ID 1 (same as task creation)
          };
          
          if (args.time_estimated) subtaskData.time_estimated = args.time_estimated;
          if (args.time_spent) subtaskData.time_spent = args.time_spent;
          if (args.status !== undefined) subtaskData.status = args.status;
          
          result = await kanboard.callAPI('createSubtask', subtaskData);
          
          return {
            content: [{
              type: 'text',
              text: `✅ Subtask created successfully!\n\nSubtask ID: ${result}\nTitle: ${args.title}\nParent Task ID: ${args.task_id}`
            }]
          };

        case 'list_subtasks':
          result = await kanboard.callAPI('getAllSubtasks', {
            task_id: args.task_id
          });
          
          if (!result || result.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No subtasks found for task ${args.task_id}`
              }]
            };
          }
          
          const subtaskStatusMap = { 0: '📝 Todo', 1: '🔄 In Progress', 2: '✅ Done' };
          const subtaskList = result.map(subtask => {
            const status = subtaskStatusMap[subtask.status] || '❓ Unknown';
            const assignee = subtask.username || subtask.name || 'Unassigned';
            let details = `• [${subtask.id}] ${subtask.title} - ${status} (${assignee})`;
            
            if (subtask.time_estimated || subtask.time_spent) {
              const estimated = subtask.time_estimated || 0;
              const spent = subtask.time_spent || 0;
              details += ` - Time: ${spent}/${estimated}h`;
            }
            
            return details;
          }).join('\n');
          
          return {
            content: [{
              type: 'text',
              text: `📋 Subtasks for Task ${args.task_id} (${result.length}):\n\n${subtaskList}`
            }]
          };

        case 'update_subtask':
          try {
            // First, get the subtask details to obtain the task_id
            const currentSubtask = await kanboard.callAPI('getSubtask', {
              subtask_id: args.subtask_id
            });
            
            if (!currentSubtask) {
              return {
                content: [{
                  type: 'text',
                  text: `❌ Subtask with ID ${args.subtask_id} not found`
                }]
              };
            }
            
            // Prepare update parameters - Kanboard requires both id and task_id
            const updateParams = {
              id: args.subtask_id,
              task_id: currentSubtask.task_id  // Required parameter!
            };
            
            // Add other fields if provided
            if (args.title !== undefined) updateParams.title = args.title;
            if (args.user_id !== undefined) updateParams.user_id = args.user_id;
            if (args.time_estimated !== undefined) updateParams.time_estimated = args.time_estimated;
            if (args.time_spent !== undefined) updateParams.time_spent = args.time_spent;
            if (args.status !== undefined) updateParams.status = args.status;
            
            // Make a single API call with all parameters
            result = await kanboard.callAPI('updateSubtask', updateParams);
            
            // List fields that were updated
            const updatedFields = [];
            if (args.title !== undefined) updatedFields.push('title');
            if (args.user_id !== undefined) updatedFields.push('assignee');
            if (args.time_estimated !== undefined) updatedFields.push('time_estimated');
            if (args.time_spent !== undefined) updatedFields.push('time_spent');
            if (args.status !== undefined) updatedFields.push('status');
            
            return {
              content: [{
                type: 'text',
                text: result 
                  ? `✅ Subtask updated successfully! Updated fields: ${updatedFields.join(', ')}`
                  : '❌ Failed to update subtask'
              }]
            };
            
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ Failed to update subtask: ${error.message}`
              }]
            };
          }

        case 'get_subtask':
          result = await kanboard.callAPI('getSubtask', {
            subtask_id: args.subtask_id
          });
          
          if (!result) {
            return {
              content: [{
                type: 'text',
                text: `❌ Subtask with ID ${args.subtask_id} not found`
              }]
            };
          }
          
          const statusText = { 0: '📝 Todo', 1: '🔄 In Progress', 2: '✅ Done' };
          const assigneeName = result.username || result.name || 'Unassigned';
          
          const subtaskInfo = `📋 Subtask Details:
          
ID: ${result.id}
Title: ${result.title}
Parent Task ID: ${result.task_id}
Status: ${statusText[result.status] || '❓ Unknown'}
Assignee: ${assigneeName} (ID: ${result.user_id || 'N/A'})
Position: ${result.position}

Time Tracking:
- Estimated: ${result.time_estimated || 0} hours
- Spent: ${result.time_spent || 0} hours
- Remaining: ${Math.max(0, (result.time_estimated || 0) - (result.time_spent || 0))} hours`;
          
          return {
            content: [{
              type: 'text',
              text: subtaskInfo
            }]
          };

        case 'compact_task_comments':
          try {
            // Get task details
            const task = await kanboard.callAPI('getTask', { task_id: args.task_id });
            if (!task) {
              return {
                content: [{
                  type: 'text',
                  text: `❌ Task with ID ${args.task_id} not found`
                }]
              };
            }

            // Get all comments for the task
            const comments = await kanboard.callAPI('getAllComments', { task_id: args.task_id });
            
            if (!comments || comments.length === 0) {
              return {
                content: [{
                  type: 'text',
                  text: `📝 No comments to compact for task ${args.task_id}`
                }]
              };
            }

            // Analyze and compact comments
            const compactedSections = [];
            const keyInfo = new Map();
            const errors = [];
            const solutions = [];
            const implementations = [];
            const importantNotes = [];
            
            // Process each comment
            comments.forEach(comment => {
              const content = comment.comment || '';
              const lines = content.split('\n');
              
              lines.forEach(line => {
                const trimmedLine = line.trim();
                
                // Skip empty lines
                if (!trimmedLine) return;
                
                // Detect error patterns
                if (trimmedLine.match(/error:|❌|failed|exception|bug|issue/i)) {
                  if (!errors.some(e => e.includes(trimmedLine))) {
                    errors.push(trimmedLine);
                  }
                }
                
                // Detect solution patterns
                else if (trimmedLine.match(/solution:|fix:|fixed:|resolved:|✅ fixed|✅ solution/i)) {
                  if (!solutions.some(s => s.includes(trimmedLine))) {
                    solutions.push(trimmedLine);
                  }
                }
                
                // Detect implementation patterns
                else if (trimmedLine.match(/implemented:|created:|added:|updated:|modified:|changed:/i)) {
                  if (!implementations.some(i => i.includes(trimmedLine))) {
                    implementations.push(trimmedLine);
                  }
                }
                
                // Detect important notes
                else if (trimmedLine.match(/important:|note:|warning:|⚠️|🔔|critical:|todo:|pending:/i)) {
                  if (!importantNotes.some(n => n.includes(trimmedLine))) {
                    importantNotes.push(trimmedLine);
                  }
                }
                
                // Detect key-value information
                else if (trimmedLine.includes(':') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
                  const [key, ...valueParts] = trimmedLine.split(':');
                  const value = valueParts.join(':').trim();
                  if (key && value && !keyInfo.has(key)) {
                    keyInfo.set(key, value);
                  }
                }
              });
            });

            // Build compacted summary
            let compactedContent = `## 📋 Task Summary: ${task.title}\n\n`;
            
            // Add description if exists
            if (task.description) {
              compactedContent += `### Description\n${task.description}\n\n`;
            }
            
            // Add errors if any
            if (errors.length > 0) {
              compactedContent += `### 🐛 Issues/Errors\n`;
              errors.forEach(error => {
                compactedContent += `- ${error}\n`;
              });
              compactedContent += '\n';
            }
            
            // Add solutions if any
            if (solutions.length > 0) {
              compactedContent += `### ✅ Solutions\n`;
              solutions.forEach(solution => {
                compactedContent += `- ${solution}\n`;
              });
              compactedContent += '\n';
            }
            
            // Add implementations if any
            if (implementations.length > 0) {
              compactedContent += `### 🔧 Implementations\n`;
              implementations.forEach(impl => {
                compactedContent += `- ${impl}\n`;
              });
              compactedContent += '\n';
            }
            
            // Add important notes if any
            if (importantNotes.length > 0) {
              compactedContent += `### ⚠️ Important Notes\n`;
              importantNotes.forEach(note => {
                compactedContent += `- ${note}\n`;
              });
              compactedContent += '\n';
            }
            
            // Add key information if any
            if (keyInfo.size > 0) {
              compactedContent += `### 📊 Key Information\n`;
              keyInfo.forEach((value, key) => {
                compactedContent += `- **${key}**: ${value}\n`;
              });
              compactedContent += '\n';
            }
            
            // Add metadata
            compactedContent += `### 📅 Metadata\n`;
            compactedContent += `- Original comments: ${comments.length}\n`;
            compactedContent += `- Compacted on: ${new Date().toLocaleString()}\n`;
            compactedContent += `- Task status: ${task.is_active == 1 ? '🟢 Active' : '🔴 Closed'}\n`;
            
            // Delete all existing comments
            for (const comment of comments) {
              await kanboard.callAPI('removeComment', { comment_id: comment.id });
            }
            
            // Add the compacted comment
            await kanboard.callAPI('createComment', {
              task_id: args.task_id,
              content: compactedContent,
              user_id: 1
            });
            
            return {
              content: [{
                type: 'text',
                text: `✅ Successfully compacted ${comments.length} comments into 1 consolidated summary for task ${args.task_id}!`
              }]
            };
            
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ Failed to compact comments: ${error.message}`
              }]
            };
          }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Error: ${error.message}`
        }],
        isError: true
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kanboard MCP Server running on stdio');
}

main().catch(console.error);