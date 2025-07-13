/**
 * Code patterns and templates handler
 */

import { BaseHandler } from './base.js';

interface PatternsArgs {
  pattern_type: string;
  technology?: string;
}

export class PatternsHandler extends BaseHandler {
  private patterns: Map<string, any> = new Map();

  constructor() {
    super();
    this.loadPatterns();
  }

  /**
   * Load code patterns
   */
  private loadPatterns(): void {
    // Fastify route patterns
    this.patterns.set('route.fastify', {
      title: 'Fastify API Route Pattern',
      technology: 'fastify',
      description: 'Standard pattern for creating Fastify API routes following 4-tier architecture',
      template: `import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

export const {resource}Routes: FastifyPluginAsync = async (fastify) => {
  // GET endpoint
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('{tier}.{resource}.read')
    ],
    schema: {
      tags: ['{tier}.{resource}'],
      summary: 'Get {resource} list',
      description: 'Retrieve all {resource} for the current user/tenant',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String(),
            // Add other fields
          }))
        })
      }
    },
    async handler(request, reply) {
      try {
        // Implementation logic
        const data = []; // Your data fetching logic
        
        return {
          success: true,
          data
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your request'
        });
      }
    }
  });

  // POST endpoint
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('{tier}.{resource}.create')
    ],
    schema: {
      tags: ['{tier}.{resource}'],
      summary: 'Create new {resource}',
      body: Type.Object({
        // Define request body schema
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            // Add created resource fields
          })
        })
      }
    },
    async handler(request, reply) {
      try {
        // Implementation logic
        const data = {}; // Your creation logic
        
        return reply.status(201).send({
          success: true,
          data
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'CREATION_FAILED',
          message: 'Failed to create {resource}'
        });
      }
    }
  });
};`,
      variables: {
        '{resource}': 'Resource name (e.g., users, categories)',
        '{tier}': 'API tier (public, user, account, tenant, platform)',
      },
      example: {
        resource: 'categories',
        tier: 'user',
        file: 'apps/api/src/routes/v1/user/categories/index.ts',
      },
    });

    // React component patterns
    this.patterns.set('component.react', {
      title: 'React Component Pattern',
      technology: 'react',
      description: 'Standard React component with TypeScript and performance optimizations',
      template: `import { memo, useCallback, useMemo } from 'react';

interface {ComponentName}Props {
  // Define props interface
  id: string;
  title: string;
  onAction?: (id: string) => void;
  className?: string;
}

export const {ComponentName} = memo(function {ComponentName}({
  id,
  title,
  onAction,
  className = ''
}: {ComponentName}Props) {
  // Memoize expensive calculations
  const computedValue = useMemo(() => {
    // Expensive computation
    return title.toUpperCase();
  }, [title]);

  // Stable callback references
  const handleClick = useCallback(() => {
    onAction?.(id);
  }, [id, onAction]);

  return (
    <div className={\`base-styles \${className}\`}>
      <h3>{computedValue}</h3>
      <button onClick={handleClick}>
        Action
      </button>
    </div>
  );
});`,
      rules: [
        'Always use TypeScript interfaces for props',
        'Use memo() for components that re-render frequently',
        'Use useMemo() for expensive calculations',
        'Use useCallback() for stable function references',
        'Export as named export, not default',
        'Include className prop for styling flexibility',
      ],
    });

    // Custom React hook pattern
    this.patterns.set('hook.react', {
      title: 'Custom React Hook Pattern',
      technology: 'react',
      description: 'Custom hook pattern with proper error handling and loading states',
      template: `import { useState, useEffect, useCallback } from 'react';

interface Use{HookName}Options {
  enabled?: boolean;
  refetchInterval?: number;
}

interface Use{HookName}Result<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function use{HookName}<T = any>(
  options: Use{HookName}Options = {}
): Use{HookName}Result<T> {
  const { enabled = true, refetchInterval } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Your data fetching logic here
      const result = await fetch('/api/data');
      const responseData = await result.json();
      
      setData(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}`,
      rules: [
        'Always include loading and error states',
        'Use proper TypeScript generics',
        'Include enabled option for conditional fetching',
        'Provide refetch capability',
        'Clean up intervals and subscriptions',
      ],
    });

    // Service pattern
    this.patterns.set('service.typescript', {
      title: 'Service Class Pattern',
      technology: 'typescript',
      description: 'Service class for business logic with proper error handling',
      template: `import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface {ServiceName}Data {
  // Define data interface
}

export interface Create{ServiceName}Input {
  // Define input interface
}

export class {ServiceName}Service {
  private static instance: {ServiceName}Service;

  private constructor() {}

  static getInstance(): {ServiceName}Service {
    if (!{ServiceName}Service.instance) {
      {ServiceName}Service.instance = new {ServiceName}Service();
    }
    return {ServiceName}Service.instance;
  }

  async getAll(tenantId: string): Promise<{ServiceName}Data[]> {
    try {
      const items = await prisma.{modelName}.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return items;
    } catch (error) {
      logger.error('Error fetching {modelName}:', error);
      throw new Error('Failed to fetch {modelName}');
    }
  }

  async getById(id: string, tenantId: string): Promise<{ServiceName}Data | null> {
    try {
      const item = await prisma.{modelName}.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      return item;
    } catch (error) {
      logger.error(\`Error fetching {modelName} \${id}:\`, error);
      throw new Error('Failed to fetch {modelName}');
    }
  }

  async create(data: Create{ServiceName}Input, tenantId: string): Promise<{ServiceName}Data> {
    try {
      const item = await prisma.{modelName}.create({
        data: {
          ...data,
          tenantId,
        },
      });

      logger.info(\`Created {modelName} \${item.id} for tenant \${tenantId}\`);
      return item;
    } catch (error) {
      logger.error('Error creating {modelName}:', error);
      throw new Error('Failed to create {modelName}');
    }
  }

  async update(id: string, data: Partial<Create{ServiceName}Input>, tenantId: string): Promise<{ServiceName}Data> {
    try {
      const item = await prisma.{modelName}.update({
        where: {
          id,
          tenantId,
        },
        data,
      });

      logger.info(\`Updated {modelName} \${id} for tenant \${tenantId}\`);
      return item;
    } catch (error) {
      logger.error(\`Error updating {modelName} \${id}:\`, error);
      throw new Error('Failed to update {modelName}');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.{modelName}.delete({
        where: {
          id,
          tenantId,
        },
      });

      logger.info(\`Deleted {modelName} \${id} for tenant \${tenantId}\`);
    } catch (error) {
      logger.error(\`Error deleting {modelName} \${id}:\`, error);
      throw new Error('Failed to delete {modelName}');
    }
  }
}

// Export singleton instance
export const {serviceName}Service = {ServiceName}Service.getInstance();`,
      variables: {
        '{ServiceName}': 'Service class name (e.g., Category, User)',
        '{serviceName}': 'Service instance name (e.g., category, user)',
        '{modelName}': 'Prisma model name (e.g., category, user)',
      },
    });

    // Utility function pattern
    this.patterns.set('util.typescript', {
      title: 'Utility Function Pattern',
      technology: 'typescript',
      description: 'Utility function with proper TypeScript types and error handling',
      template: `/**
 * {Description}
 */

export interface {UtilName}Options {
  // Define options interface
  strict?: boolean;
  defaultValue?: any;
}

export interface {UtilName}Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function {utilName}<T = any>(
  input: unknown,
  options: {UtilName}Options = {}
): {UtilName}Result<T> {
  const { strict = false, defaultValue } = options;

  try {
    // Validation logic
    if (!input) {
      if (strict) {
        return {
          success: false,
          error: 'Input is required',
        };
      }
      return {
        success: true,
        data: defaultValue,
      };
    }

    // Processing logic
    const result = processInput(input);

    return {
      success: true,
      data: result as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}

function processInput(input: unknown): unknown {
  // Implementation logic
  return input;
}`,
      rules: [
        'Always include proper TypeScript types',
        'Return result objects with success/error states',
        'Include options parameter for flexibility',
        'Add comprehensive JSDoc documentation',
        'Handle all error cases gracefully',
      ],
    });
  }

  /**
   * Get code pattern
   */
  async getPattern(args: PatternsArgs) {
    const { pattern_type, technology } = args;

    try {
      // Try exact match first
      let patternKey = pattern_type.toLowerCase();
      if (technology) {
        patternKey = `${pattern_type.toLowerCase()}.${technology.toLowerCase()}`;
      }

      let pattern = this.patterns.get(patternKey);

      // If no exact match, try pattern_type only
      if (!pattern) {
        const matches = Array.from(this.patterns.entries()).filter(([key]) => 
          key.startsWith(pattern_type.toLowerCase())
        );

        if (matches.length === 1) {
          pattern = matches[0][1];
        } else if (matches.length > 1) {
          const availableOptions = matches.map(([key]) => key).join(', ');
          return this.formatResponse(`Multiple patterns found for "${pattern_type}". Available options: ${availableOptions}`);
        }
      }
      
      if (!pattern) {
        const availablePatterns = Array.from(this.patterns.keys()).join(', ');
        return this.formatResponse(`Pattern "${pattern_type}" not found. Available patterns: ${availablePatterns}`);
      }

      const response = this.formatPattern(pattern);
      return this.formatResponse(response);

    } catch (error) {
      return this.formatResponse(`Error retrieving pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format pattern for display
   */
  private formatPattern(pattern: any): string {
    let response = `# ${pattern.title}\n\n`;

    if (pattern.technology) {
      response += `**Technology:** ${pattern.technology}\n\n`;
    }

    if (pattern.description) {
      response += `${pattern.description}\n\n`;
    }

    if (pattern.template) {
      response += `## Template\n\n\`\`\`typescript\n${pattern.template}\n\`\`\`\n\n`;
    }

    if (pattern.variables) {
      response += `## Template Variables\n\n`;
      for (const [variable, description] of Object.entries(pattern.variables)) {
        response += `- **${variable}**: ${description}\n`;
      }
      response += `\n`;
    }

    if (pattern.rules && pattern.rules.length > 0) {
      response += `## Rules\n\n`;
      for (const rule of pattern.rules) {
        response += `- ${rule}\n`;
      }
      response += `\n`;
    }

    if (pattern.example) {
      response += `## Example Usage\n\n`;
      if (typeof pattern.example === 'object') {
        for (const [key, value] of Object.entries(pattern.example)) {
          response += `- **${key}**: ${value}\n`;
        }
      } else {
        response += `${pattern.example}\n`;
      }
      response += `\n`;
    }

    return response;
  }

  /**
   * List all available patterns
   */
  async listPatterns() {
    const patterns = Array.from(this.patterns.entries());
    
    let response = `# Available Code Patterns\n\n`;
    
    const grouped = new Map<string, any[]>();
    
    for (const [key, pattern] of patterns) {
      const category = key.split('.')[0];
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push({ key, ...pattern });
    }

    for (const [category, categoryPatterns] of grouped) {
      response += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Patterns\n\n`;
      
      for (const pattern of categoryPatterns) {
        response += `### ${pattern.key}\n`;
        response += `**${pattern.title}**\n`;
        if (pattern.technology) {
          response += `*Technology: ${pattern.technology}*\n`;
        }
        response += `${pattern.description}\n\n`;
      }
    }

    return this.formatResponse(response);
  }
}