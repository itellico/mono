---
title: API Design
sidebar_label: API Design
---

# API Design Architecture

The itellico Mono API follows a strict 5-tier hierarchical architecture that provides clear separation of concerns, consistent patterns, and scalable design principles.

## Overview

Our API design philosophy:

- **Hierarchical Structure**: 5-tier access model
- **RESTful Principles**: Standard HTTP methods
- **Consistent Patterns**: Predictable endpoints
- **Type Safety**: TypeScript and validation
- **Performance First**: Optimized for speed

## 5-Tier API Architecture

### Hierarchical Access Model

```
Public → User → Account → Tenant → Platform
```

Each tier provides progressively more access and control:

### 🌐 Public Tier (`/api/v2/public/*`)

**No authentication required**

```typescript
interface PublicEndpoints {
  auth: {
    POST: '/api/v2/public/auth/login';
    POST: '/api/v2/public/auth/register';
    POST: '/api/v2/public/auth/forgot-password';
    POST: '/api/v2/public/auth/reset-password';
  };
  health: {
    GET: '/api/v2/public/health';
    GET: '/api/v2/public/health/detailed';
  };
  discovery: {
    GET: '/api/v2/public/marketplaces';
    GET: '/api/v2/public/categories';
    GET: '/api/v2/public/search';
  };
}
```

### 👤 User Tier (`/api/v2/user/*`)

**Individual user operations**

```typescript
interface UserEndpoints {
  profile: {
    GET: '/api/v2/user/profile';
    PUT: '/api/v2/user/profile';
    DELETE: '/api/v2/user/profile';
  };
  content: {
    GET: '/api/v2/user/content';
    POST: '/api/v2/user/content';
    PUT: '/api/v2/user/content/\{id\}';
    DELETE: '/api/v2/user/content/\{id\}';
  };
  marketplace: {
    GET: '/api/v2/user/marketplace/listings';
    POST: '/api/v2/user/marketplace/applications';
    GET: '/api/v2/user/marketplace/bookings';
  };
}
```

### 🏢 Account Tier (`/api/v2/account/*`)

**Business unit management**

```typescript
interface AccountEndpoints {
  users: {
    GET: '/api/v2/account/users';
    POST: '/api/v2/account/users';
    PUT: '/api/v2/account/users/\{id\}';
    DELETE: '/api/v2/account/users/\{id\}';
  };
  billing: {
    GET: '/api/v2/account/billing/subscription';
    POST: '/api/v2/account/billing/payment-method';
    GET: '/api/v2/account/billing/invoices';
  };
  analytics: {
    GET: '/api/v2/account/analytics/overview';
    GET: '/api/v2/account/analytics/users';
    GET: '/api/v2/account/analytics/revenue';
  };
}
```

### 🏛️ Tenant Tier (`/api/v2/tenant/*`)

**Tenant administration**

```typescript
interface TenantEndpoints {
  accounts: {
    GET: '/api/v2/tenant/accounts';
    POST: '/api/v2/tenant/accounts';
    PUT: '/api/v2/tenant/accounts/\{id\}';
    DELETE: '/api/v2/tenant/accounts/\{id\}';
  };
  permissions: {
    GET: '/api/v2/tenant/permissions/roles';
    POST: '/api/v2/tenant/permissions/roles';
    PUT: '/api/v2/tenant/permissions/assign';
  };
  configuration: {
    GET: '/api/v2/tenant/configuration';
    PUT: '/api/v2/tenant/configuration';
    POST: '/api/v2/tenant/configuration/features';
  };
}
```

### 🌍 Platform Tier (`/api/v2/platform/*`)

**System-wide operations**

```typescript
interface PlatformEndpoints {
  tenants: {
    GET: '/api/v2/platform/tenants';
    POST: '/api/v2/platform/tenants';
    PUT: '/api/v2/platform/tenants/\{id\}';
    DELETE: '/api/v2/platform/tenants/\{id\}';
  };
  operations: {
    GET: '/api/v2/platform/operations/status';
    POST: '/api/v2/platform/operations/maintenance';
    GET: '/api/v2/platform/operations/metrics';
  };
}
```

## API Standards

### URL Structure

All endpoints follow this pattern:
```
/api/v2/{tier}/{resource}/{action}
```

**Examples:**
- `/api/v2/user/profile` - Get user's own profile
- `/api/v2/account/users` - List account users
- `/api/v2/tenant/permissions/roles` - Manage tenant roles

### HTTP Methods

Standard RESTful methods:

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve resources | GET /api/v2/user/profile |
| POST | Create new resource | POST /api/v2/user/content |
| PUT | Update entire resource | PUT /api/v2/user/profile |
| PATCH | Partial update | PATCH /api/v2/user/settings |
| DELETE | Remove resource | DELETE /api/v2/user/content/\{id\} |

### Request/Response Format

#### Request Headers
```typescript
interface RequestHeaders {
  'Content-Type': 'application/json';
  'Authorization': 'Bearer {token}';
  'X-Request-ID': string; // Optional tracing
  'X-Tenant-ID': number; // For platform operations
}
```

#### Standard Response
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Paginated Response
```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### Error Handling

Consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // UPPERCASE_SNAKE_CASE
    message: string; // Human-readable
    details?: {
      field?: string;
      reason?: string;
      suggestion?: string;
    };
  };
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

## Schema Validation

### Fastify Schema Integration

All endpoints use Fastify's native schema validation with TypeBox:

```typescript
import { Type } from '@sinclair/typebox';

const UserProfileSchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  bio: Type.Optional(Type.String({ maxLength: 500 })),
  location: Type.Optional(Type.String()),
  preferences: Type.Object({
    theme: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
    notifications: Type.Boolean(),
  }),
});

// Usage in Fastify route
fastify.get('/profile', {
  schema: {
    response: {
      200: UserProfileSchema
    }
  },
  handler: async (request, reply) => {
    // Fastify automatically validates response against schema
  }
});
```

### Fastify Validation Rules

- **Request Validation**: Body, query, and params schemas
- **Response Validation**: Automatic response type checking
- **Type Coercion**: Automatic type conversion where safe
- **Custom Validators**: Fastify-compatible validation plugins
- **Error Formatting**: Consistent validation error responses

```typescript
// Complete endpoint with validation
fastify.post('/users', {
  schema: {
    body: Type.Object({
      name: Type.String({ minLength: 2 }),
      email: Type.String({ format: 'email' })
    }),
    querystring: Type.Object({
      includeProfile: Type.Optional(Type.Boolean())
    }),
    response: {
      201: UserResponseSchema,
      400: ErrorSchema
    }
  },
  preHandler: [fastify.authenticate],
  handler: async (request, reply) => {
    // Fastify validates body and query automatically
    return reply.code(201).send({ success: true, data: user });
  }
});

## Authentication & Authorization

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string; // User ID
  tenantId: number;
  accountId?: number;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}
```

### Permission Format

Permissions follow the pattern: `{tier}.{resource}.{action}`

```typescript
const permissions = [
  'user.profile.read',
  'user.profile.write',
  'account.users.create',
  'account.users.delete',
  'tenant.permissions.manage',
  'platform.tenants.create',
];
```

## API Documentation

### Fastify OpenAPI/Swagger Integration

Using `@fastify/swagger` and `@fastify/swagger-ui` for automatic documentation:

```typescript
// Plugin registration
await fastify.register(require('@fastify/swagger'), {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'itellico Mono API',
      description: 'Multi-tenant SaaS platform API',
      version: '2.0.0'
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.itellico.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
});

// Route with complete OpenAPI documentation
fastify.get('/profile', {
  schema: {
    tags: ['user.profile'],
    summary: 'Get user profile',
    description: 'Retrieve the authenticated user\'s profile information',
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'User profile retrieved successfully',
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: UserProfileSchema
        }
      },
      401: ErrorSchema,
      500: ErrorSchema,
    },
  },
  preHandler: [fastify.authenticate],
  handler: async (request, reply) => {
    const user = await getUserProfile(request.user.id);
    return reply.send({ success: true, data: user });
  },
});
```

### Tag Convention

Tags use dot notation: `{tier}.{resource}`

| Tag | Display in Swagger |
|-----|-------------------|
| `public.auth` | 🔓 Authentication |
| `user.profile` | 👤 User Profile |
| `account.users` | 👥 Team Management |
| `tenant.permissions` | 🔐 Access Control |
| `platform.tenants` | 🌐 Platform Tenants |

## Rate Limiting

### Fastify Rate Limiting

Using `@fastify/rate-limit` plugin with tier-based configurations:

```typescript
// Rate limiting plugin configuration
await fastify.register(require('@fastify/rate-limit'), {
  global: false, // Enable per-route configuration
  keyGenerator: (request) => {
    return request.user?.id || request.ip;
  },
  errorResponseBuilder: (request, context) => {
    return {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`
      }
    };
  }
});

// Tier-based rate limits
const rateLimits = {
  public: {
    timeWindow: '15 minutes',
    max: 100
  },
  user: {
    timeWindow: '15 minutes', 
    max: 1000
  },
  account: {
    timeWindow: '15 minutes',
    max: 5000
  },
  tenant: {
    timeWindow: '15 minutes',
    max: 10000
  },
  platform: {
    timeWindow: '15 minutes',
    max: 50000
  }
};

// Apply to routes
fastify.get('/api/v2/public/health', {
  config: {
    rateLimit: rateLimits.public
  },
  handler: async (request, reply) => {
    return { status: 'healthy' };
  }
});
```

### Rate Limit Headers

```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string; // When rate limited
}
```

## Versioning

### Fastify URL Versioning

- Current version: `/api/v2` 
- Previous version: `/api/v1` (deprecated)
- Future versions: `/api/v3`
- Deprecation notices in headers

```typescript
// Version-specific route registration
fastify.register(async function (fastify) {
  await fastify.register(v2Routes, { prefix: '/api/v2' });
  await fastify.register(v1Routes, { prefix: '/api/v1' }); // Deprecated
}, { prefix: '' });

// Deprecation middleware for v1
fastify.addHook('onRequest', async (request, reply) => {
  if (request.url.startsWith('/api/v1')) {
    reply.header('Deprecation', 'Sun, 01 Jan 2025 00:00:00 GMT');
    reply.header('Sunset', 'Mon, 01 Jun 2025 00:00:00 GMT');
    reply.header('Link', '</docs/migration/v1-to-v2>; rel="deprecation"');
  }
});

### Version Migration

```typescript
interface VersionHeaders {
  'API-Version': string;
  'Deprecation'?: string; // RFC date
  'Sunset'?: string; // RFC date
  'Link'?: string; // Link to migration guide
}
```

## Performance

### Caching Headers

```typescript
interface CacheHeaders {
  'Cache-Control': string;
  'ETag'?: string;
  'Last-Modified'?: string;
  'Vary'?: string;
}
```

### Fastify Compression

Using `@fastify/compress` plugin:

```typescript
// Compression plugin
await fastify.register(require('@fastify/compress'), {
  global: true,
  threshold: 1024, // Compress responses > 1KB
  encodings: ['gzip', 'deflate', 'br'], // Brotli, gzip, deflate
  customTypes: /^(application\/json|text\/.*)$/
});

// Automatic compression based on Accept-Encoding header
// No additional code needed in route handlers

## Fastify Best Practices

1. **Plugin Architecture**: Encapsulate functionality in plugins
2. **Schema-First**: Define TypeBox schemas for all endpoints
3. **Hooks Lifecycle**: Use preHandler, onRequest, onSend hooks appropriately
4. **Error Handling**: Implement consistent error responses with setErrorHandler
5. **Type Safety**: Leverage TypeScript with Fastify's type system
6. **Performance**: Use Fastify's built-in serialization and validation
7. **Testing**: Use Fastify's inject method for route testing
8. **Logging**: Integrate with Fastify's built-in logger (Pino)

### Fastify Plugin Structure

```typescript
// Plugin pattern for modular API design
export default async function userRoutes(fastify: FastifyInstance) {
  // Schema definitions
  const schemas = {
    user: Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String({ format: 'email' })
    }),
    createUser: Type.Object({
      name: Type.String({ minLength: 2 }),
      email: Type.String({ format: 'email' })
    })
  };

  // Middleware
  fastify.addHook('preHandler', fastify.authenticate);

  // Routes
  fastify.get('/profile', {
    schema: {
      response: { 200: schemas.user }
    },
    handler: async (request, reply) => {
      return getUserProfile(request.user.id);
    }
  });

  fastify.post('/users', {
    schema: {
      body: schemas.createUser,
      response: { 201: schemas.user }
    },
    handler: async (request, reply) => {
      const user = await createUser(request.body);
      return reply.code(201).send(user);
    }
  });
}
```

### API Development Guidelines

1. **Consistent Naming**: Use camelCase for JSON
2. **Idempotency**: Support idempotent requests with idempotency keys
3. **Pagination**: Limit default to 20 items, max 100
4. **Filtering**: Use query parameters with schema validation
5. **Sorting**: Support multiple sort fields via query params
6. **Field Selection**: Allow sparse fieldsets with `fields` parameter
7. **Bulk Operations**: Support batch requests with proper error handling
8. **Async Operations**: Return 202 for long tasks with status endpoints

## Related Documentation

- [Security Architecture](/architecture/security)
- [Performance Optimization](/architecture/performance)
- [Data Models](/architecture/data-models)
- [API Reference](/api)