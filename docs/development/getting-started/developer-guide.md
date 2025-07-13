---
title: DEVELOPER GUIDE
---
# 🚀 itellico Mono - Complete Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Database Design](#database-design)
4. [5-Tier Permission System](#5-tier-permission-system)
5. [Subscription System](#subscription-system)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)
10. [Best Practices](#best-practices)

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: Next.js 15.3.4, React 19, TypeScript
- **API Server**: Fastify 4.x (separate from Next.js)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+
- **Package Manager**: pnpm (monorepo with Turborepo)
- **Authentication**: JWT with HTTP-only cookies
- **File Storage**: S3-compatible (AWS S3, Cloudflare R2)
- **Email**: MJML + Nunjucks templates
- **Monitoring**: Prometheus + Grafana

### Monorepo Structure

```
/mono
├── apps/
│   ├── web/          # Next.js frontend (port 3000)

│   └── api/          # Fastify API server (port 3001)

├── packages/
│   ├── database/     # Prisma schema and migrations

│   ├── shared/       # Shared types and utilities

│   └── ui/          # Shared UI components

├── data/
│   └── seed/        # JSON seed data files

├── docs/            # Documentation

└── scripts/         # Build and deployment scripts

```

## 🛠️ Development Setup

### Prerequisites

```bash
# Required software
- Node.js 20+
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- pnpm 8+
- Docker & Docker Compose (optional but recommended)
```

### Initial Setup

```bash

# 1. Clone repository

git clone https://github.com/itellico/mono.git
cd mono

# 2. Install dependencies

pnpm install

# 3. Setup environment variables

cp .env.example .env

# Edit .env with your database credentials

# 4. Setup database

pnpm prisma generate
pnpm prisma migrate dev

# 5. Seed initial data

pnpm run seed

# 6. Start development servers

# Option 1: Using Docker (recommended - includes all services)
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

# Option 2: Local development
# Terminal 1: API server
cd apps/api && pnpm run dev

# Terminal 2: Frontend
pnpm run dev
```

### Docker Setup with Persistent Storage

The project includes a comprehensive Docker setup with persistent storage for all services:

```bash
# Start all services with persistent volumes
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

# Services available:
- PostgreSQL: localhost:5432 (data persists in docker-data/databases/postgres/)
- Redis: localhost:6379 (data persists in docker-data/cache/redis/)
- Mailpit: localhost:4025 (email testing UI)
- Temporal: localhost:4080 (workflow engine)
- Grafana: localhost:5005 (monitoring, dashboards persist)
- N8N: localhost:5678 (automation, workflows persist)
- Kanboard: localhost:4041 (project management)
```

### Persistent Storage Architecture

The project uses two directories for Docker persistence:

- **`docker/`** - Configuration files (tracked in Git)
  - Service configurations
  - Custom Dockerfiles
  - Initialization scripts
  
- **`docker-data/`** - Runtime data (NOT tracked in Git)
  - Database files
  - Cache data
  - Uploaded files
  - Monitoring dashboards

See [Docker Persistence Architecture](/docs/DOCKER_PERSISTENCE_ARCHITECTURE.md) for detailed information.

### Environment Variables

```env

# Database

DATABASE_URL="postgresql://user:password@localhost:5432/itellico_mono"

# Redis

REDIS_URL="redis://localhost:6379"

# JWT

JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# API

API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# S3 Storage

S3_BUCKET="itellico-media"
S3_REGION="us-east-1"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"

# Email

SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
```

## 💾 Database Design

### Key Design Principles

1. **UUID for all IDs** - Security and scalability
2. **JSONB for flexible data** - Profile data, settings, metadata
3. **Tenant isolation** - All queries filtered by tenantId
4. **Soft deletes** - Audit trail and recovery
5. **Optimized indexes** - Performance at scale

### Core Entity Relationships

```
Platform (1) ─── (N) Tenants
    │
    └─── (N) Industry Templates
    
Tenant (1) ─── (N) Accounts
    │
    ├─── (N) Plans
    ├─── (N) Schemas
    └─── (N) Option Sets
    
Account (1) ─── (N) Users
    │
    └─── (1) Subscription
    
User (1) ─── (N) Profiles
    │
    ├─── (N) Comp Cards
    ├─── (N) Portfolios
    └─── (N) Applications
```

### Migration Strategy

```bash

# Create new migration

pnpm prisma migrate dev --name add_feature_name

# Apply migrations in production

pnpm prisma migrate deploy

# Reset database (development only)

pnpm prisma migrate reset
```

## 🔐 5-Tier Permission System

### Permission Format

```
\{tier\}.\{resource\}.\{action\}
```

### Permission Checking Flow

```typescript
// 1. Middleware checks authentication
fastify.authenticate

// 2. Route checks permission
fastify.requirePermission('tenant.accounts.create')

// 3. Service validates tenant context
async function createAccount(tenantId: string, data: CreateAccountDto) \{
  // Verify tenant access
  if (!await hasTenanTAccess(userId, tenantId)) \{
    throw new ForbiddenError();
  \}
  
  // Check feature limits
  const limits = await getTenantLimits(tenantId);
  const currentCount = await getAccountCount(tenantId);
  
  if (currentCount &gt;= limits.accounts) \{
    throw new LimitExceededError('accounts', currentCount, limits.accounts);
  \}
  
  // Create account
  return db.account.create(\{
    data: \{
      tenantId,
      ...data
    \}
  \});
\}
```

### Wildcard Support

```typescript
// Check exact permission
hasPermission('tenant.accounts.create')

// Check wildcard
hasPermission('tenant.accounts.*')  // All account actions
hasPermission('tenant.*')           // All tenant actions
hasPermission('*')                  // Super admin
```

### Permission Inheritance

```
Platform Admin → Tenant Admin → Account Owner → User
```

## 💳 Subscription System

### Key Concepts

1. **Plans** - Subscription tiers (Starter, Pro, Enterprise)
2. **Features** - Functionality units (comp_cards, analytics)
3. **Permissions** - Binary access control
4. **Limits** - Usage quotas
5. **Feature Sets** - Bundled features

### Implementation Pattern

```typescript
// Check feature access
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> \{
  const subscription = await getUserSubscription(userId);
  const plan = await getPlan(subscription.planId);
  
  // Check if feature is in plan
  return plan.features.includes(feature);
\}

// Check and enforce limits
export async function checkLimit(
  userId: string,
  limitType: string,
  currentUsage: number
): Promise<LimitCheck> \{
  const limits = await getUserLimits(userId);
  const limit = limits[limitType];
  
  if (limit === -1) \{
    return \{ allowed: true, unlimited: true \};
  \}
  
  return \{
    allowed: currentUsage &lt; limit,
    unlimited: false,
    current: currentUsage,
    maximum: limit,
    remaining: Math.max(0, limit - currentUsage)
  \};
\}
```

### Feature Dependencies

```typescript
const featureDependencies = \{
  'commission_tracking': ['team_management'],
  'api_webhooks': ['api_access'],
  'white_label': ['enterprise_plan']
\};

function validateFeatures(features: string[]): ValidationResult \{
  for (const feature of features) \{
    const deps = featureDependencies[feature] || [];
    for (const dep of deps) \{
      if (!features.includes(dep)) \{
        return \{
          valid: false,
          error: `${feature} requires ${dep}`
        \};
      \}
    \}
  \}
  return \{ valid: true \};
\}
```

## 🔧 API Development

### Route Structure

```typescript
// File: apps/api/src/routes/v1/tenant/accounts/index.ts

import type \{ FastifyPluginAsync \} from 'fastify';
import \{ Type \} from '@sinclair/typebox';
import \{ accountService \} from '@/services/account.service';

export const accountRoutes: FastifyPluginAsync = async (fastify) =&gt; \{
  // List accounts
  fastify.get('/', \{
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.accounts.read')
    ],
    schema: \{
      tags: ['tenant.accounts'],
      summary: 'List tenant accounts',
      querystring: Type.Object(\{
        page: Type.Optional(Type.Number(\{ minimum: 1, default: 1 \})),
        limit: Type.Optional(Type.Number(\{ minimum: 1, maximum: 100, default: 20 \})),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.Enum(AccountStatus))
      \}),
      response: \{
        200: Type.Object(\{
          success: Type.Boolean(),
          data: Type.Object(\{
            items: Type.Array(AccountSchema),
            pagination: PaginationSchema
          \})
        \})
      \}
    \},
    async handler(request, reply) \{
      const \{ tenantId \} = request.user;
      const accounts = await accountService.listAccounts(tenantId, request.query);
      
      return \{
        success: true,
        data: accounts
      \};
    \}
  \});
  
  // Create account
  fastify.post('/', \{
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.accounts.create'),
      fastify.checkLimit('accounts')
    ],
    schema: \{
      tags: ['tenant.accounts'],
      summary: 'Create new account',
      body: CreateAccountSchema,
      response: \{
        201: Type.Object(\{
          success: Type.Boolean(),
          data: AccountSchema
        \})
      \}
    \},
    async handler(request, reply) \{
      const \{ tenantId \} = request.user;
      const account = await accountService.createAccount(tenantId, request.body);
      
      reply.status(201);
      return \{
        success: true,
        data: account
      \};
    \}
  \});
\};
```

### Service Layer

```typescript
// File: apps/api/src/services/account.service.ts

import \{ db \} from '@/lib/db';
import \{ redis \} from '@/lib/redis';
import \{ CacheKeys \} from '@/constants/cache';

export class AccountService \{
  async listAccounts(tenantId: string, filters: ListAccountsDto) \{
    // Check cache
    const cacheKey = CacheKeys.tenantAccounts(tenantId, filters);
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Query database
    const where = \{
      tenantId,
      ...(filters.search && \{
        OR: [
          \{ name: \{ contains: filters.search, mode: 'insensitive' \} \},
          \{ email: \{ contains: filters.search, mode: 'insensitive' \} \}
        ]
      \}),
      ...(filters.status && \{ status: filters.status \})
    \};
    
    const [items, total] = await Promise.all([
      db.account.findMany(\{
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: \{ createdAt: 'desc' \}
      \}),
      db.account.count(\{ where \})
    ]);
    
    const result = \{
      items,
      pagination: \{
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      \}
    \};
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));
    
    return result;
  \}
  
  async createAccount(tenantId: string, data: CreateAccountDto) \{
    // Validate limits
    await this.validateAccountLimit(tenantId);
    
    // Create account
    const account = await db.account.create(\{
      data: \{
        tenantId,
        ...data,
        // Create default admin user
        users: \{
          create: \{
            email: data.adminEmail,
            firstName: data.adminFirstName,
            lastName: data.adminLastName,
            passwordHash: await hashPassword(data.adminPassword),
            roles: \{
              create: \{
                roleId: await this.getDefaultAccountOwnerRole()
              \}
            \}
          \}
        \}
      \},
      include: \{
        users: true
      \}
    \});
    
    // Invalidate cache
    await redis.del(CacheKeys.tenantAccounts(tenantId, '*'));
    
    // Emit event
    await this.eventBus.emit('account.created', \{
      tenantId,
      accountId: account.id,
      userId: account.users[0].id
    \});
    
    return account;
  \}
  
  private async validateAccountLimit(tenantId: string) \{
    const limits = await getTenantLimits(tenantId);
    const currentCount = await db.account.count(\{ where: \{ tenantId \} \});
    
    if (limits.accounts !== -1 && currentCount &gt;= limits.accounts) \{
      throw new LimitExceededError('accounts', currentCount, limits.accounts);
    \}
  \}
\}

export const accountService = new AccountService();
```

## 🎨 Frontend Development

### Component Structure

```tsx
// File: apps/web/src/components/accounts/AccountList.tsx

import \{ useQuery \} from '@tanstack/react-query';
import \{ DataTable \} from '@/components/ui/DataTable';
import \{ usePermissions \} from '@/hooks/usePermissions';
import \{ api \} from '@/lib/api';

export function AccountList() \{
  const \{ can \} = usePermissions();
  const [filters, setFilters] = useState<AccountFilters>(\{
    page: 1,
    limit: 20
  \});
  
  const \{ data, isLoading, error \} = useQuery(\{
    queryKey: ['accounts', filters],
    queryFn: () =&gt; api.tenant.accounts.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  \});
  
  const columns: ColumnDef<Account>[] = [
    \{
      accessorKey: 'name',
      header: 'Account Name',
      cell: (\{ row \}) =&gt; (
        &lt;Link href=\{`/accounts/${row.original.id}`\}&gt;
          \{row.original.name\}
        </Link&gt;
      )
    \},
    \{
      accessorKey: 'type',
      header: 'Type',
      cell: (\{ row \}) =&gt; (
        &lt;Badge variant=\{row.original.type\}&gt;
          \{row.original.type\}
        </Badge&gt;
      )
    \},
    \{
      accessorKey: 'status',
      header: 'Status',
      cell: (\{ row \}) =&gt; (
        &lt;StatusBadge status=\{row.original.status\} /&gt;
      )
    \},
    \{
      id: 'actions',
      cell: (\{ row \}) =&gt; (
        <ActionMenu
          items=\{[
            \{
              label: 'Edit',
              icon: 'edit',
              href: `/accounts/${row.original.id}/edit`,
              show: can('tenant.accounts.update')
            \},
            \{
              label: 'Suspend',
              icon: 'pause',
              onClick: () =&gt; handleSuspend(row.original.id),
              show: can('tenant.accounts.suspend')
            \}
          ]\}
        /&gt;
      )
    \}
  ];
  
  return (
    <AdminListLayout
      title="Accounts"
      actions=\{
        can('tenant.accounts.create') && (
          <Button href="/accounts/new"&gt;
            <Plus className="w-4 h-4 mr-2" /&gt;
            New Account
          </Button&gt;
        )
      \}
    &gt;
      &lt;FilterPanel
        filters=\{filters\}
        onChange=\{setFilters\}
        fields=\{[
          \{
            name: 'search',
            type: 'text',
            placeholder: 'Search accounts...'
          \},
          \{
            name: 'status',
            type: 'select',
            options: accountStatuses
          \}
        ]\}
      /&gt;
      
      <DataTable
        columns=\{columns\}
        data=\{data?.items || []\}
        pagination=\{data?.pagination\}
        onPaginationChange=\{(pagination) =&gt; 
          setFilters(prev =&gt; (\{ ...prev, ...pagination \}))
        \}
        isLoading=\{isLoading\}
        error=\{error\}
      /&gt;
    </AdminListLayout&gt;
  );
\}
```

### State Management

```typescript
// File: apps/web/src/stores/ui.store.ts

import \{ create \} from 'zustand';
import \{ persist \} from 'zustand/middleware';

interface UIStore \{
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: UIStore['theme']) =&gt; void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () =&gt; void;
  
  // Modals
  modals: \{
    [key: string]: boolean;
  \};
  openModal: (key: string) =&gt; void;
  closeModal: (key: string) =&gt; void;
\}

export const useUIStore = create<UIStore>()(
  persist(
    (set) =&gt; (\{
      theme: 'system',
      setTheme: (theme) =&gt; set(\{ theme \}),
      
      sidebarCollapsed: false,
      toggleSidebar: () =&gt; set((state) =&gt; (\{ 
        sidebarCollapsed: !state.sidebarCollapsed 
      \})),
      
      modals: \{\},
      openModal: (key) =&gt; set((state) =&gt; (\{
        modals: \{ ...state.modals, [key]: true \}
      \})),
      closeModal: (key) =&gt; set((state) =&gt; (\{
        modals: \{ ...state.modals, [key]: false \}
      \}))
    \}),
    \{
      name: 'ui-store',
      partialize: (state) =&gt; (\{
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed
      \})
    \}
  )
);
```

### API Client

```typescript
// File: apps/web/src/lib/api/client.ts

import axios from 'axios';
import \{ getSession \} from 'next-auth/react';

const apiClient = axios.create(\{
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
\});

// Request interceptor
apiClient.interceptors.request.use(async (config) =&gt; \{
  const session = await getSession();
  
  if (session?.accessToken) \{
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  \}
  
  if (session?.tenantId) \{
    config.headers['X-Tenant-ID'] = session.tenantId;
  \}
  
  return config;
\});

// Response interceptor
apiClient.interceptors.response.use(
  (response) =&gt; response.data,
  async (error) =&gt; \{
    if (error.response?.status === 401) \{
      // Token expired, try refresh
      await refreshToken();
      return apiClient.request(error.config);
    \}
    
    throw new ApiError(
      error.response?.data?.message || 'An error occurred',
      error.response?.data?.error || 'UNKNOWN_ERROR',
      error.response?.status || 500
    );
  \}
);

export const api = \{
  // Platform tier
  platform: \{
    tenants: createResourceApi('/api/v1/platform/tenants'),
    features: createResourceApi('/api/v1/platform/features'),
    analytics: createResourceApi('/api/v1/platform/analytics')
  \},
  
  // Tenant tier
  tenant: \{
    accounts: createResourceApi('/api/v1/tenant/accounts'),
    plans: createResourceApi('/api/v1/tenant/plans'),
    schemas: createResourceApi('/api/v1/tenant/schemas')
  \},
  
  // Account tier
  account: \{
    users: createResourceApi('/api/v1/account/users'),
    teams: createResourceApi('/api/v1/account/teams'),
    billing: createResourceApi('/api/v1/account/billing')
  \},
  
  // User tier
  user: \{
    profile: createResourceApi('/api/v1/user/profile'),
    portfolios: createResourceApi('/api/v1/user/portfolios'),
    compCards: createResourceApi('/api/v1/user/comp-cards')
  \}
\};
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// File: apps/api/src/services/__tests__/account.service.test.ts

describe('AccountService', () =&gt; \{
  let service: AccountService;
  
  beforeEach(() =&gt; \{
    service = new AccountService();
    jest.clearAllMocks();
  \});
  
  describe('createAccount', () =&gt; \{
    it('should create account with default admin user', async () =&gt; \{
      const tenantId = 'tenant-123';
      const data = \{
        name: 'Test Account',
        type: AccountType.AGENCY,
        adminEmail: 'admin@test.com',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        adminPassword: 'SecurePass123!'
      \};
      
      const account = await service.createAccount(tenantId, data);
      
      expect(account).toMatchObject(\{
        name: data.name,
        type: data.type,
        tenantId
      \});
      expect(account.users).toHaveLength(1);
      expect(account.users[0].email).toBe(data.adminEmail);
    \});
    
    it('should throw error when account limit exceeded', async () =&gt; \{
      const tenantId = 'tenant-limited';
      mockGetTenantLimits.mockResolvedValue(\{ accounts: 5 \});
      mockAccountCount.mockResolvedValue(5);
      
      await expect(
        service.createAccount(tenantId, validData)
      ).rejects.toThrow(LimitExceededError);
    \});
  \});
\});
```

### Integration Tests

```typescript
// File: apps/api/src/routes/__tests__/accounts.test.ts

describe('Account Routes', () =&gt; \{
  let app: FastifyInstance;
  
  beforeAll(async () =&gt; \{
    app = await buildApp(\{ logger: false \});
    await app.ready();
  \});
  
  afterAll(async () =&gt; \{
    await app.close();
  \});
  
  describe('POST /api/v1/tenant/accounts', () =&gt; \{
    it('should create account with valid data', async () =&gt; \{
      const token = await getAuthToken('tenant_admin');
      
      const response = await app.inject(\{
        method: 'POST',
        url: '/api/v1/tenant/accounts',
        headers: \{
          authorization: `Bearer ${token}`
        \},
        payload: \{
          name: 'New Agency',
          type: 'AGENCY',
          adminEmail: 'admin@newagency.com',
          adminFirstName: 'Agency',
          adminLastName: 'Admin',
          adminPassword: 'SecurePass123!'
        \}
      \});
      
      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject(\{
        success: true,
        data: \{
          name: 'New Agency',
          type: 'AGENCY'
        \}
      \});
    \});
    
    it('should return 403 without permission', async () =&gt; \{
      const token = await getAuthToken('basic_user');
      
      const response = await app.inject(\{
        method: 'POST',
        url: '/api/v1/tenant/accounts',
        headers: \{
          authorization: `Bearer ${token}`
        \},
        payload: validPayload
      \});
      
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject(\{
        success: false,
        error: 'FORBIDDEN'
      \});
    \});
  \});
\});
```

### E2E Tests

```typescript
// File: apps/web/e2e/accounts.spec.ts

import \{ test, expect \} from '@playwright/test';

test.describe('Account Management', () =&gt; \{
  test.beforeEach(async (\{ page \}) =&gt; \{
    await loginAsTenantAdmin(page);
    await page.goto('/accounts');
  \});
  
  test('should create new account', async (\{ page \}) =&gt; \{
    // Click new account button
    await page.click('text=New Account');
    
    // Fill form
    await page.fill('input[name="name"]', 'Test Agency');
    await page.selectOption('select[name="type"]', 'AGENCY');
    await page.fill('input[name="adminEmail"]', 'admin@testagency.com');
    await page.fill('input[name="adminFirstName"]', 'Test');
    await page.fill('input[name="adminLastName"]', 'Admin');
    await page.fill('input[name="adminPassword"]', 'SecurePass123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page).toHaveURL(/\/accounts\/[\w-]+/);
    await expect(page.locator('h1')).toContainText('Test Agency');
  \});
  
  test('should show validation errors', async (\{ page \}) =&gt; \{
    await page.click('text=New Account');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check errors
    await expect(page.locator('.error-message')).toContainText('Name is required');
    await expect(page.locator('.error-message')).toContainText('Email is required');
  \});
\});
```

## 🚀 Deployment

### Production Build

```bash
# Build all packages
pnpm run build

# Run production
NODE_ENV=production pnpm run start
```

### Docker Deployment with Persistent Storage

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000 3001
CMD ["node", "dist/index.js"]
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: itellico_mono
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      # Persistent database storage
      - ./docker-data/databases/postgres/data:/var/lib/postgresql/data
      - ./docker/configs/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
    ports:
      - "5432:5432"
    restart: unless-stopped
  
  redis:
    image: redis:7-alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      # Persistent Redis data
      - ./docker-data/cache/redis:/data
      - ./docker/configs/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    ports:
      - "6379:6379"
    restart: unless-stopped
  
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/itellico_mono
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"
    restart: unless-stopped
    volumes:
      # Persistent uploads
      - ./docker-data/uploads:/app/uploads
  
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    depends_on:
      - api
    ports:
      - "3000:3000"
    restart: unless-stopped

# Data persistence is handled via bind mounts
# No named volumes needed - all data in docker-data/
```

### Data Backup Strategy

```bash
# Backup all persistent data
./scripts/backup-docker-data.sh

# Restore from backup
./scripts/restore-docker-data.sh backup-2025-01-11.tar.gz

# Backup individual services
docker exec postgres pg_dump -U developer mono > backup.sql
docker exec redis redis-cli BGSAVE
```

## 📚 Best Practices

### Code Organization

1. **Feature-based structure** - Group by feature, not file type
2. **Barrel exports** - Use index.ts for clean imports
3. **Shared types** - Keep types in packages/shared
4. **Service layer** - Business logic in services, not routes
5. **Custom hooks** - Reusable logic in hooks

### Security

1. **UUID for all IDs** - Never expose sequential IDs
2. **Tenant isolation** - Always filter by tenantId
3. **Permission checks** - At route and service level
4. **Input validation** - Use TypeBox schemas
5. **SQL injection** - Use Prisma parameterized queries
6. **XSS prevention** - Sanitize user input
7. **CORS** - Configure per environment

### Performance

1. **Database indexes** - On foreign keys and filters
2. **Redis caching** - 5-minute TTL for lists
3. **Pagination** - Limit max 100 items
4. **Select specific fields** - Don't fetch unnecessary data
5. **Batch operations** - Use Promise.all()
6. **Connection pooling** - Configure Prisma pool
7. **CDN for assets** - CloudFlare for static files

### Error Handling

```typescript
// Custom error classes
export class AppError extends Error \{
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) \{
    super(message);
    this.name = 'AppError';
  \}
\}

export class ValidationError extends AppError \{
  constructor(message: string, details?: any) \{
    super(message, 'VALIDATION_ERROR', 400, details);
  \}
\}

export class NotFoundError extends AppError \{
  constructor(resource: string, id?: string) \{
    super(
      `${resource} not found${id ? `: $\{id\}` : ''}`,
      'NOT_FOUND',
      404
    );
  \}
\}

export class ForbiddenError extends AppError \{
  constructor(message = 'Access denied') \{
    super(message, 'FORBIDDEN', 403);
  \}
\}

export class LimitExceededError extends AppError \{
  constructor(
    limitType: string,
    current: number,
    maximum: number
  ) \{
    super(
      `${limitType} limit exceeded (${current}/${maximum})`,
      'LIMIT_EXCEEDED',
      429,
      \{ limitType, current, maximum \}
    );
  \}
\}
```

### Monitoring

```typescript
// Prometheus metrics
import \{ register, Counter, Histogram \} from 'prom-client';

export const httpRequestDuration = new Histogram(\{
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'tier']
\});

export const apiErrors = new Counter(\{
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['error_code', 'tier']
\});

export const featureUsage = new Counter(\{
  name: 'feature_usage_total',
  help: 'Feature usage by tenant',
  labelNames: ['feature', 'tenant_id', 'plan']
\});

// Use in routes
fastify.addHook('onResponse', (request, reply, done) =&gt; \{
  httpRequestDuration
    .labels(
      request.method,
      request.routerPath,
      reply.statusCode.toString(),
      getTierFromPath(request.url)
    )
    .observe(reply.getResponseTime() / 1000);
  done();
\});
```

### Development Workflow

1. **Branch naming**: `feature/`, `fix/`, `refactor/`
2. **Commit messages**: Conventional commits
3. **PR template**: Description, screenshots, checklist
4. **Code review**: Required before merge
5. **CI/CD**: Tests must pass
6. **Documentation**: Update with code

## 🎯 Next Steps

1. **Set up development environment**
2. **Run seed scripts**
3. **Start with Phase 1 (Foundation)**
4. **Follow the roadmap phases**
5. **Test thoroughly**
6. **Document as you go**

For questions or issues, refer to:
- [Architecture Documentation](./docs/architecture/)
- [API Documentation](./docs/api-endpoints-5-tier.md)
- [Component Library](http://localhost:3000/dev/components)
- [Monitoring Dashboard](http://localhost:5005)

Happy coding! 🚀
