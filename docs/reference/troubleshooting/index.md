---
title: Troubleshooting Guide
sidebar_label: Troubleshooting
---

# Troubleshooting Guide

Common issues and their solutions when working with the itellico Mono platform. This guide covers development, deployment, and runtime issues.

## Development Issues

### Port Already in Use

**Problem**: Error "EADDRINUSE: address already in use"

**Solutions**:

1. **Safe port cleanup (recommended)**:
```bash
# Kill only Node.js processes on specific ports
source scripts/utils/safe-port-utils.sh && kill_node_ports 3000 3001
```

2. **Check what's using the port**:
```bash
# See what's on port 3000
lsof -i :3000

# See process details
ps aux | grep node
```

3. **Use backup port for API**:
```bash
# If 3001 is blocked, use 3010
cd apps/api && PORT=3010 pnpm run dev
```

⚠️ **WARNING**: Never kill Docker processes on ports like 6379 (Redis) or 5432 (PostgreSQL)!

### Module Not Found Errors

**Problem**: "Cannot find module" or "Module not found" errors

**Solutions**:

1. **Reinstall dependencies**:
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

2. **Check workspace references**:
```bash
# Verify workspaces are linked
pnpm ls @mono/ui
pnpm ls @mono/database
```

3. **Regenerate Prisma client**:
```bash
pnpm prisma generate
```

4. **Clear Next.js cache**:
```bash
rm -rf apps/web/.next
```

### TypeScript Errors

**Problem**: Type errors that don't make sense

**Solutions**:

1. **Restart TypeScript server**:
   - VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

2. **Clean TypeScript cache**:
```bash
# Remove all tsconfig.tsbuildinfo files
find . -name "tsconfig.tsbuildinfo" -delete

# Rebuild
pnpm type-check
```

3. **Check TypeScript version**:
```bash
# Ensure using workspace TypeScript
pnpm ls typescript
```

## Database Issues

### Connection Failed

**Problem**: "Can't connect to PostgreSQL" or "ECONNREFUSED"

**Solutions**:

1. **Check PostgreSQL is running**:
```bash
# Check status
psql -U postgres -c "SELECT 1"

# Start PostgreSQL (macOS)
brew services start postgresql@15

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

2. **Verify connection string**:
```bash
# Test connection
psql $DATABASE_URL

# Check .env file
cat .env | grep DATABASE_URL
```

3. **Create database if missing**:
```bash
createdb mono
```

### Migration Errors

**Problem**: "Migration failed" or schema out of sync

**Solutions**:

1. **Reset migrations (development only)**:
```bash
# WARNING: This will delete all data!
pnpm prisma migrate reset
```

2. **Fix diverged schema**:
```bash
# Pull current schema
pnpm prisma db pull

# Create migration from changes
pnpm prisma migrate dev --name fix_schema

# Apply migrations
pnpm prisma migrate deploy
```

3. **Check migration status**:
```bash
pnpm prisma migrate status
```

### Prisma Client Issues

**Problem**: Prisma types not updating or "PrismaClient is not a constructor"

**Solutions**:

1. **Regenerate client**:
```bash
pnpm prisma generate
```

2. **Clear Prisma cache**:
```bash
rm -rf node_modules/.prisma
pnpm prisma generate
```

3. **Check imports**:
```typescript
// ✅ Correct
import { PrismaClient } from '@prisma/client';

// ❌ Wrong
import PrismaClient from '@prisma/client';
```

## API Issues

### Authentication Failures

**Problem**: "Unauthorized" or "Invalid token" errors

**Solutions**:

1. **Check JWT secrets match**:
```bash
# Frontend and API must use same secret
grep JWT_SECRET .env
grep NEXTAUTH_SECRET .env
```

2. **Clear browser cookies**:
```javascript
// In browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

3. **Verify token format**:
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/user/profile
```

### CORS Errors

**Problem**: "CORS policy" or "No 'Access-Control-Allow-Origin'" errors

**Solutions**:

1. **Check API CORS config**:
```typescript
// apps/api/src/app.ts
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

2. **Verify environment variables**:
```bash
# Check frontend URL in API
grep FRONTEND_URL apps/api/.env

# Check API URL in frontend
grep NEXT_PUBLIC_API_URL apps/web/.env
```

### Rate Limiting

**Problem**: "Too many requests" or 429 errors

**Solutions**:

1. **Check rate limit headers**:
```bash
curl -I http://localhost:3001/api/v1/user/profile
# Look for: X-RateLimit-Remaining
```

2. **Clear rate limit (development)**:
```bash
# Connect to Redis
redis-cli

# Clear rate limit keys
KEYS temp:rate-limit:* | xargs redis-cli DEL
```

## Frontend Issues

### Hydration Errors

**Problem**: "Hydration failed" or "Text content does not match"

**Solutions**:

1. **Check for client-only code**:
```typescript
// ✅ Correct
'use client';
import { useState, useEffect } from 'react';

export function Component() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  // Client-only code here
}
```

2. **Suppress hydration for dynamic content**:
```tsx
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>
```

### State Management Issues

**Problem**: State not updating or stale data

**Solutions**:

1. **Check TanStack Query keys**:
```typescript
// Ensure unique keys
const { data } = useQuery({
  queryKey: ['users', filters], // filters must be stable
  queryFn: fetchUsers,
});
```

2. **Force refetch**:
```typescript
const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['users'] });

// Refetch all
queryClient.refetchQueries();
```

3. **Check Zustand subscriptions**:
```typescript
// Use selector for specific values
const theme = useStore(state => state.theme);
// Not: const { theme } = useStore();
```

## Docker Issues

### Container Won't Start

**Problem**: Docker containers failing to start

**Solutions**:

1. **Check logs**:
```bash
docker-compose logs web
docker-compose logs api
```

2. **Rebuild containers**:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

3. **Check port conflicts**:
```bash
docker ps # See running containers
netstat -tulpn | grep LISTEN # See used ports
```

### Volume Permission Issues

**Problem**: "Permission denied" in Docker volumes

**Solutions**:

1. **Fix ownership**:
```bash
# Find container user ID
docker exec container_name id

# Change ownership
sudo chown -R $(id -u):$(id -g) ./volumes
```

2. **Use named volumes**:
```yaml
volumes:
  postgres_data:
  redis_data:
# Instead of: ./data:/var/lib/postgresql/data
```

## Performance Issues

### Slow API Responses

**Problem**: API requests taking too long

**Solutions**:

1. **Check database queries**:
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

2. **Add indexes**:
```prisma
model User {
  id        Int      @id
  email     String   @unique
  tenantId  Int
  
  @@index([tenantId])
  @@index([email, tenantId])
}
```

3. **Use query optimization**:
```typescript
// ✅ Good: Single query with includes
const users = await prisma.user.findMany({
  include: { profile: true },
});

// ❌ Bad: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  user.profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
}
```

### Memory Leaks

**Problem**: Node.js process using too much memory

**Solutions**:

1. **Monitor memory usage**:
```bash
# Check process memory
ps aux | grep node

# Use Node.js flags
NODE_OPTIONS="--max-old-space-size=4096" pnpm run dev
```

2. **Find leaks**:
```typescript
// Add heap snapshot endpoint
if (process.env.NODE_ENV === 'development') {
  const v8 = require('v8');
  const fs = require('fs');
  
  app.get('/heap-snapshot', (req, res) => {
    const snapshot = v8.writeHeapSnapshot();
    res.download(snapshot);
  });
}
```

## Redis Issues

### Connection Refused

**Problem**: "Redis connection refused" errors

**Solutions**:

1. **Check Redis is running**:
```bash
redis-cli ping
# Should return: PONG
```

2. **Start Redis**:
```bash
# Docker
docker-compose up -d redis

# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

3. **Check connection string**:
```bash
# Test connection
redis-cli -u $REDIS_URL ping
```

### Cache Inconsistency

**Problem**: Stale data or cache not updating

**Solutions**:

1. **Clear specific keys**:
```bash
# Connect to Redis
redis-cli

# Find keys
KEYS tenant:*:user:*

# Delete pattern
EVAL "return redis.call('del', unpack(redis.call('keys', ARGV[1])))" 0 "tenant:*:cache:*"
```

2. **Monitor cache operations**:
```bash
redis-cli MONITOR
```

## Build & Deployment Issues

### Build Failures

**Problem**: "Build failed" errors

**Solutions**:

1. **Clear caches**:
```bash
# Clear all build caches
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf node_modules/.cache
```

2. **Check environment variables**:
```bash
# Ensure all required vars are set
pnpm run validate-env
```

3. **Build sequentially**:
```bash
# Build packages first
pnpm --filter "./packages/**" build

# Then apps
pnpm --filter "./apps/**" build
```

### Docker Build Issues

**Problem**: Docker build failing

**Solutions**:

1. **Check Docker resources**:
```bash
docker system df
docker system prune -a
```

2. **Build with no cache**:
```bash
docker build --no-cache -t app .
```

3. **Debug build**:
```dockerfile
# Add debug step
RUN ls -la && pwd && echo $PATH
```

## Quick Fixes Reference

```bash
# 🔧 Reset Everything (Nuclear Option)
./scripts/reset-all.sh

# 🐛 Debug Mode
DEBUG=* pnpm run dev

# 📊 Performance Profiling
NODE_OPTIONS="--inspect" pnpm run dev
# Open: chrome://inspect

# 🧹 Clean Caches
pnpm store prune
pnpm cache clean --force

# 🔍 Find Large Files
find . -type f -size +100M

# 📦 Check Package Versions
pnpm outdated
pnpm update --interactive
```

## Getting Help

If you're still stuck:

1. **Check logs thoroughly**
2. **Search existing issues on GitHub**
3. **Ask in Discord with**:
   - Error message
   - Steps to reproduce
   - Environment details
   - What you've already tried

## Related Documentation

- [Development Tools](/development/tools)
- [Deployment Guide](/development/deployment)
- [Testing Guide](/development/testing/methodology)
- [Quick Start](/reference/quick-start)