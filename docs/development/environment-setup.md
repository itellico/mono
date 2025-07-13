# Environment Variables Setup

This guide explains the best practices for managing environment variables in the itellico mono repository.

## Overview

The project uses a separation of concerns for environment variables:

- **Frontend (Next.js)**: Uses `.env.local` for local development
- **Backend (Fastify)**: Uses `.env` for local development
- **Shared/Global**: Main `.env` file in the root for services like Kanboard

## File Structure

```
mono/
├── .env                    # Global/shared environment variables
├── .env.example           # Template for global variables
├── .env.docker            # Docker-specific configuration
├── .env.services          # External services configuration
├── apps/
│   ├── web/
│   │   ├── .env.local     # Next.js local environment (git ignored)
│   │   ├── .env.example   # Next.js template
│   │   └── lib/env.ts     # Next.js env validation
│   └── api/
│       ├── .env           # Fastify local environment (git ignored)
│       ├── .env.example   # Fastify template
│       └── src/config/env.ts  # Fastify env validation
```

## Frontend Environment Variables (Next.js)

### Public Variables (Browser-accessible)
Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser:

```env
NEXT_PUBLIC_API_URL=http://192.168.178.94:3001
NEXT_PUBLIC_APP_NAME=itellico
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Server-side Variables
Variables without the prefix are only available server-side:

```env
API_URL_INTERNAL=http://192.168.178.94:3001
SESSION_SECRET=your-secret-key
```

### Setup
1. Copy `apps/web/.env.example` to `apps/web/.env.local`
2. Update values as needed
3. The env validation in `lib/env.ts` will ensure all required variables are set

## Backend Environment Variables (Fastify)

All backend environment variables are server-only and include:

- Database configuration
- Redis settings
- JWT secrets
- Email configuration
- External service credentials

### Setup
1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Update values as needed
3. The env validation in `src/config/env.ts` will ensure all required variables are set

## Security Best Practices

1. **Never commit** `.env.local` or `.env` files
2. **Always use** `.env.example` files as templates
3. **Validate** all environment variables on startup
4. **Use strong secrets** for production (minimum 32 characters)
5. **Separate** client and server variables properly

## Type Safety

Both frontend and backend use Zod schemas for runtime validation:

### Frontend (Next.js)
```typescript
import { env } from '@/lib/env'

// TypeScript knows all available env vars
console.log(env.NEXT_PUBLIC_API_URL)
```

### Backend (Fastify)
```typescript
import { env } from '@/config/env'

// Fully typed environment variables
const port = env.PORT // number
const jwtSecret = env.JWT_SECRET // string
```

## Common Issues

### Variable Not Found
- Ensure the variable is defined in the appropriate `.env` file
- Check that the variable is included in the validation schema
- Restart the development server after changes

### Type Errors
- The validation schemas transform strings to appropriate types
- Check the schema definition if you get unexpected types

### CORS Issues
- Update `CORS_ORIGINS` in the API `.env` file
- Multiple origins should be comma-separated

## Docker Development

When using Docker, environment variables are loaded from:
1. `.env.docker` - Docker-specific overrides
2. `.env.services` - External service configurations
3. `docker-compose.yml` - Container-specific settings

## Production Deployment

For production:
1. Use environment-specific files (`.env.production`)
2. Set variables through your deployment platform
3. Never store secrets in code or Docker images
4. Use secret management services when available