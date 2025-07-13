---
title: Development Tools
sidebar_label: Tools
---

# Development Tools

Comprehensive guide to development tools, utilities, and services used in the itellico Mono project for efficient development, testing, and debugging.

## Overview

Essential tools for development:

- **IDE Integration**: VS Code, Cursor, WebStorm
- **CLI Tools**: Custom scripts and utilities
- **MCP Servers**: Model Context Protocol integration for enhanced AI workflow
- **DevOps Tools**: Docker, Kubernetes, monitoring
- **Testing Tools**: Jest, Playwright, Vitest
- **Debugging Tools**: Chrome DevTools, React DevTools

## IDE Setup

### VS Code / Cursor

#### Essential Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    // Language Support
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    
    // TypeScript
    "ms-vscode.vscode-typescript-next",
    "mattpocock.ts-error-translator",
    
    // React
    "dsznajder.es7-react-js-snippets",
    "burkeholland.simple-react-snippets",
    
    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",
    
    // Docker
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    
    // Testing
    "Orta.vscode-jest",
    "ms-playwright.playwright",
    
    // Productivity
    "alefragnani.project-manager",
    "wayou.vscode-todo-highlight",
    "gruntfuggly.todo-tree",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

#### Workspace Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "eslint.workingDirectories": [
    { "mode": "auto" }
  ]
}
```

#### Debug Configurations

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Fastify API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/apps/api",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--", "--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Chrome DevTools

#### React Developer Tools

```javascript
// Enable component profiling
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = true;
  }
}
```

#### Redux DevTools Integration

```typescript
// For Zustand stores
import { devtools } from 'zustand/middleware';

export const useStore = create<StoreState>()(
  devtools(
    (set) => ({
      // store implementation
    }),
    {
      name: 'app-store',
    }
  )
);
```

## CLI Tools

### Project Scripts

```bash
#!/bin/bash
# scripts/dev-tools.sh

# Quick command reference
echo "🛠️  itellico Mono Development Tools"
echo "=================================="
echo ""
echo "📦 Package Management:"
echo "  pnpm install          - Install dependencies"
echo "  pnpm add <pkg>        - Add dependency"
echo "  pnpm -r update        - Update all packages"
echo ""
echo "🚀 Development:"
echo "  pnpm run dev          - Start dev servers"
echo "  ./start-api.sh        - Start API only"
echo "  ./start-frontend.sh   - Start frontend only"
echo ""
echo "🧪 Testing:"
echo "  pnpm test            - Run tests"
echo "  pnpm test:watch      - Watch mode"
echo "  pnpm test:coverage   - Coverage report"
echo ""
echo "🔍 Code Quality:"
echo "  pnpm lint            - Run ESLint"
echo "  pnpm type-check      - TypeScript check"
echo "  pnpm format          - Prettier format"
echo ""
echo "🗄️  Database:"
echo "  pnpm prisma studio   - GUI database browser"
echo "  pnpm prisma migrate  - Run migrations"
echo "  pnpm db:seed         - Seed database"
```

### Custom CLI Tool

```typescript
#!/usr/bin/env node
// scripts/cli.ts

import { Command } from 'commander';
import { createUser } from './commands/create-user';
import { generateApi } from './commands/generate-api';
import { checkHealth } from './commands/check-health';

const program = new Command();

program
  .name('mono')
  .description('itellico Mono CLI tool')
  .version('1.0.0');

// User management
program
  .command('user:create')
  .description('Create a new user')
  .option('-e, --email <email>', 'User email')
  .option('-r, --role <role>', 'User role')
  .action(createUser);

// Code generation
program
  .command('generate:api')
  .description('Generate API endpoint')
  .option('-t, --tier <tier>', 'API tier (user|account|tenant|platform)')
  .option('-r, --resource <resource>', 'Resource name')
  .action(generateApi);

// Health check
program
  .command('health')
  .description('Check system health')
  .option('-v, --verbose', 'Verbose output')
  .action(checkHealth);

program.parse();
```

## Database Tools

### Prisma Studio

```bash
# Launch GUI database browser
pnpm prisma studio

# Custom launcher with environment
BROWSER=none pnpm prisma studio --port 5555
```

### Database Scripts

```typescript
// scripts/db-utils.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resetDatabase() {
  console.log('🗑️  Resetting database...');
  
  // Delete in correct order (respecting foreign keys)
  await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.application.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.content.deleteMany(),
    prisma.accountUser.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
  
  console.log('✅ Database reset complete');
}

export async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  
  console.log(`📦 Creating backup: ${filename}`);
  
  // Use pg_dump for PostgreSQL
  const { execSync } = require('child_process');
  execSync(`pg_dump $DATABASE_URL > backups/${filename}`);
  
  console.log('✅ Backup complete');
}
```

## API Testing Tools

### Thunder Client / Postman Collections

```json
// api-collection.json
{
  "info": {
    "name": "itellico Mono API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{email}}\",\n  \"password\": \"{{password}}\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/api/v1/public/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "public", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

### API Testing Script

```typescript
// scripts/test-api.ts
import axios from 'axios';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface TestEndpoint {
  method: string;
  path: string;
  auth?: boolean;
  body?: any;
  expectedStatus: number;
}

const endpoints: TestEndpoint[] = [
  {
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
  },
  {
    method: 'POST',
    path: '/api/v1/public/auth/login',
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
    expectedStatus: 200,
  },
  {
    method: 'GET',
    path: '/api/v1/user/profile',
    auth: true,
    expectedStatus: 200,
  },
];

async function testEndpoints() {
  let token: string | null = null;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        data: endpoint.body,
        headers: endpoint.auth && token 
          ? { Authorization: `Bearer ${token}` }
          : {},
      });
      
      if (endpoint.path.includes('login')) {
        token = response.data.data.accessToken;
      }
      
      console.log(
        chalk.green('✓'),
        `${endpoint.method} ${endpoint.path}`,
        chalk.gray(`(${response.status})`)
      );
    } catch (error: any) {
      console.log(
        chalk.red('✗'),
        `${endpoint.method} ${endpoint.path}`,
        chalk.red(`(${error.response?.status || 'ERROR'})`)
      );
    }
  }
}

testEndpoints();
```

## Monitoring Tools

### Local Monitoring Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "5005:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    ports:
      - "4081:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

volumes:
  prometheus_data:
  grafana_data:
```

### Performance Monitoring

```typescript
// utils/performance.ts
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return;
    }
    
    const duration = end! - start;
    console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
    
    // Send to monitoring
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
      });
    }
  }
}

// Usage
const perf = new PerformanceMonitor();
perf.mark('api-start');
const data = await fetchData();
perf.measure('API Call', 'api-start');
```

## Development Utilities

### Mock Data Generator

```typescript
// scripts/generate-mock-data.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateMockData(count: number = 100) {
  console.log(`🎲 Generating ${count} mock records...`);
  
  // Create users
  const users = await Promise.all(
    Array.from({ length: count }, async () => {
      return prisma.user.create({
        data: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
          hashedPassword: 'hashed_password',
          profile: {
            create: {
              displayName: faker.person.fullName(),
              bio: faker.person.bio(),
              location: faker.location.city(),
              skills: faker.helpers.arrayElements(
                ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
                3
              ),
            },
          },
        },
      });
    })
  );
  
  console.log(`✅ Created ${users.length} users`);
}
```

### Environment Validator

```typescript
// scripts/validate-env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('3000'),
  API_PORT: z.string().regex(/^\d+$/).default('3001'),
  
  // Feature flags
  ENABLE_MONITORING: z.string().transform(v => v === 'true').default('false'),
  ENABLE_ANALYTICS: z.string().transform(v => v === 'true').default('false'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}
```

## Git Hooks

### Husky Configuration

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
pnpm lint-staged

# Type check
pnpm type-check
```

### Lint-staged Configuration

```javascript
// lint-staged.config.js
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
  '*.prisma': [
    'prisma format',
  ],
};
```

## Docker Development Tools

### Persistent Docker Setup

The project uses a comprehensive Docker setup with persistent storage:

```yaml
# docker-compose.persistent.yml extends the base configuration
# with bind mounts for data persistence

Services with persistence:
- PostgreSQL: ./docker-data/databases/postgres/data
- Redis: ./docker-data/cache/redis
- Grafana: ./docker-data/monitoring/grafana
- Temporal: ./docker-data/temporal
- N8N: ./docker-data/n8n
# Start with persistence
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d
```

### Docker Directory Structure

```
mono/
├── docker/                 # Configuration (in Git)
│   ├── configs/           # Service configurations
│   │   ├── postgres/      # PostgreSQL config
│   │   ├── redis/         # Redis config
│   │   └── nginx/         # Nginx configs
│   └── php/               # PHP Dockerfiles
└── docker-data/           # Runtime data (NOT in Git)
    ├── databases/         # Database files
    ├── cache/            # Cache data
    ├── monitoring/       # Metrics & logs
    └── uploads/          # User uploads
```

### Docker Compose Override

```yaml
# docker-compose.override.yml
version: '3.8'

services:
  web:
    volumes:
      # Enable hot reload
      - ./apps/web/src:/app/src
      - ./apps/web/public:/app/public
    environment:
      - NEXT_TELEMETRY_DISABLED=1
      - WATCHPACK_POLLING=true

  api:
    volumes:
      # Enable hot reload
      - ./apps/api/src:/app/src
    environment:
      - NODE_ENV=development
      - DEBUG=fastify:*

  # Development-only services
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=postgres
```

### Docker Scripts

```bash
#!/bin/bash
# scripts/docker-dev.sh

# Quick Docker commands with persistence support
case "$1" in
  "up")
    docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d
    echo "✅ Services started with persistent storage"
    ;;
  "down")
    docker-compose down
    echo "✅ Services stopped (data persisted)"
    ;;
  "logs")
    docker-compose logs -f "$2"
    ;;
  "exec")
    docker-compose exec "$2" "${@:3}"
    ;;
  "backup")
    ./scripts/backup-docker-data.sh
    echo "✅ Backed up all persistent data"
    ;;
  "clean")
    read -p "⚠️  This will DELETE all data. Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v
      rm -rf docker-data/*
      docker system prune -f
      echo "✅ Cleaned up including persistent data"
    fi
    ;;
  *)
    echo "Usage: $0 {up|down|logs|exec|backup|clean}"
    exit 1
    ;;
esac
```

### Data Management Scripts

```bash
# Backup all Docker data
./scripts/backup-docker-data.sh

# Migrate from old to new structure
./scripts/migrate-to-persistent-docker.sh

# Check disk usage
du -sh docker-data/*
```

## Best Practices

1. **Tool Consistency**: Use agreed-upon tools across the team
2. **Configuration Sharing**: Commit tool configs to repo
3. **Documentation**: Document tool usage and setup
4. **Automation**: Automate repetitive tasks
5. **Performance**: Monitor tool performance impact
6. **Updates**: Keep tools updated regularly
7. **Training**: Provide team training on tools
8. **Feedback**: Gather feedback on tool effectiveness

## MCP Server Integration

Model Context Protocol (MCP) servers enhance the development workflow by providing Claude with direct access to project resources:

- **Documentation Access**: Semantic search through project documentation
- **Task Management**: Integration with Kanboard for project tracking
- **Prototype Exploration**: Access to PHP click-dummy UI prototypes
- **Code Patterns**: Reusable templates and architectural guidance

See the [MCP Server Integration Guide](mcp-server-integration.md) for detailed setup instructions and best practices.

## Related Documentation

- [MCP Server Integration](mcp-server-integration.md)
- [Development Workflow](/development/workflows/complete-workflow)
- [Testing Methodology](/development/testing/methodology)
- [Deployment Guide](/development/deployment)
- [Getting Started](/development/getting-started/developer-guide)