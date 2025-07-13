/**
 * Architecture information handler
 */

import { BaseHandler } from './base.js';

interface ArchitectureArgs {
  component: string;
  aspect?: string;
}

export class ArchitectureHandler extends BaseHandler {
  private architectureData: Map<string, any> = new Map();

  constructor() {
    super();
    this.loadArchitectureData();
  }

  /**
   * Load architecture information
   */
  private async loadArchitectureData(): Promise<void> {
    // Core architecture patterns from CLAUDE.md content
    this.architectureData.set('api', {
      structure: {
        title: '4-Tier API Architecture',
        description: 'Hierarchical API structure with strict tier-based routing',
        pattern: '/api/v1/{tier}/{resource}/{action}',
        tiers: [
          { name: 'public', description: 'No authentication required', examples: ['/api/v1/public/health', '/api/v1/public/auth/login'] },
          { name: 'user', description: 'Individual user operations', examples: ['/api/v1/user/profile', '/api/v1/user/settings'] },
          { name: 'account', description: 'Feature-based account management', examples: ['/api/v1/account/users', '/api/v1/account/billing'] },
          { name: 'tenant', description: 'Tenant administration', examples: ['/api/v1/tenant/accounts', '/api/v1/tenant/permissions'] },
          { name: 'platform', description: 'System-wide operations', examples: ['/api/v1/platform/tenants', '/api/v1/platform/operations'] },
        ],
        responseFormat: {
          success: '{ "success": true, "data": {...} }',
          error: '{ "success": false, "error": "ERROR_CODE", "message": "Human readable" }',
          paginated: '{ "success": true, "data": { "items": [...], "pagination": {...} } }',
        },
      },
      patterns: {
        title: 'API Route Patterns',
        fastifyRoute: `export const {resource}Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/endpoint', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('{tier}.{resource}.read')
    ],
    schema: {
      tags: ['{tier}.{resource}'],
      summary: 'Short description',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({})
        })
      }
    },
    async handler(request, reply) {
      return { success: true, data: {} };
    }
  });
};`,
        tagNaming: 'Use dot notation: {tier}.{resource} (e.g., user.profile, tenant.permissions)',
        permissionNaming: 'Format: {tier}.{resource}.{action} (e.g., user.profile.read)',
      },
      conventions: {
        title: 'API Conventions',
        rules: [
          'ALL endpoints MUST follow 4-tier structure',
          'Tags MUST use dot notation for Swagger organization',
          'Responses MUST include success boolean',
          'Error codes MUST be UPPERCASE_SNAKE_CASE',
          'Permissions MUST follow tier.resource.action format',
        ],
      },
    });

    this.architectureData.set('frontend', {
      structure: {
        title: 'Next.js Frontend Architecture',
        description: 'Hybrid Next.js frontend with Fastify API backend',
        ports: {
          frontend: 3000,
          api: 3001,
          backup: 3010,
        },
        directories: {
          pages: 'src/app/ - App Router structure',
          components: 'src/components/ - Reusable UI components',
          lib: 'src/lib/ - Utilities and services',
          hooks: 'src/hooks/ - Custom React hooks',
        },
      },
      patterns: {
        title: 'React Performance Patterns',
        rules: [
          'ALWAYS use dependency arrays in useEffect',
          'Use React.memo for expensive components',
          'Use useMemo for expensive calculations',
          'Use useCallback for stable function references',
          'Split contexts by update frequency',
        ],
        example: `// ✅ GOOD: Proper dependency management
useEffect(() => { 
  doSomething(); 
}, [dep1, dep2]);

// ✅ GOOD: Memoized expensive component
export const MyComponent = memo(function MyComponent(props) { ... });`,
      },
      conventions: {
        title: 'Frontend Conventions',
        rules: [
          'Follow existing component patterns',
          'Use TypeScript for all new code',
          'Use Tailwind for styling',
          'Implement proper error boundaries',
          'Use TanStack Query for server state',
        ],
      },
    });

    this.architectureData.set('database', {
      structure: {
        title: 'PostgreSQL + Prisma Architecture',
        description: 'Multi-tenant database with Prisma ORM',
        features: [
          'Multi-tenant isolation',
          'UUID primary keys',
          'Audit logging',
          'Optimized permissions system',
        ],
      },
      patterns: {
        title: 'Database Patterns',
        migrations: 'Use Prisma migrations for schema changes',
        seeding: 'Comprehensive seeders for development data',
        queries: 'Use Prisma Client with proper error handling',
      },
      conventions: {
        title: 'Database Conventions',
        rules: [
          'All tables use UUID primary keys',
          'Follow tenant isolation patterns',
          'Use proper indexing for performance',
          'Implement audit trails where needed',
        ],
      },
    });

    this.architectureData.set('cache', {
      structure: {
        title: 'Redis Caching Strategy',
        description: 'Three-layer caching with Redis and TanStack Query',
        layers: [
          'TanStack Query (client-side)',
          'Redis (server-side)',
          'Database (source of truth)',
        ],
      },
      patterns: {
        title: 'Caching Decision Framework',
        rules: [
          'Frequency: >50 queries/min → Redis',
          'Computation: >1 second → Redis',
          'Sharing: Multiple users → Redis',
          'Personal: User-specific → TanStack Query',
          'Static: Changes rarely → TanStack Query',
        ],
        keyNaming: `{scope}:{entity}:{identifier}:{field}
Examples:
- platform:config:features
- tenant:1:user:123:permissions
- temp:session:abc-def-ghi`,
      },
    });

    this.architectureData.set('auth', {
      structure: {
        title: 'JWT Authentication System',
        description: 'Custom JWT auth replacing NextAuth',
        features: [
          'HTTP-only cookies for tokens',
          'Role-based access control (RBAC)',
          'Permission inheritance',
          'Session management',
        ],
      },
      security: {
        title: 'Security Best Practices',
        rules: [
          'Store tokens in HTTP-only cookies ONLY',
          'Never store auth data in localStorage',
          'Use secure cookies in production',
          'Implement proper CSRF protection',
          'Cache permissions server-side only',
        ],
      },
    });

    this.architectureData.set('monitoring', {
      structure: {
        title: 'Monitoring & Observability',
        description: 'Comprehensive monitoring with Prometheus + Grafana',
        components: [
          'Prometheus metrics collection',
          'Grafana dashboards',
          'API performance tracking',
          'System health monitoring',
        ],
      },
      patterns: {
        title: 'Monitoring Patterns',
        metrics: 'Expose metrics at /metrics endpoint',
        dashboards: 'Use pre-configured Grafana dashboards',
        alerts: 'Set up appropriate alert thresholds',
      },
    });
  }

  /**
   * Get architecture information
   */
  async getInfo(args: ArchitectureArgs) {
    const { component, aspect } = args;

    try {
      const componentData = this.architectureData.get(component.toLowerCase());
      
      if (!componentData) {
        const availableComponents = Array.from(this.architectureData.keys()).join(', ');
        return this.formatResponse(`Component "${component}" not found. Available components: ${availableComponents}`);
      }

      if (aspect) {
        const aspectData = componentData[aspect.toLowerCase()];
        if (!aspectData) {
          const availableAspects = Object.keys(componentData).join(', ');
          return this.formatResponse(`Aspect "${aspect}" not found for ${component}. Available aspects: ${availableAspects}`);
        }
        
        return this.formatResponse(this.formatAspectInfo(component, aspect, aspectData));
      }

      // Return all information for the component
      return this.formatResponse(this.formatComponentInfo(component, componentData));

    } catch (error) {
      return this.formatResponse(`Error retrieving architecture info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format component information
   */
  private formatComponentInfo(component: string, data: any): string {
    let response = `# ${component.toUpperCase()} Architecture\n\n`;

    for (const [aspectName, aspectData] of Object.entries(data)) {
      response += `## ${this.capitalizeFirst(aspectName)}\n\n`;
      response += this.formatAspectData(aspectData);
      response += `\n---\n\n`;
    }

    return response;
  }

  /**
   * Format specific aspect information
   */
  private formatAspectInfo(component: string, aspect: string, data: any): string {
    let response = `# ${component.toUpperCase()} - ${this.capitalizeFirst(aspect)}\n\n`;
    response += this.formatAspectData(data);
    return response;
  }

  /**
   * Format aspect data
   */
  private formatAspectData(data: any): string {
    let response = '';

    if (data.title) {
      response += `**${data.title}**\n\n`;
    }

    if (data.description) {
      response += `${data.description}\n\n`;
    }

    if (data.pattern) {
      response += `**Pattern:** \`${data.pattern}\`\n\n`;
    }

    if (data.rules && Array.isArray(data.rules)) {
      response += `**Rules:**\n`;
      for (const rule of data.rules) {
        response += `- ${rule}\n`;
      }
      response += `\n`;
    }

    if (data.tiers && Array.isArray(data.tiers)) {
      response += `**Tiers:**\n`;
      for (const tier of data.tiers) {
        response += `- **${tier.name}**: ${tier.description}\n`;
        if (tier.examples) {
          response += `  - Examples: ${tier.examples.join(', ')}\n`;
        }
      }
      response += `\n`;
    }

    if (data.layers && Array.isArray(data.layers)) {
      response += `**Layers:**\n`;
      for (let i = 0; i < data.layers.length; i++) {
        response += `${i + 1}. ${data.layers[i]}\n`;
      }
      response += `\n`;
    }

    if (data.example || data.fastifyRoute) {
      response += `**Example:**\n\`\`\`typescript\n${data.example || data.fastifyRoute}\n\`\`\`\n\n`;
    }

    if (data.responseFormat) {
      response += `**Response Formats:**\n`;
      for (const [type, format] of Object.entries(data.responseFormat)) {
        response += `- **${type}**: \`${format}\`\n`;
      }
      response += `\n`;
    }

    // Handle other object properties generically
    for (const [key, value] of Object.entries(data)) {
      if (!['title', 'description', 'pattern', 'rules', 'tiers', 'layers', 'example', 'fastifyRoute', 'responseFormat'].includes(key)) {
        if (typeof value === 'object' && value !== null) {
          response += `**${this.capitalizeFirst(key)}:**\n${JSON.stringify(value, null, 2)}\n\n`;
        } else {
          response += `**${this.capitalizeFirst(key)}:** ${value}\n\n`;
        }
      }
    }

    return response;
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}