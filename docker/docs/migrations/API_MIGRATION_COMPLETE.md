# itellico Mono API Migration to Fastify - Complete ✅

## Overview

The itellico Mono API has been successfully migrated from Next.js API routes to a standalone Fastify server. This migration provides better performance, cleaner architecture, and proper separation of concerns between the API and frontend.

## Architecture

```
mono-stable-app/
├── apps/
│   └── api/                 # Fastify API Server (Port 3001)
│       ├── src/
│       │   ├── app.ts       # Main Fastify application
│       │   ├── server.ts    # Server entry point
│       │   ├── routes/      # All API routes
│       │   └── plugins/     # Fastify plugins (auth, permissions, etc.)
│       └── package.json
│
├── src/                     # Next.js Frontend (Port 3000)
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── hooks/              # React hooks (updated to use API client)
│   └── lib/
│       └── api-client.ts   # Centralized API client
│
└── package.json            # Root package.json
```

## Key Features Implemented

### 1. **Authentication & Authorization**
- JWT-based authentication with access/refresh tokens
- Advanced RBAC system with pattern-based permissions
- Permission inheritance and caching
- Multi-tenant isolation

### 2. **Core API Routes Migrated**
- ✅ User Management (`/api/v1/admin/users`)
- ✅ Tenant Management (`/api/v1/admin/tenants`)
- ✅ Categories & Tags (`/api/v1/admin/categories`)
- ✅ Model Schemas (`/api/v1/admin/model-schemas`)
- ✅ Option Sets (`/api/v1/admin/option-sets`)
- ✅ Permissions (`/api/v1/admin/permissions`)
- ✅ Settings (`/api/v1/admin/settings`)
- ✅ Media Management (`/api/v1/media`)
- ✅ Workflows (`/api/v1/workflows`)
- ✅ Subscriptions (`/api/v1/admin/subscriptions`)
- ✅ Translations (`/api/v1/admin/translations`)
- ✅ Integrations (`/api/v1/admin/integrations`)
- ✅ Queue Management (`/api/v1/admin/queue`)
- ✅ LLM Integration (`/api/v1/admin/llm`)
- ✅ Templates (`/api/v1/admin/templates`)
- ✅ Audit Logs (`/api/v1/admin/audit`)

### 3. **Advanced Features**
- Bulk operations for categories, model schemas, and option sets
- Import/Export functionality with CSV/JSON support
- Webhook processing with HMAC signature validation
- Real-time statistics and analytics
- AI-powered auto-translation
- String extraction from code for i18n

### 4. **Developer Experience**
- TypeBox for runtime type validation
- Automatic OpenAPI documentation generation
- Swagger UI at `/documentation`
- Comprehensive error handling
- Request/Response logging

## Running the Platform

### Development Mode

**Recommended: Use separate terminals for better log monitoring**

```bash
# Terminal 1: Start Fastify API server (port 3001)
./start-api.sh

# Terminal 2: Start Next.js frontend (port 3000)
./start-frontend.sh
```

**Alternative options:**

Use the legacy script to run both in one terminal:
```bash
./start-dev.sh
```

Or run services manually:

**API Server:**
```bash
cd apps/api
npm run dev
# Runs on http://localhost:3001
```

**Frontend:**
```bash
npm run dev
# Runs on http://localhost:3000
```

### Testing

Run the API test suite:
```bash
cd apps/api
tsx test-api-endpoints.ts
```

## API Documentation

- **Swagger UI**: http://localhost:3001/documentation
- **OpenAPI JSON**: http://localhost:3001/documentation/json

## Environment Variables

### API Server (`apps/api/.env`)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_URL=redis://localhost:6379
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Key Changes for Developers

1. **API Client Usage**: All frontend data fetching now uses the centralized `apiClient` instead of direct fetch calls
2. **New Endpoints**: All API endpoints now start with `/api/v1/` instead of `/api/`
3. **Authentication**: Frontend still uses NextAuth for session management, but API calls use JWT tokens
4. **Permissions**: Advanced RBAC system with pattern matching (e.g., `users:*` matches all user permissions)
5. **React Hooks**: All admin hooks updated to use the API client

## Migration Highlights

### Before (Next.js API Routes)
```typescript
// pages/api/admin/users.ts
export default async function handler(req, res) {
  const users = await db.user.findMany();
  res.json(users);
}
```

### After (Fastify)
```typescript
// apps/api/src/routes/v1/admin/users/index.ts
fastify.get('/', {
  preHandler: [fastify.authenticate, fastify.requirePermission('users:read')],
  schema: {
    querystring: UserListQuerySchema,
    response: { 200: UserListResponseSchema }
  }
}, async (request, reply) => {
  const users = await usersService.listUsers(request.query);
  return { success: true, data: users };
});
```

## Benefits of Migration

1. **Performance**: Fastify is significantly faster than Next.js API routes
2. **Scalability**: API can be deployed and scaled independently
3. **Type Safety**: Runtime validation with TypeBox ensures data integrity
4. **Documentation**: Automatic OpenAPI generation keeps docs in sync
5. **Testing**: Easier to test API endpoints in isolation
6. **Security**: Built-in security features and proper CORS handling

## Next Steps

1. **Production Deployment**: Set up PM2 or Docker for production
2. **API Versioning**: Consider implementing API versioning strategy
3. **Rate Limiting**: Add rate limiting for production
4. **Monitoring**: Set up APM and logging aggregation
5. **Caching**: Implement Redis caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in `.env`

3. **Redis Connection Issues**
   - Start Redis: `redis-server`
   - Check REDIS_URL in `.env`

4. **Authentication Errors**
   - Clear browser cookies/localStorage
   - Check JWT_SECRET matches between services

## Support

For issues or questions:
- Check API logs: `apps/api/logs/`
- View API documentation: http://localhost:3001/documentation
- Debug with test script: `tsx test-api-endpoints.ts`