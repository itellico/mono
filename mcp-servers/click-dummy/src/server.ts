#!/usr/bin/env node
/**
 * Click-Dummy MCP Server
 * 
 * Provides access to PHP click-dummy prototypes and their metadata
 * for intelligent auto-coding with Claude.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ClickDummyHandler } from './handlers/click-dummy-handler.js';
import { MetadataHandler } from './handlers/metadata-handler.js';
import { FeatureMapHandler } from './handlers/feature-map-handler.js';

class ClickDummyMCPServer {
  private server: Server;
  private clickDummyHandler: ClickDummyHandler;
  private metadataHandler: MetadataHandler;
  private featureMapHandler: FeatureMapHandler;

  constructor() {
    this.server = new Server(
      {
        name: 'itellico-click-dummy-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize handlers
    this.clickDummyHandler = new ClickDummyHandler();
    this.metadataHandler = new MetadataHandler();
    this.featureMapHandler = new FeatureMapHandler();

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_click_dummy',
            description: 'Search for click-dummy prototypes by feature or component name',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for prototype features',
                },
                tier: {
                  type: 'string',
                  description: 'Filter by tier (platform, tenant, account, user, public)',
                  enum: ['platform', 'tenant', 'account', 'user', 'public'],
                },
                feature_type: {
                  type: 'string',
                  description: 'Filter by feature type',
                  enum: ['dashboard', 'form', 'table', 'wizard', 'settings', 'profile', 'marketplace'],
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_prototype_details',
            description: 'Get detailed information about a specific click-dummy prototype',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the prototype file (e.g., platform/schemas/builder.php)',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'list_prototype_features',
            description: 'List all available features in click-dummy prototypes',
            inputSchema: {
              type: 'object',
              properties: {
                tier: {
                  type: 'string',
                  description: 'Filter by tier',
                  enum: ['platform', 'tenant', 'account', 'user', 'public'],
                },
              },
            },
          },
          {
            name: 'get_feature_implementation_map',
            description: 'Get mapping between click-dummy prototypes and actual implementation files',
            inputSchema: {
              type: 'object',
              properties: {
                feature: {
                  type: 'string',
                  description: 'Feature name to map',
                },
              },
              required: ['feature'],
            },
          },
          {
            name: 'get_ui_components',
            description: 'Get reusable UI components from click-dummy prototypes',
            inputSchema: {
              type: 'object',
              properties: {
                component_type: {
                  type: 'string',
                  description: 'Type of component',
                  enum: ['table', 'form', 'card', 'modal', 'wizard', 'media', 'navigation'],
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

      if (!args) {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments required');
      }

      try {
        switch (name) {
          case 'search_click_dummy':
            return await this.clickDummyHandler.searchPrototypes(
              args.query as string,
              args.tier as string | undefined,
              args.feature_type as string | undefined
            );

          case 'get_prototype_details':
            return await this.clickDummyHandler.getPrototypeDetails(args.path as string);

          case 'list_prototype_features':
            return await this.clickDummyHandler.listFeatures(args.tier as string | undefined);

          case 'get_feature_implementation_map':
            return await this.featureMapHandler.getImplementationMap(args.feature as string);

          case 'get_ui_components':
            return await this.clickDummyHandler.getUIComponents(args.component_type as string | undefined);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Click-Dummy MCP server running on stdio');
  }
}

// Start the server
const server = new ClickDummyMCPServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});