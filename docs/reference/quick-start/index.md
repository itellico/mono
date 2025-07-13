---
title: Quick Start Guide
sidebar_label: Quick Start
---

# Quick Start Guide

Get up and running with itellico Mono in under 10 minutes. This guide covers the essential steps to set up your development environment and start building.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or later) - [Download](https://nodejs.org/)
- **pnpm** (v8 or later) - Install with `corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/) (recommended for services)
- **Git** - [Download](https://git-scm.com/)

Optional (if not using Docker):
- **PostgreSQL** (v15 or later) - [Download](https://www.postgresql.org/download/)
- **Redis** (v7 or later) - [Download](https://redis.io/download/)

## 🚀 5-Minute Setup

### 1. Clone the Repository

```bash
git clone https://github.com/itellico/mono.git
cd mono
```

### 2. Install Dependencies

```bash
# Enable pnpm if not already enabled
corepack enable && corepack prepare pnpm@latest --activate

# Install all dependencies
pnpm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# For Docker setup, use these defaults:
DATABASE_URL="postgresql://developer:developer@localhost:5432/mono"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret-minimum-32-chars"

# For production, update credentials in docker-compose.persistent.yml
```

### 4. Database Setup

```bash
# Create database (if not exists)
createdb mono

# Run migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Seed with sample data (optional)
pnpm run seed
```

### 5. Start Development Servers

```bash
# Option 1: Using Docker (recommended - includes all services)
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

# Option 2: Start servers manually in separate terminals
# Terminal 1:
./start-api.sh

# Terminal 2:
./start-frontend.sh

# Option 3: Start both in one terminal
./start-dev.sh
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

## 🎯 Quick Wins

### Create Your First API Endpoint

1. Create a new route file:
```typescript
// apps/api/src/routes/v1/user/hello/index.ts
import type { FastifyPluginAsync } from 'fastify';

export const helloRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      tags: ['user.hello'],
      summary: 'Say hello',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return {
        success: true,
        data: {
          message: 'Hello from itellico Mono!'
        }
      };
    }
  });
};
```

2. Test your endpoint:
```bash
curl http://localhost:3001/api/v1/user/hello
```

### Create Your First React Component

1. Create a new component:
```tsx
// apps/web/src/components/hello-world.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function HelloWorld() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Hello World!</h2>
      <p className="mb-4">You clicked {count} times</p>
      <Button onClick={() => setCount(count + 1)}>
        Click me
      </Button>
    </div>
  );
}
```

2. Use it in a page:
```tsx
// apps/web/src/app/hello/page.tsx
import { HelloWorld } from '@/components/hello-world';

export default function HelloPage() {
  return (
    <div className="container mx-auto py-8">
      <HelloWorld />
    </div>
  );
}
```

3. Visit http://localhost:3000/hello

## 🛠️ Essential Commands

### Development
```bash
# Start development servers
pnpm run dev

# Start specific workspace
pnpm --filter @mono/web dev
pnpm --filter @mono/api dev

# Kill stuck ports
source scripts/utils/safe-port-utils.sh && kill_node_ports 3000 3001
```

### Database
```bash
# Open Prisma Studio (GUI)
pnpm prisma studio

# Create migration
pnpm prisma migrate dev --name add_new_field

# Reset database
pnpm prisma migrate reset
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Code Quality
```bash
# Lint code
pnpm lint

# Fix lint issues
pnpm lint --fix

# Type check
pnpm type-check

# Format code
pnpm format
```

## 🐳 Docker Quick Start

### Using Docker Compose with Persistent Storage

```bash
# Start all services with persistent volumes
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

# View logs
docker-compose logs -f

# Stop services (data persists)
docker-compose down

# Remove services and data (careful!)
docker-compose down -v
```

### Services Available
- **PostgreSQL**: `localhost:5432` (data: `docker-data/databases/postgres/`)
- **Redis**: `localhost:6379` (data: `docker-data/cache/redis/`)
- **Mailpit**: `localhost:4025` (Email testing UI)
- **N8N**: `localhost:5678` (workflows: `docker-data/n8n/`)
- **Temporal**: `localhost:4080` (data: `docker-data/temporal/`)
- **Grafana**: `localhost:5005` (dashboards: `docker-data/monitoring/grafana/`)
- **Kanboard**: `localhost:4041` (data: PostgreSQL)

### Persistent Storage Structure

```
mono/
├── docker/              # Configuration files (in Git)
│   ├── configs/        # Service configurations
│   └── php/            # Custom Dockerfiles
└── docker-data/        # Runtime data (NOT in Git)
    ├── databases/      # PostgreSQL data
    ├── cache/          # Redis persistence
    ├── monitoring/     # Grafana dashboards
    └── uploads/        # User uploads
```

## 🚨 Common Issues

### Port Already in Use
```bash
# Kill Node processes on specific ports
source scripts/utils/safe-port-utils.sh && kill_node_ports 3000 3001

# Check what's using a port
lsof -i :3000
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres -l

# Create database if missing
createdb mono

# Check connection string
psql $DATABASE_URL
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
pnpm prisma generate
```

## 📚 Next Steps

Now that you have the basics running:

1. **Explore the Architecture**
   - Read [Architecture Overview](/architecture)
   - Understand the [5-Tier API Structure](/architecture/api-design)

2. **Set Up Your Development Environment**
   - Configure your [IDE](/development/tools)
   - Install recommended VS Code extensions

3. **Learn the Stack**
   - [Next.js 15 Documentation](https://nextjs.org/docs)
   - [Fastify Documentation](https://www.fastify.io/docs/)
   - [Prisma Documentation](https://www.prisma.io/docs/)
   - [TanStack Query](https://tanstack.com/query/)

4. **Join the Community**
   - GitHub Discussions
   - Discord Server
   - Contributing Guidelines

## 🎉 Congratulations!

You've successfully set up itellico Mono! Here are some useful resources:

- **[Complete Developer Guide](/development/getting-started/developer-guide)** - Comprehensive setup and development guide
- **[API Documentation](http://localhost:3001/docs)** - Interactive API explorer
- **[Component Library](/dev/components)** - Browse available UI components
- **[Architecture Guide](/architecture)** - Deep dive into system design

## Quick Reference Card

```bash
# 🚀 Start Development
./start-dev.sh

# 🔍 Useful URLs
Frontend:    http://localhost:3000
API:         http://localhost:3001
API Docs:    http://localhost:3001/docs
Prisma GUI:  http://localhost:5555
Email UI:    http://localhost:4025

# 📁 Key Directories
Frontend:    apps/web/src
API:         apps/api/src
Components:  packages/ui/src
Database:    prisma/

# 🛠️ Common Tasks
Add package:      pnpm add <package>
New migration:    pnpm prisma migrate dev
Run tests:        pnpm test
Build all:        pnpm run build
```

## Need Help?

- Check the [Troubleshooting Guide](/reference/troubleshooting)
- Browse the [Glossary](/reference/glossary) for terminology
- Read the [FAQ](/guides/faq)
- Ask in GitHub Discussions

Happy coding! 🚀