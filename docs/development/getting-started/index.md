---
title: Getting Started
sidebar_label: Getting Started
---

# Getting Started

Welcome to the itellico Mono development environment! This guide will help you get up and running with the platform.

## Overview

The itellico Mono is a multi-tenant SaaS marketplace platform built with:

- **Frontend**: Next.js 15 with React 18
- **Backend**: Fastify 4 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session and application caching
- **Package Manager**: pnpm (required)

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (package manager)
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/itellico/mono.git
   cd mono
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

4. **Start services**
   ```bash
   # Option 1: Use Docker for services
   ./scripts/setup-services.sh
   
   # Option 2: Use local services
   # Start PostgreSQL and Redis manually
   ```

5. **Run database migrations**
   ```bash
   pnpm prisma migrate dev
   pnpm prisma generate
   ```

6. **Start development servers**
   ```bash
   # Kill any conflicting processes
   source scripts/utils/safe-port-utils.sh
   kill_node_ports 3000 3001
   
   # Start API server first
   cd apps/api && pnpm run dev &
   
   # Start frontend server
   pnpm run dev
   ```

## Getting Started Documentation

### Developer Guide
- [Developer Guide](./developer-guide) - Comprehensive development setup and workflow

## Development Environment

### Port Configuration
- **Next.js Frontend**: http://localhost:3000
- **Fastify API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs
- **Documentation Site**: http://localhost:3005

### Services
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Mailpit**: http://localhost:4025
- **N8N**: http://localhost:5678
- **Grafana**: http://localhost:5005

### Development Commands

```bash
# Development
pnpm dev                    # Start frontend
pnpm --filter @mono/api dev # Start API
pnpm run build             # Build all packages

# Database
pnpm prisma migrate dev    # Run migrations
pnpm prisma generate       # Generate client
pnpm run seed             # Seed database

# Testing
pnpm test                 # Run tests
pnpm run type-check       # TypeScript checking
pnpm run lint             # Code linting
```

## Architecture Overview

### 5-Tier Architecture
```
Platform → Tenant → Account → User → Public
```

### Project Structure
```
/apps
  /web          # Next.js frontend
  /api          # Fastify backend
/packages
  /shared       # Shared utilities
  /ui           # UI components
/docs           # Documentation
/scripts        # Build & dev scripts
```

## Development Workflow

1. **Research First**: Check existing documentation
2. **Understand Requirements**: Review specifications
3. **Follow Patterns**: Use established conventions
4. **Test Thoroughly**: Comprehensive testing
5. **Document Changes**: Keep docs updated

## Essential Tools

### IDE Setup
- **VS Code**: Recommended editor
- **Extensions**: TypeScript, Prisma, ESLint, Prettier
- **Settings**: Auto-format on save

### Command Line Tools
- **pnpm**: Package manager
- **prisma**: Database toolkit
- **tsx**: TypeScript execution
- **pm2**: Process manager

### Browser Tools
- **React DevTools**: Component debugging
- **Redux DevTools**: State management
- **Network Tab**: API debugging

## Common Issues

### Port Conflicts
```bash
# Safe port killing (preserves Docker)
source scripts/utils/safe-port-utils.sh
kill_node_ports 3000 3001
```

### Database Issues
```bash
# Reset database
pnpm prisma migrate reset
pnpm prisma generate
pnpm run seed
```

### Cache Issues
```bash
# Clear Redis cache
redis-cli FLUSHDB
```

## Next Steps

1. **Review Architecture**: [Architecture Documentation](../../architecture/)
2. **Explore API**: [API Reference](http://localhost:3001/docs)
3. **Check Workflows**: [Development Workflows](../workflows/)
4. **Run Tests**: [Testing Guide](../testing/)

## Support

- **Documentation**: This site
- **API Reference**: http://localhost:3001/docs
- **Issue Tracking**: GitHub Issues
- **Code Review**: Pull Request process

## Related Documentation

- [Development Tools](../tools/) - Detailed tool setup
- [Deployment](../deployment/) - Deployment guides
- [Testing](../testing/) - Testing strategies
- [Workflows](../workflows/) - Development processes