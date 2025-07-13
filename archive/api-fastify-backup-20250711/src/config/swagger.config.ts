import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

// Single, well-organized Swagger configuration
export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'itellico Mono API - 4-Tier Architecture',
      description: `
# itellico Mono API Documentation

## 🏗️ 4-Tier Architecture

This API follows a hierarchical 4-tier structure:

1. **Platform Tier** (/api/v1/platform/*) - System-wide operations
2. **Tenant Tier** (/api/v1/tenant/*) - Tenant administration  
3. **Account Tier** (/api/v1/account/*) - Account/business management
4. **User Tier** (/api/v1/user/*) - Individual user operations
5. **Public Tier** (/api/v1/public/*) - No authentication required

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 📄 Response Format

All responses follow a consistent format:

### Success Response
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human readable message",
  "details": { ... }
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
\`\`\`
      `,
      version: '1.0.0',
      contact: {
        name: 'itellico Mono Team',
        email: 'support@monoplatform.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://monoplatform.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3010',
        description: 'Development server (backup port)',
      },
      {
        url: 'https://api.monoplatform.com',
        description: 'Production server',
      },
    ],
    tags: [
      // Public tier - No authentication required
      { name: 'public.auth', description: '🔓 Authentication - Login, register, and manage authentication' },
      { name: 'public.health', description: '🏥 Health Check - System health and status monitoring' },
      
      // User tier - Individual user operations
      { name: 'user.profile', description: '👤 User Profile - Manage your profile information' },
      { name: 'user.settings', description: '⚙️ User Settings - Personal preferences and account settings' },
      { name: 'user.content', description: '📝 My Content - Create and manage your content' },
      { name: 'user.media', description: '🖼️ My Media - Upload and manage media files' },
      { name: 'user.marketplace', description: '🛍️ Marketplace - Browse, buy, and sell in the marketplace' },
      { name: 'user.messaging', description: '💬 Messages - Send and receive messages' },
      { name: 'user.activity', description: '📊 Activity Feed - Track your activities and history' },
      { name: 'user.search', description: '🔍 Search - Search across the platform' },
      
      // Account tier - Business unit management
      { name: 'account.users', description: '👥 Team Management - Manage users in your account' },
      { name: 'account.business', description: '🏢 Business Features - Configure business settings and features' },
      { name: 'account.billing', description: '💳 Billing & Subscriptions - Manage payments and subscription plans' },
      { name: 'account.configuration', description: '🔧 Account Configuration - Configure account-wide settings' },
      { name: 'account.analytics', description: '📈 Account Analytics - View account metrics and insights' },
      
      // Tenant tier - Administrative operations
      { name: 'tenant.accounts', description: '🏢 Tenant Accounts - Manage all accounts in the tenant' },
      { name: 'tenant.users', description: '👥 Tenant Users - Administer all users in the tenant' },
      { name: 'tenant.permissions', description: '🔐 Access Control - Manage roles and permissions' },
      { name: 'tenant.content', description: '📚 Content Administration - Manage templates and content types' },
      { name: 'tenant.data', description: '🗄️ Data Configuration - Configure schemas and option sets' },
      { name: 'tenant.monitoring', description: '📊 Tenant Monitoring - Monitor tenant health and usage' },
      
      // Platform tier - System-wide operations
      { name: 'platform.tenants', description: '🌐 Platform Tenants - Manage all tenants in the system' },
      { name: 'platform.operations', description: '🔧 Platform Operations - System maintenance and operations' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/v1/public/auth/login',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      // Let TypeBox handle schema generation automatically
      // This prevents duplicate schemas in the Swagger UI
      schemas: {},
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Configure how TypeBox schemas are transformed to OpenAPI
  transform: ({ schema, url }) => {
    // Clean up auto-generated schema names to avoid duplicates
    if (schema && typeof schema === 'object') {
      // Remove response wrapper schemas that cause duplicates
      if (schema.response) {
        Object.keys(schema.response).forEach(statusCode => {
          const responseSchema = schema.response[statusCode];
          if (responseSchema && responseSchema.$id) {
            // Remove auto-generated IDs that cause duplicates
            delete responseSchema.$id;
          }
        });
      }
    }
    return { schema, url };
  },
  // Configure reference handling to avoid duplicate schemas
  refResolver: {
    buildLocalReference: (json, baseUri, fragment, i) => {
      // Use consistent naming for schemas
      if (json.$id && typeof json.$id === 'string') {
        return json.$id;
      }
      // Generate clean names for inline schemas
      if (json.type === 'object' && json.properties && typeof json.properties === 'object') {
        const props = json.properties as any;
        if (props.success && props.error) {
          return 'ErrorResponse';
        }
        if (props.success && props.data) {
          return 'SuccessResponse';
        }
        if (props.page && props.limit && props.total) {
          return 'Pagination';
        }
      }
      return `def-${i}`;
    }
  },
};

export const swaggerUIConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  // Using default Swagger UI configuration - no custom styling
};