#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

const server = new Server(
  {
    name: "mono-api",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Test API endpoint
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "test_api_endpoint",
        description: "Test an API endpoint with various HTTP methods",
        inputSchema: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
              description: "HTTP method to use",
            },
            path: {
              type: "string",
              description: "API path (e.g., /api/v1/public/health)",
            },
            body: {
              type: "object",
              description: "Request body for POST/PUT/PATCH requests",
            },
            headers: {
              type: "object",
              description: "Additional headers to include",
            },
          },
          required: ["method", "path"],
        },
      },
      {
        name: "get_api_coverage",
        description: "Get API endpoint coverage statistics",
        inputSchema: {
          type: "object",
          properties: {
            tier: {
              type: "string",
              enum: ["public", "user", "account", "tenant", "platform", "all"],
              description: "API tier to analyze",
            },
          },
          required: ["tier"],
        },
      },
      {
        name: "generate_api_mock",
        description: "Generate mock data for an API endpoint",
        inputSchema: {
          type: "object",
          properties: {
            endpoint: {
              type: "string",
              description: "API endpoint path",
            },
            schema: {
              type: "object",
              description: "Expected response schema",
            },
          },
          required: ["endpoint"],
        },
      },
      {
        name: "validate_api_response",
        description: "Validate API response against expected schema",
        inputSchema: {
          type: "object",
          properties: {
            endpoint: {
              type: "string",
              description: "API endpoint that was called",
            },
            response: {
              type: "object",
              description: "Actual API response",
            },
            expectedSchema: {
              type: "object",
              description: "Expected response schema",
            },
          },
          required: ["endpoint", "response", "expectedSchema"],
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
      case "test_api_endpoint": {
        const { method, path, body, headers } = args as {
          method: string;
          path: string;
          body?: any;
          headers?: Record<string, string>;
        };
        const url = `${API_BASE_URL}${path}`;
        
        try {
          const response = await axios({
            method,
            url,
            data: body,
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            validateStatus: () => true, // Don't throw on any status
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                  data: response.data,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                  code: error.code,
                }, null, 2),
              },
            ],
          };
        }
      }

      case "get_api_coverage": {
        // This would normally connect to a database or analyze routes
        // For now, return a summary based on the audit
        const coverage = {
          public: { total: 20, implemented: 16, percentage: 80 },
          user: { total: 25, implemented: 18, percentage: 72 },
          account: { total: 20, implemented: 17, percentage: 85 },
          tenant: { total: 50, implemented: 45, percentage: 90 },
          platform: { total: 25, implemented: 20, percentage: 80 },
        };

        const tier = (args as { tier?: string })?.tier || "all";
        const result = tier === "all" ? coverage : { [tier]: coverage[tier as keyof typeof coverage] };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_api_mock": {
        const { endpoint, schema } = args as {
          endpoint: string;
          schema?: any;
        };
        
        // Simple mock data generator
        const generateMockData = (schema: any): any => {
          if (!schema || !schema.type) return null;

          switch (schema.type) {
            case "string":
              return schema.enum ? schema.enum[0] : "mock-string";
            case "number":
              return 42;
            case "boolean":
              return true;
            case "array":
              return [generateMockData(schema.items)];
            case "object":
              const obj: any = {};
              if (schema.properties) {
                for (const [key, prop] of Object.entries(schema.properties)) {
                  obj[key] = generateMockData(prop);
                }
              }
              return obj;
            default:
              return null;
          }
        };

        const mockData = {
          endpoint,
          method: "GET",
          status: 200,
          response: {
            success: true,
            data: schema ? generateMockData(schema) : { id: "mock-id", name: "Mock Data" },
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(mockData, null, 2),
            },
          ],
        };
      }

      case "validate_api_response": {
        const { endpoint, response, expectedSchema } = args as {
          endpoint: string;
          response: any;
          expectedSchema?: any;
        };
        
        // Simple schema validation
        const validate = (data: any, schema: any): string[] => {
          const errors: string[] = [];
          
          if (!schema) return errors;

          if (schema.type && typeof data !== schema.type) {
            errors.push(`Expected type ${schema.type}, got ${typeof data}`);
          }

          if (schema.type === "object" && schema.properties) {
            for (const [key, prop] of Object.entries(schema.properties)) {
              if (schema.required?.includes(key) && !(key in data)) {
                errors.push(`Missing required property: ${key}`);
              }
              if (key in data) {
                const subErrors = validate(data[key], prop);
                errors.push(...subErrors.map(e => `${key}.${e}`));
              }
            }
          }

          return errors;
        };

        const errors = validate(response, expectedSchema);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                endpoint,
                valid: errors.length === 0,
                errors,
              }, null, 2),
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
  console.error("Mono API MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});