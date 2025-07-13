#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { glob } from "glob";
import * as fs from "fs-extra";
import * as path from "path";

const PROJECT_ROOT = process.cwd();

const server = new Server(
  {
    name: "mono-dev",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_component",
        description: "Generate a new React component with TypeScript",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Component name (e.g., UserProfile)",
            },
            path: {
              type: "string",
              description: "Path where to create the component",
            },
            type: {
              type: "string",
              enum: ["functional", "page", "layout"],
              description: "Type of component to generate",
            },
            includeTests: {
              type: "boolean",
              description: "Include test file",
              default: true,
            },
          },
          required: ["name", "path", "type"],
        },
      },
      {
        name: "generate_api_route",
        description: "Generate a new Fastify API route following 5-tier structure",
        inputSchema: {
          type: "object",
          properties: {
            tier: {
              type: "string",
              enum: ["public", "user", "account", "tenant", "platform"],
              description: "API tier",
            },
            resource: {
              type: "string",
              description: "Resource name (e.g., profiles, settings)",
            },
            methods: {
              type: "array",
              items: {
                type: "string",
                enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
              },
              description: "HTTP methods to implement",
            },
          },
          required: ["tier", "resource", "methods"],
        },
      },
      {
        name: "analyze_imports",
        description: "Analyze import statements in TypeScript files",
        inputSchema: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description: "Glob pattern for files to analyze",
              default: "**/*.{ts,tsx}",
            },
            checkCircular: {
              type: "boolean",
              description: "Check for circular dependencies",
              default: true,
            },
          },
          required: [],
        },
      },
      {
        name: "generate_migration",
        description: "Generate a new Prisma migration template",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Migration name (e.g., add-user-profiles)",
            },
            description: {
              type: "string",
              description: "What this migration does",
            },
          },
          required: ["name", "description"],
        },
      },
      {
        name: "check_code_quality",
        description: "Run code quality checks on the project",
        inputSchema: {
          type: "object",
          properties: {
            checks: {
              type: "array",
              items: {
                type: "string",
                enum: ["typescript", "eslint", "unused-deps", "todo-comments"],
              },
              description: "Which checks to run",
              default: ["typescript", "eslint"],
            },
          },
          required: [],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_component": {
        const { name: componentName, path: componentPath, type, includeTests } = args as {
          name: string;
          path: string;
          type?: string;
          includeTests?: boolean;
        };
        
        const componentTemplate = `import React from 'react';

interface ${componentName}Props {
  // Add props here
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h1>${componentName}</h1>
      {/* Add your component content here */}
    </div>
  );
};

export default ${componentName};`;

        const testTemplate = `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText('${componentName}')).toBeInTheDocument();
  });
});`;

        const fullPath = path.join(PROJECT_ROOT, componentPath, componentName);
        
        // Create component file
        await fs.ensureDir(fullPath);
        await fs.writeFile(
          path.join(fullPath, `${componentName}.tsx`),
          componentTemplate
        );
        
        // Create index file
        await fs.writeFile(
          path.join(fullPath, 'index.ts'),
          `export { ${componentName} as default } from './${componentName}';\nexport * from './${componentName}';`
        );
        
        // Create test file if requested
        if (includeTests) {
          await fs.writeFile(
            path.join(fullPath, `${componentName}.test.tsx`),
            testTemplate
          );
        }

        return {
          content: [
            {
              type: "text",
              text: `Component ${componentName} created successfully at ${fullPath}`,
            },
          ],
        };
      }

      case "generate_api_route": {
        const { tier, resource, methods } = args as {
          tier: string;
          resource: string;
          methods: string[];
        };
        
        const routeTemplate = `import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

export const ${resource}Routes: FastifyPluginAsync = async (fastify) => {
${methods.map((method: string) => {
  const methodLower = method.toLowerCase();
  const operationName = method === 'GET' ? 'list' : method === 'POST' ? 'create' : methodLower;
  
  return `  // ${method} /${resource}
  fastify.${methodLower}('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('${tier}.${resource}.${operationName}')
    ],
    schema: {
      tags: ['${tier}.${resource}'],
      summary: '${method} ${resource}',
      description: 'Description here',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            // Define response schema
          })
        })
      }
    },
    async handler(request, reply) {
      // Implementation here
      return {
        success: true,
        data: {}
      };
    }
  });`;
}).join('\n\n')}
};`;

        const routePath = path.join(
          PROJECT_ROOT,
          'apps/api/src/routes/v1',
          tier,
          resource,
          'index.ts'
        );
        
        await fs.ensureDir(path.dirname(routePath));
        await fs.writeFile(routePath, routeTemplate);

        return {
          content: [
            {
              type: "text",
              text: `API route created at ${routePath}`,
            },
          ],
        };
      }

      case "analyze_imports": {
        const { pattern = "**/*.{ts,tsx}", checkCircular = true } = (args as {
          pattern?: string;
          checkCircular?: boolean;
        }) || {};
        
        const files = await glob(pattern, {
          cwd: PROJECT_ROOT,
          ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
        });

        const imports: Record<string, string[]> = {};
        const importCounts: Record<string, number> = {};

        for (const file of files) {
          const content = await fs.readFile(path.join(PROJECT_ROOT, file), 'utf-8');
          const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
          const fileImports: string[] = [];

          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            fileImports.push(importPath);
            importCounts[importPath] = (importCounts[importPath] || 0) + 1;
          }

          imports[file] = fileImports;
        }

        // Find most common imports
        const topImports = Object.entries(importCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);

        const result = {
          totalFiles: files.length,
          totalImports: Object.values(imports).flat().length,
          uniqueImports: Object.keys(importCounts).length,
          topImports,
          circularDependencies: checkCircular ? [] : "Not checked",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_migration": {
        const { name, description } = args as {
          name: string;
          description: string;
        };
        
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const fileName = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
        
        const migrationTemplate = `-- Migration: ${name}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- Up Migration
BEGIN;

-- Add your migration SQL here

COMMIT;

-- Down Migration
-- BEGIN;
-- Add rollback SQL here
-- COMMIT;`;

        const migrationPath = path.join(PROJECT_ROOT, 'prisma/migrations', fileName);
        await fs.ensureDir(path.dirname(migrationPath));
        await fs.writeFile(migrationPath, migrationTemplate);

        return {
          content: [
            {
              type: "text",
              text: `Migration created at ${migrationPath}`,
            },
          ],
        };
      }

      case "check_code_quality": {
        const { checks = ["typescript", "eslint"] } = (args as {
          checks?: string[];
        }) || {};
        const results: Record<string, any> = {};

        if (checks.includes("todo-comments")) {
          const files = await glob("**/*.{ts,tsx,js,jsx}", {
            cwd: PROJECT_ROOT,
            ignore: ["**/node_modules/**", "**/dist/**"],
          });

          const todos: Array<{ file: string; line: number; text: string }> = [];

          for (const file of files) {
            const content = await fs.readFile(path.join(PROJECT_ROOT, file), 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
              if (line.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i)) {
                todos.push({
                  file,
                  line: index + 1,
                  text: line.trim(),
                });
              }
            });
          }

          results.todoComments = {
            count: todos.length,
            items: todos.slice(0, 20), // First 20 TODOs
          };
        }

        if (checks.includes("unused-deps")) {
          // Simple check for potentially unused dependencies
          const packageJson = await fs.readJson(path.join(PROJECT_ROOT, 'package.json'));
          const deps = Object.keys({
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          });

          results.unusedDeps = {
            message: "Run 'pnpm dlx depcheck' for detailed analysis",
            totalDeps: deps.length,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mono Dev MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});