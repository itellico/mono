# Kanboard MCP and Environment Configuration Harmonization Report

## Current Situation Analysis

### 1. Kanboard MCP Server Files Found

1. **`/mcp-servers/kanboard/index.js`** - The actual MCP server being used
   - Modern ES modules (`type: "module"`)
   - Uses environment variables: `KANBOARD_USERNAME`, `KANBOARD_PASSWORD`, `KANBOARD_API_TOKEN`
   - Default endpoint: `http://localhost:4041/jsonrpc.php`
   - Package: `@itellico-mono/kanboard-mcp-server`

2. **`/mcp-servers/kanboard-enhanced.js`** - Enhanced version (not in use)
   - CommonJS format
   - Uses `.env.kanboard` file
   - Has additional features for documentation/clickdummy links

3. **`/mcp-servers/kanboard-example.js`** - Example/demo version (not in use)
   - CommonJS format
   - Uses `.env.kanboard` file
   - Basic functionality only

### 2. Environment Files Chaos

We currently have:
- `.env` - Main environment file
- `.env.local` - Local development
- `.env.docker` - Docker development
- `.env.services` - Docker services with local PostgreSQL
- `.env.kanboard` - Kanboard-specific (only used by example files)
- `.env.kanboard.example` - Example for Kanboard
- `.env.example` - General example
- `.env.production.example` - Production example
- `apps/api/.env` - API-specific environment
- `apps/api/.env.test` - API test environment
- `apps/api/.env.example` - API example

### 3. Authentication Issue

The MCP server in `/mcp-servers/kanboard/index.js` expects:
- `KANBOARD_USERNAME` (defaults to 'jsonrpc')
- `KANBOARD_PASSWORD` or `KANBOARD_API_TOKEN`

But these are only defined in `.env.kanboard`, which the main MCP server doesn't load!

## Harmonization Plan

### Step 1: Consolidate Environment Variables

Create a single source of truth for all environment variables.

#### Primary .env Structure:
```bash
# Core Database Configuration
DATABASE_URL="postgresql://developer:developer@localhost:5432/mono"
DATABASE_URL_TEST="postgresql://developer:developer@localhost:5433/mono_test"

# Redis Configuration
REDIS_URL="redis://localhost:6379/0"
REDIS_URL_TEST="redis://localhost:6380/0"

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-jwt-secret-key-here
AUTH_SECRET="development-secret-key-only-for-dev"

# Kanboard Configuration
KANBOARD_USERNAME=jsonrpc
KANBOARD_PASSWORD=ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad
KANBOARD_API_TOKEN=ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad
KANBOARD_API_ENDPOINT=http://localhost:4041/jsonrpc.php

# N8N Configuration
N8N_BASE_URL=http://localhost:5678
N8N_DOCS_WEBHOOK_URL=http://localhost:5678/webhook/docs-approval

# Mattermost Configuration
MATTERMOST_WEBHOOK_URL=https://mm.itellico.com/hooks/tcpsebpfbbdqdyrq4tiancupyc
MATTERMOST_DOCS_CHANNEL=mono-docs

# Email Configuration (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@mono-platform.local
SMTP_SECURE=false

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=admin123
PROMETHEUS_RETENTION=15d
```

### Step 2: Environment-Specific Overrides

#### .env.local (Git-ignored, user-specific overrides)
```bash
# Override any values from .env for local development
# Example: Different database credentials
# DATABASE_URL="postgresql://myuser:mypass@localhost:5432/mydb"
```

#### .env.docker (Docker Compose overrides)
```bash
# Docker-specific network addresses
DATABASE_URL="postgresql://developer:developer@postgres:5432/mono"
REDIS_URL="redis://redis:6379/0"
KANBOARD_API_ENDPOINT=http://nginx/kanboard/jsonrpc.php
SMTP_HOST=mailpit
N8N_BASE_URL=http://n8n:5678
```

#### .env.production (Production values)
```bash
# Production-specific values (should be in secrets management)
DATABASE_URL="${PROD_DATABASE_URL}"
REDIS_URL="${PROD_REDIS_URL}"
JWT_SECRET="${PROD_JWT_SECRET}"
```

### Step 3: Remove Redundant Files

Files to remove:
- `.env.kanboard` - Merge into main `.env`
- `.env.services` - Merge into `.env.docker`
- `apps/api/.env` - Use root `.env` with proper path resolution

### Step 4: Update Application Code

1. **Update MCP server configuration** to use environment variables from the main `.env`
2. **Update Docker Compose** to use the consolidated environment files
3. **Update startup scripts** to source the correct environment files

### Step 5: MCP Configuration Fix

For Claude Desktop MCP configuration, ensure the Kanboard server is configured with environment variables:

```json
{
  "mcpServers": {
    "itellico-mono-kanboard": {
      "command": "node",
      "args": ["/Users/mm2/dev_mm/mono/mcp-servers/kanboard/index.js"],
      "env": {
        "KANBOARD_USERNAME": "jsonrpc",
        "KANBOARD_PASSWORD": "ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad",
        "KANBOARD_API_ENDPOINT": "http://localhost:4041/jsonrpc.php"
      }
    }
  }
}
```

## Implementation Steps

1. **Backup current environment files**
2. **Create consolidated .env file** with all necessary variables
3. **Update docker-compose.yml** to use the new structure
4. **Test all services** to ensure they still work
5. **Update documentation** to reflect the new structure
6. **Remove redundant files** after confirming everything works

## Benefits

1. **Single source of truth** for environment variables
2. **Clear hierarchy** of overrides (base → docker → local → production)
3. **Reduced confusion** about which file to edit
4. **Easier onboarding** for new developers
5. **Better security** with clear separation of concerns