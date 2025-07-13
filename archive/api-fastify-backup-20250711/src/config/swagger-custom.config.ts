import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

// Custom CSS to add visual hierarchy to tags
const customCss = `
  /* Style tier headers */
  .opblock-tag[data-tag^="🌐 Public"],
  .opblock-tag[data-tag^="👤 User "],
  .opblock-tag[data-tag^="🏪 Account "],
  .opblock-tag[data-tag^="🏢 Tenant "],
  .opblock-tag[data-tag^="🌍 Platform "] {
    background: #f0f0f0;
    font-weight: bold;
    font-size: 16px;
    border-left: 4px solid #1976d2;
  }
  
  /* Indent feature tags */
  .opblock-tag[data-tag*=":"] {
    margin-left: 20px !important;
    font-size: 14px;
  }
  
  /* Color code by tier */
  .opblock-tag[data-tag^="public:"] { border-left: 4px solid #4caf50; }
  .opblock-tag[data-tag^="user:"] { border-left: 4px solid #2196f3; }
  .opblock-tag[data-tag^="account:"] { border-left: 4px solid #ff9800; }
  .opblock-tag[data-tag^="tenant:"] { border-left: 4px solid #9c27b0; }
  .opblock-tag[data-tag^="platform:"] { border-left: 4px solid #f44336; }
`;

export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'itellico Mono API',
      description: `
# itellico Mono API Documentation

Complete API reference for the itellico Mono multi-tenant marketplace system.

## 4-Tier Architecture

Our API is organized around four hierarchical levels:

### 🌐 Public Access
No authentication required
- **authentication** - Login, logout, token management
- **health** - System health and status checks

### 👤 User Tier
Individual user features
- **profile** - Personal profile management
- **settings** - Personal preferences
- **messaging** - Direct messaging and conversations
- **notifications** - Notifications and alerts
- **categories** - Browse and manage categories
- **changes** - Change tracking and history
- **media** - File upload and media
- **search** - Search and discovery
- **tags** - Content tagging
- **templates** - Content templates
- **gigs** - Gig offerings and bookings
- **jobs** - Job postings and applications

### 🏪 Account Tier
Business account features
- **analytics** - Account performance metrics
- **billing** - Subscriptions and payments
- **settings** - Account configuration
- **users** - Manage users within account
- **ai-llm** - AI and language models
- **forms** - Dynamic form management
- **integrations** - Third-party integrations
- **webhooks** - Webhook configuration
- **workflows** - Workflow automation

### 🏢 Tenant Tier
Tenant administration
- **analytics** - Tenant-wide analytics
- **audit** - Audit trails and logging
- **moderation** - Content oversight
- **settings** - Tenant configuration
- **users** - Cross-account user management
- **model-schemas** - Data model configuration
- **option-sets** - Predefined option management

### 🌍 Platform Tier
Super admin only
- **emergency** - Emergency access and recovery
- **monitoring** - System health and metrics
- **settings** - Global system settings
- **tenants** - Create and manage tenants

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
\`Authorization: Bearer <your-jwt-token>\`

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
      // Tier headers (will be styled differently via CSS)
      { name: '🌐 Public Access', description: 'No authentication required' },
      { name: 'public:authentication', description: 'Login, logout, token management' },
      { name: 'public:health', description: 'System health and status checks' },
      
      { name: '👤 User Tier', description: 'Individual user features' },
      { name: 'user:profile', description: 'Personal profile management' },
      { name: 'user:settings', description: 'Personal preferences and settings' },
      { name: 'user:messaging', description: 'Direct messaging and conversations' },
      { name: 'user:notifications', description: 'User notifications and alerts' },
      { name: 'user:categories', description: 'Browse and manage categories' },
      { name: 'user:changes', description: 'Change tracking and history' },
      { name: 'user:media', description: 'File upload and media management' },
      { name: 'user:search', description: 'Search and discovery features' },
      { name: 'user:tags', description: 'Content tagging system' },
      { name: 'user:templates', description: 'Content templates' },
      { name: 'user:gigs', description: 'Gig offerings and bookings' },
      { name: 'user:jobs', description: 'Job postings and applications' },
      
      { name: '🏪 Account Tier', description: 'Business account features' },
      { name: 'account:analytics', description: 'Account performance metrics' },
      { name: 'account:billing', description: 'Subscriptions and payments' },
      { name: 'account:settings', description: 'Account configuration' },
      { name: 'account:users', description: 'Manage users within account' },
      { name: 'account:ai-llm', description: 'AI and language model features' },
      { name: 'account:forms', description: 'Dynamic form management' },
      { name: 'account:integrations', description: 'Third-party integrations' },
      { name: 'account:templates', description: 'Industry and business templates' },
      { name: 'account:webhooks', description: 'Webhook configuration' },
      { name: 'account:workflows', description: 'Workflow automation' },
      
      { name: '🏢 Tenant Tier', description: 'Tenant administration' },
      { name: 'tenant:analytics', description: 'Tenant-wide analytics' },
      { name: 'tenant:audit', description: 'Audit trails and logging' },
      { name: 'tenant:moderation', description: 'Content oversight and moderation' },
      { name: 'tenant:settings', description: 'Tenant-wide configuration' },
      { name: 'tenant:users', description: 'Cross-account user management' },
      { name: 'tenant:model-schemas', description: 'Data model configuration' },
      { name: 'tenant:option-sets', description: 'Predefined option management' },
      
      { name: '🌍 Platform Tier', description: 'Super admin only' },
      { name: 'platform:emergency', description: 'Emergency access and recovery' },
      { name: 'platform:monitoring', description: 'System health and metrics' },
      { name: 'platform:settings', description: 'Global system settings' },
      { name: 'platform:tenants', description: 'Create and manage tenants' },
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
  // Inject custom CSS
  customCss,
};