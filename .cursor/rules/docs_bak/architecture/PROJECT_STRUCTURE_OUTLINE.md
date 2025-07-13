# itellico Mono: New Project Structure Outline

## Current Structure → New Structure

### Option 1: Monorepo Approach (Recommended)
```
mono-platform/
├── apps/
│   ├── api/                    # Fastify Backend
│   │   ├── src/
│   │   │   ├── server.ts       # Main Fastify server
│   │   │   ├── app.ts          # Fastify app configuration
│   │   │   ├── plugins/        # Fastify plugins
│   │   │   │   ├── auth.ts     # JWT authentication
│   │   │   │   ├── prisma.ts   # Database connection
│   │   │   │   ├── redis.ts    # Redis caching
│   │   │   │   ├── cors.ts     # CORS configuration
│   │   │   │   ├── swagger.ts  # API documentation
│   │   │   │   └── multipart.ts # File upload handling
│   │   │   ├── hooks/          # Lifecycle hooks
│   │   │   │   ├── onRequest.ts    # Auth, rate limiting
│   │   │   │   ├── preHandler.ts   # Validation, tenant context
│   │   │   │   ├── onSend.ts       # Response transformation
│   │   │   │   └── onResponse.ts   # Audit logging
│   │   │   ├── routes/         # API endpoints
│   │   │   │   ├── v1/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── admin/
│   │   │   │   │   ├── tenants/
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── media/
│   │   │   │   │   └── public/
│   │   │   │   └── health/
│   │   │   ├── services/       # Business logic layer
│   │   │   │   ├── auth/
│   │   │   │   ├── tenant/
│   │   │   │   ├── user/
│   │   │   │   ├── subscription/
│   │   │   │   └── media/
│   │   │   ├── schemas/        # Request/Response schemas
│   │   │   │   ├── auth.schema.ts
│   │   │   │   ├── tenant.schema.ts
│   │   │   │   └── common.schema.ts
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── types/          # TypeScript types
│   │   │   └── workers/        # Background jobs
│   │   ├── prisma/            # Database (moved from root)
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   ├── tests/             # API tests
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── web/                   # Frontend (Next.js or Vite)
│       ├── src/
│       │   ├── app/           # If keeping Next.js
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   │   ├── api-client.ts  # Fastify API client
│       │   │   └── query-client.ts # React Query setup
│       │   ├── stores/
│       │   └── styles/
│       ├── public/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                  # Shared packages
│   ├── shared/               # Shared types and utils
│   │   ├── src/
│   │   │   ├── types/       # Shared TypeScript types
│   │   │   ├── constants/   # Shared constants
│   │   │   └── utils/       # Shared utilities
│   │   └── package.json
│   │
│   ├── email-templates/      # Email templates package
│   │   ├── src/
│   │   └── package.json
│   │
│   └── ui/                  # Shared UI components (if needed)
│       ├── src/
│       └── package.json
│
├── docker/                   # Docker configurations
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── docker-compose.yml
│
├── scripts/                  # Build and deployment scripts
│   ├── migrate-api.ts       # Migration scripts
│   └── deploy.sh
│
├── .github/                 # GitHub Actions
├── turbo.json              # Turborepo config (if using)
├── pnpm-workspace.yaml     # PNPM workspace config
├── package.json            # Root package.json
└── README.md
```

### Option 2: Separate Repositories
```
# Backend Repository: mono-platform-api
mono-platform-api/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── plugins/
│   ├── routes/
│   ├── services/
│   ├── middleware/        # Fastify hooks
│   ├── validators/        # JSON Schema validators
│   └── types/
├── prisma/
├── tests/
├── Dockerfile
└── package.json

# Frontend Repository: mono-platform-web
mono-platform-web/
├── src/
│   ├── pages/ or app/    # Depending on framework
│   ├── components/
│   ├── api/              # API client layer
│   ├── hooks/
│   └── stores/
├── public/
└── package.json
```

## Key Migration Decisions

### 1. Database Layer
- **Keep**: Prisma schema and migrations
- **Move**: From `/prisma` to `/apps/api/prisma`
- **Share**: Types generated from Prisma to shared package

### 2. Authentication
- **Replace**: NextAuth → Fastify JWT + Refresh Tokens
- **Keep**: OAuth provider configurations
- **Add**: API key authentication for B2B

### 3. File Structure Mapping

#### Current → New Location
```
/src/app/api/v1/admin/* → /apps/api/src/routes/v1/admin/*
/src/lib/services/*     → /apps/api/src/services/*
/src/lib/schemas/*      → /apps/api/src/schemas/* (convert to JSON Schema)
/src/lib/middleware/*   → /apps/api/src/hooks/*
/src/lib/db.ts         → /apps/api/src/plugins/prisma.ts
/src/lib/redis.ts      → /apps/api/src/plugins/redis.ts
```

### 4. Shared Code Strategy
```
packages/shared/src/
├── types/
│   ├── models.ts      # Prisma generated types
│   ├── api.ts         # API request/response types
│   └── common.ts      # Shared enums, constants
├── constants/
│   ├── permissions.ts
│   ├── roles.ts
│   └── limits.ts
└── utils/
    ├── validation.ts
    └── formatting.ts
```

## Frontend Architecture Options

### Option A: Keep Next.js (SSR/SSG Benefits)
- Remove all `/api` routes
- Use for marketing pages, SEO-critical content
- Server components fetch from Fastify API
- Keep image optimization benefits

### Option B: Vite + React (Pure SPA)
- Faster development builds
- Better HMR experience
- Smaller bundle sizes
- Lose SSR (can add later with Vike)

### Option C: Remix (Modern Full-Stack)
- Better routing than Next.js
- Native form handling
- Progressive enhancement
- Can call Fastify API from loaders

## Development Workflow

### Local Development
```bash
# Terminal 1: Database
docker-compose up postgres redis

# Terminal 2: API
cd apps/api
pnpm dev

# Terminal 3: Frontend
cd apps/web
pnpm dev
```

### Environment Configuration
```
# apps/api/.env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
PORT=3001

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Benefits of This Structure

1. **Clear Separation**: Backend and frontend are clearly separated
2. **Independent Scaling**: Can scale API and web separately
3. **Team Collaboration**: Frontend and backend teams work independently
4. **Technology Flexibility**: Can switch frontend framework without touching API
5. **Reusable Packages**: Shared code in packages
6. **Better Testing**: Easier to test in isolation
7. **Deployment Options**: Can deploy to different services

## Migration Priority

1. **Phase 1**: Set up Fastify API structure
2. **Phase 2**: Migrate auth system
3. **Phase 3**: Move critical API endpoints
4. **Phase 4**: Update frontend to use new API
5. **Phase 5**: Migrate remaining endpoints
6. **Phase 6**: Optimize and clean up

## Questions to Answer

1. **Monorepo or Separate Repos?**
   - Monorepo easier for shared types
   - Separate repos better for team autonomy

2. **Frontend Framework?**
   - Keep Next.js for SSR needs?
   - Switch to Vite for simplicity?
   - Try Remix for modern approach?

3. **Deployment Strategy?**
   - Vercel for frontend?
   - AWS/GCP for Fastify API?
   - Docker + Kubernetes?

4. **API Versioning?**
   - Path-based: `/v1/`, `/v2/`
   - Header-based: `API-Version: 2`
   - Query param: `?version=2`

5. **Testing Strategy?**
   - Unit tests for services
   - Integration tests for routes
   - E2E tests for critical flows