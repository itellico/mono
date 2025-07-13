#!/usr/bin/env node

/**
 * itellico Mono MCP Server
 * 
 * Provides structured access to project documentation, architecture,
 * development workflows, and code patterns for Claude Code.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { DocumentationHandler } from './handlers/documentation.js';
import { ArchitectureHandler } from './handlers/architecture.js';
import { WorkflowHandler } from './handlers/workflows.js';
import { PatternsHandler } from './handlers/patterns.js';
import { ProjectStatusHandler } from './handlers/project-status.js';

class ItelliocoMonoMCPServer {
  private server: Server;
  private documentationHandler: DocumentationHandler;
  private architectureHandler: ArchitectureHandler;
  private workflowHandler: WorkflowHandler;
  private patternsHandler: PatternsHandler;
  private projectStatusHandler: ProjectStatusHandler;

  constructor() {
    this.server = new Server(
      {
        name: 'itellico-mono-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize handlers
    this.documentationHandler = new DocumentationHandler();
    this.architectureHandler = new ArchitectureHandler();
    this.workflowHandler = new WorkflowHandler();
    this.patternsHandler = new PatternsHandler();
    this.projectStatusHandler = new ProjectStatusHandler();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_documentation',
            description: 'Search project documentation using semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for documentation',
                },
                category: {
                  type: 'string',
                  description: 'Optional category filter (architecture, features, guides, etc.)',
                  enum: ['architecture', 'features', 'guides', 'api', 'testing', 'deployment'],
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 5,
                  minimum: 1,
                  maximum: 20,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_architecture_info',
            description: 'Get specific architectural information and patterns',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'System component (api, frontend, database, cache, etc.)',
                  enum: ['api', 'frontend', 'database', 'cache', 'auth', 'monitoring', 'deployment'],
                },
                aspect: {
                  type: 'string',
                  description: 'Specific aspect to query (structure, patterns, conventions, etc.)',
                  enum: ['structure', 'patterns', 'conventions', 'security', 'performance'],
                },
              },
              required: ['component'],
            },
          },
          {
            name: 'get_development_workflow',
            description: 'Get step-by-step development workflows and procedures',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Type of development task',
                  enum: ['new-feature', 'bug-fix', 'testing', 'deployment', 'api-route', 'component', 'migration'],
                },
                context: {
                  type: 'string',
                  description: 'Additional context or specific requirements',
                },
              },
              required: ['task'],
            },
          },
          {
            name: 'get_code_patterns',
            description: 'Get reusable code patterns, templates, and examples',
            inputSchema: {
              type: 'object',
              properties: {
                pattern_type: {
                  type: 'string',
                  description: 'Type of code pattern',
                  enum: ['component', 'service', 'route', 'hook', 'util', 'test', 'migration'],
                },
                technology: {
                  type: 'string',
                  description: 'Technology stack',
                  enum: ['react', 'fastify', 'prisma', 'typescript', 'tailwind', 'tanstack-query'],
                },
              },
              required: ['pattern_type'],
            },
          },
          {
            name: 'get_project_status',
            description: 'Get current project status, priorities, and implementation state',
            inputSchema: {
              type: 'object',
              properties: {
                area: {
                  type: 'string',
                  description: 'Specific project area to query',
                  enum: ['overall', 'frontend', 'backend', 'features', 'infrastructure', 'documentation'],
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_documentation':
            return await this.documentationHandler.search(args as any);
          
          case 'get_architecture_info':
            return await this.architectureHandler.getInfo(args as any);
          
          case 'get_development_workflow':
            return await this.workflowHandler.getWorkflow(args as any);
          
          case 'get_code_patterns':
            return await this.patternsHandler.getPattern(args as any);
          
          case 'get_project_status':
            return await this.projectStatusHandler.getStatus(args as any);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('itellico Mono MCP Server started');
  }
}

// Start the server
const server = new ItelliocoMonoMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});