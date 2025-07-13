#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

console.error('Starting test server...');

try {
  const server = new Server(
    {
      name: 'test-kanboard',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  console.error('Server created');

  server.setRequestHandler('tools/list', async () => {
    console.error('Tools list requested');
    return {
      tools: [
        {
          name: 'test_tool',
          description: 'A test tool',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });

  console.error('Handlers set');

  const transport = new StdioServerTransport();
  console.error('Transport created');
  
  await server.connect(transport);
  console.error('Server connected and running');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}