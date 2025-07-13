---
title: Deployment Guide
sidebar_label: Deployment
---

# Deployment Guide

Comprehensive deployment guide for the itellico Mono platform covering development, staging, and production environments using modern container orchestration and CI/CD practices.

## Overview

Deployment strategies:

- **Container-First**: Docker and Kubernetes
- **Multi-Environment**: Dev, staging, production
- **Zero-Downtime**: Blue-green deployments
- **Auto-Scaling**: Dynamic resource allocation
- **GitOps**: Infrastructure as code

## 🚀 **NEW: NestJS Deployment**

For the latest enterprise-grade NestJS architecture:
- 📖 **[NestJS Deployment Guide](./nestjs-deployment.md)** - Complete production deployment with Fastify adapter
- 🎯 **Performance**: >40K req/sec with enterprise monitoring
- 🔐 **Security**: Container hardening and secret management
- 📊 **Observability**: Prometheus metrics and health checks

## Deployment Architecture

### Environment Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                 (CloudFlare / Nginx)                     │
└──────────┬────────────────────────┬─────────────────────┘
           │                        │
    ┌──────▼──────┐          ┌──────▼──────┐
    │  Production │          │   Staging   │
    │   Cluster   │          │   Cluster   │
    └──────┬──────┘          └──────┬──────┘
           │                        │
    ┌──────▼──────────────────────▼──────┐
    │         Shared Services            │
    │  (Database, Redis, S3, etc.)       │
    └────────────────────────────────────┘
```

## Local Development

### Docker Compose Setup with Persistent Storage

```yaml
# docker-compose.yml + docker-compose.persistent.yml
version: '3.8'

services:
  # Frontend - Next.js
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://api:3001

  # API - Fastify
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://developer:developer@postgres:5432/mono
      - REDIS_URL=redis://redis:6379

  # PostgreSQL with persistent storage
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=developer
      - POSTGRES_PASSWORD=developer
      - POSTGRES_DB=mono
    volumes:
      # Persistent data storage
      - ./docker-data/databases/postgres/data:/var/lib/postgresql/data
      - ./docker/configs/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro

  # Redis with persistence
  redis:
    image: redis:7-alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    ports:
      - "6379:6379"
    volumes:
      # Persistent Redis data
      - ./docker-data/cache/redis:/data
      - ./docker/configs/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro

  # Additional services with persistence
  grafana:
    volumes:
      - ./docker-data/monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - ./docker-data/monitoring/grafana/data:/var/lib/grafana

  n8n:
    volumes:
      - ./docker-data/n8n:/home/node/.n8n

  temporal:
    volumes:
      - ./docker-data/temporal/data:/var/lib/temporal

# No named volumes - all data persisted via bind mounts
```

### Persistent Storage Architecture

```
mono/
├── docker/              # Configuration files (tracked in Git)
│   ├── configs/        # Service configurations
│   │   ├── postgres/   # PostgreSQL configs
│   │   ├── redis/      # Redis configs
│   │   └── nginx/      # Nginx configs
│   └── php/            # Custom Dockerfiles
└── docker-data/        # Runtime data (NOT in Git)
    ├── databases/      # Database storage
    ├── cache/          # Redis and other caches
    ├── monitoring/     # Grafana, Prometheus data
    ├── uploads/        # User uploaded files
    └── backups/        # Automated backups
```

### Development Scripts

```bash
# Start all services with persistence
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

# Or use convenience scripts
./scripts/start-dev.sh
./scripts/setup-services.sh

# Database operations
pnpm prisma migrate dev
pnpm prisma generate
pnpm run seed

# Build for production
pnpm run build

# Backup all persistent data
./scripts/backup-docker-data.sh

# Migrate to persistent Docker setup
./scripts/migrate-to-persistent-docker.sh
```

## Production Deployment

### Dockerfile Configuration

#### Frontend Dockerfile

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### API Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build application
RUN pnpm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy necessary files
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/prisma ./prisma
COPY --from=builder --chown=fastify:nodejs /app/package.json ./

USER fastify

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment

#### Namespace Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mono-production
---
apiVersion: v1
kind: Namespace
metadata:
  name: mono-staging
```

#### Web Deployment

```yaml
# k8s/web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: mono-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: itellico/mono-web:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.itellico.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
  namespace: mono-production
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

#### API Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: mono-production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: itellico/mono-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: mono-production
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
```

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mono-ingress
  namespace: mono-production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - itellico.com
    - api.itellico.com
    secretName: mono-tls
  rules:
  - host: itellico.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  - host: api.itellico.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run type-check
      - run: pnpm run test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Web
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          push: true
          tags: |
            itellico/mono-web:latest
            itellico/mono-web:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          push: true
          tags: |
            itellico/mono-api:latest
            itellico/mono-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Kubernetes
        env:
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
        run: |
          echo "$KUBE_CONFIG" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
          
          # Update image tags
          kubectl set image deployment/web web=itellico/mono-web:${{ github.sha }} -n mono-production
          kubectl set image deployment/api api=itellico/mono-api:${{ github.sha }} -n mono-production
          
          # Wait for rollout
          kubectl rollout status deployment/web -n mono-production
          kubectl rollout status deployment/api -n mono-production
```

## Database Migrations

### Production Migration Strategy

```bash
#!/bin/bash
# scripts/migrate-production.sh

# 1. Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Run migrations in transaction
pnpm prisma migrate deploy

# 3. Verify migration
pnpm prisma db pull
pnpm prisma validate

# 4. Health check
curl -f https://api.itellico.com/health || exit 1
```

### Zero-Downtime Migrations

```typescript
// prisma/migrations/safe-migration.ts
export async function safeMigration(prisma: PrismaClient) {
  // 1. Add new column as nullable
  await prisma.$executeRaw`
    ALTER TABLE "User" 
    ADD COLUMN IF NOT EXISTS "newField" TEXT;
  `;

  // 2. Backfill data in batches
  const batchSize = 1000;
  let processed = 0;
  
  while (true) {
    const users = await prisma.user.findMany({
      where: { newField: null },
      take: batchSize,
    });
    
    if (users.length === 0) break;
    
    await Promise.all(
      users.map(user =>
        prisma.user.update({
          where: { id: user.id },
          data: { newField: 'default' },
        })
      )
    );
    
    processed += users.length;
    console.log(`Processed ${processed} users`);
  }

  // 3. Make column non-nullable
  await prisma.$executeRaw`
    ALTER TABLE "User" 
    ALTER COLUMN "newField" SET NOT NULL;
  `;
}
```

## Monitoring & Rollback

### Health Checks

```typescript
// apps/api/src/routes/health.ts
export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    const checks = {
      database: await checkDatabase(),
      redis: await checkRedis(),
      storage: await checkStorage(),
    };
    
    const healthy = Object.values(checks).every(check => check.status === 'ok');
    
    return reply
      .status(healthy ? 200 : 503)
      .send({
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks,
      });
  });
};
```

### Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback.sh

# 1. Get previous version
PREVIOUS_VERSION=$(kubectl get deployment web -n mono-production -o jsonpath='{.metadata.annotations.previous-version}')

# 2. Rollback deployments
kubectl set image deployment/web web=itellico/mono-web:$PREVIOUS_VERSION -n mono-production
kubectl set image deployment/api api=itellico/mono-api:$PREVIOUS_VERSION -n mono-production

# 3. Wait for rollout
kubectl rollout status deployment/web -n mono-production
kubectl rollout status deployment/api -n mono-production

# 4. Verify health
./scripts/health-check.sh || exit 1
```

## Environment Variables

### Required Variables

```bash
# .env.production
# Database
DATABASE_URL=postgresql://user:pass@host:5432/mono
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=secret

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://itellico.com

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=itellico-uploads

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-license-key
```

## Security Considerations

### Secret Management

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: mono-production
type: Opaque
stringData:
  jwt-secret: ${JWT_SECRET}
  database-url: ${DATABASE_URL}
  redis-url: ${REDIS_URL}
```

### Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: mono-production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    - namespaceSelector:
        matchLabels:
          name: mono-production
    ports:
    - protocol: TCP
      port: 3001
```

## Performance Optimization

### Auto-Scaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: mono-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### CDN Configuration

```typescript
// next.config.ts
export default {
  images: {
    domains: ['cdn.itellico.com'],
    loader: 'cloudinary',
  },
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.itellico.com' 
    : undefined,
};
```

## Best Practices

1. **Blue-Green Deployments**: Minimize downtime
2. **Health Checks**: Comprehensive monitoring
3. **Gradual Rollouts**: Canary deployments
4. **Secret Rotation**: Regular updates
5. **Backup Strategy**: Automated backups
6. **Load Testing**: Before major releases
7. **Documentation**: Keep deployment docs updated
8. **Monitoring**: Real-time alerts

## Troubleshooting

### Common Issues

1. **Pod Crashes**
   ```bash
   kubectl logs -f pod-name -n mono-production
   kubectl describe pod pod-name -n mono-production
   ```

2. **Database Connection**
   ```bash
   kubectl exec -it api-pod -n mono-production -- nc -zv postgres-host 5432
   ```

3. **Memory Leaks**
   ```bash
   kubectl top pods -n mono-production
   kubectl describe hpa api-hpa -n mono-production
   ```

## Related Documentation

- [Docker Persistence Architecture](/docs/DOCKER_PERSISTENCE_ARCHITECTURE.md) - Complete guide to persistent volumes
- [Docker Volume Guide](/docs/DOCKER_VOLUMES_GUIDE.md) - Detailed volume management
- [Docker Management](./docker) - Volume persistence, backups, and utilities
- [Kubernetes on Hetzner](./kubernetes) - Production-grade Kubernetes deployment guide
- [Development Workflow](/development/workflows/complete-workflow)
- [Testing Guide](/development/testing/methodology)
- [Monitoring Guide](/guides/monitoring)
- [Security Best Practices](/architecture/security)