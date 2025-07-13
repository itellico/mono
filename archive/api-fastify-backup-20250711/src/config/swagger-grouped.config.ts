import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

// Swagger configuration with visual grouping
export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'itellico Mono API',
      description: `
# itellico Mono API Documentation

Complete API reference for the itellico Mono multi-tenant marketplace system.

## 4-Tier Architecture

Our API is organized around four hierarchical levels:

1. **🌍 Platform** - Global system management (super admins only)
2. **🏢 Tenant** - Tenant-wide administration and configuration
3. **🏪 Account** - Account-level business features and management
4. **👤 User** - Individual user features and interactions

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
\`Authorization: Bearer <your-jwt-token>\`

## Access Levels
Each endpoint is tagged with its minimum required access level:
- 🌐 **Public** - No authentication required
- 👤 **User** - Any authenticated user
- 🏪 **Account** - Account owner or admin permissions
- 🏢 **Tenant** - Tenant admin permissions  
- 🌍 **Platform** - Super admin permissions

## Rate Limiting
API requests are rate-limited. Check response headers for limit information.
      `.trim(),
      version: '1.0.0',
      contact: {
        name: 'itellico Mono Support',
        email: 'support@monoplatform.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.monoplatform.com',
        description: 'Production server',
      },
    ],
    tags: [
      // Option 1: Use visual separators in tag names
      { name: '━━━ 🌐 PUBLIC ACCESS ━━━', description: 'No authentication required' },
      { name: '├─ authentication', description: 'Login, logout, token management' },
      { name: '└─ health', description: 'System health and status checks' },
      
      { name: '━━━ 👤 USER TIER ━━━', description: 'Individual user features' },
      { name: '├─ user:profile', description: 'Personal profile management' },
      { name: '├─ user:settings', description: 'Personal preferences and settings' },
      { name: '├─ user:messaging', description: 'Direct messaging and conversations' },
      { name: '├─ user:notifications', description: 'User notifications and alerts' },
      { name: '├─ user:categories', description: 'Browse and manage categories' },
      { name: '├─ user:changes', description: 'Change tracking and history' },
      { name: '├─ user:media', description: 'File upload and media management' },
      { name: '├─ user:search', description: 'Search and discovery features' },
      { name: '├─ user:tags', description: 'Content tagging system' },
      { name: '├─ user:templates', description: 'Content templates' },
      { name: '├─ user:gigs', description: 'Gig offerings and bookings' },
      { name: '└─ user:jobs', description: 'Job postings and applications' },
      
      { name: '━━━ 🏪 ACCOUNT TIER ━━━', description: 'Business account features' },
      { name: '├─ account:analytics', description: 'Account performance metrics' },
      { name: '├─ account:billing', description: 'Subscriptions and payments' },
      { name: '├─ account:settings', description: 'Account configuration' },
      { name: '├─ account:users', description: 'Manage users within account' },
      { name: '├─ account:ai-llm', description: 'AI and language model features' },
      { name: '├─ account:forms', description: 'Dynamic form management' },
      { name: '├─ account:integrations', description: 'Third-party integrations' },
      { name: '├─ account:templates', description: 'Industry and business templates' },
      { name: '├─ account:webhooks', description: 'Webhook configuration' },
      { name: '└─ account:workflows', description: 'Workflow automation' },
      
      { name: '━━━ 🏢 TENANT TIER ━━━', description: 'Tenant administration' },
      { name: '├─ tenant:analytics', description: 'Tenant-wide analytics' },
      { name: '├─ tenant:audit', description: 'Audit trails and logging' },
      { name: '├─ tenant:moderation', description: 'Content oversight and moderation' },
      { name: '├─ tenant:settings', description: 'Tenant-wide configuration' },
      { name: '├─ tenant:users', description: 'Cross-account user management' },
      { name: '├─ tenant:model-schemas', description: 'Data model configuration' },
      { name: '└─ tenant:option-sets', description: 'Predefined option management' },
      
      { name: '━━━ 🌍 PLATFORM TIER ━━━', description: 'Super admin only' },
      { name: '├─ platform:emergency', description: 'Emergency access and recovery' },
      { name: '├─ platform:monitoring', description: 'System health and metrics' },
      { name: '├─ platform:settings', description: 'Global system settings' },
      { name: '└─ platform:tenants', description: 'Create and manage tenants' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/v1/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'ValidationError' },
            message: { type: 'string', example: 'Invalid input data' },
            details: { type: 'object' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};

export const swaggerUIConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'none',
    deepLinking: true,
    persistAuthorization: true,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  staticCSP: false,
  transformStaticCSP: (header) => ({
    ...header,
    'style-src': "'self' 'unsafe-inline' https:",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https:",
    'img-src': "'self' data: https:",
  }),
};