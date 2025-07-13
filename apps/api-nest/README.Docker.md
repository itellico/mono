# NestJS Docker Configuration

This document describes the Docker setup for the NestJS API with enterprise-grade infrastructure.

## Quick Start

### Development Environment

```bash
# From project root
./start-nestjs-dev.sh

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.nestjs.yml up -d
```

### Production Build

```bash
# Build production image
cd apps/api-nest
docker build -t itellico/mono-nestjs-api:latest .

# Run production container
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  itellico/mono-nestjs-api:latest
```

## Docker Configuration Files

### Production Dockerfile

- **Base Image**: `node:20-alpine` for security and size
- **Multi-stage Build**: Optimized for production
- **Security Features**:
  - Non-root user (`nestjs:1001`)
  - Minimal attack surface
  - Health checks included
  - Proper signal handling with `dumb-init`

### Development Dockerfile

- **Hot Reload**: Volume mounts for source code
- **Dev Dependencies**: Includes development tools
- **Port Mapping**: Direct port access for debugging

### Docker Compose Configuration

#### Services Included

1. **api-nest**: NestJS API with Fastify adapter
2. **postgres**: PostgreSQL 15 with persistent storage
3. **redis**: Redis 7 with persistence
4. **rabbitmq**: RabbitMQ with management UI
5. **prometheus**: Metrics collection
6. **grafana**: Metrics visualization

#### Network Configuration

- **Bridge Network**: `mono-network`
- **Service Discovery**: Services communicate by name
- **Port Mapping**: External access to essential services

## Environment Variables

### Required Variables

```bash
# Core Application
NODE_ENV=development|production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# Cache
REDIS_URL=redis://host:6379

# Message Queue
RABBITMQ_URL=amqp://user:pass@host:5672

# Authentication
JWT_SECRET=your-ultra-secure-jwt-secret
COOKIE_SECRET=your-ultra-secure-cookie-secret

# Logging
LOG_LEVEL=debug|info|warn|error

# Monitoring
METRICS_ENABLED=true|false
```

### Development Environment

```bash
# Development-specific overrides
NODE_ENV=development
LOG_LEVEL=debug
METRICS_ENABLED=true
DATABASE_URL=postgresql://developer:developer@postgres:5432/mono
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://developer:developer@rabbitmq:5672
```

### Production Environment

```bash
# Production-specific settings
NODE_ENV=production
LOG_LEVEL=warn
METRICS_ENABLED=true
# Use secure connection strings with SSL
DATABASE_URL=postgresql://user:pass@host:5432/mono?sslmode=require
REDIS_URL=rediss://user:pass@host:6380
RABBITMQ_URL=amqps://user:pass@host:5671
```

## Health Checks

### Application Health Check

The Docker configuration includes comprehensive health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/public/health || exit 1
```

### Service Dependencies

Health checks ensure services start in proper order:

1. **PostgreSQL**: `pg_isready` check
2. **Redis**: `redis-cli ping` check  
3. **RabbitMQ**: `rabbitmq-diagnostics ping` check
4. **NestJS API**: HTTP health endpoint check

## Volume Management

### Persistent Volumes

```yaml
volumes:
  # Database persistence
  - ./docker-data/databases/postgres/data:/var/lib/postgresql/data
  
  # Redis persistence
  - ./docker-data/cache/redis:/data
  
  # RabbitMQ persistence
  - ./docker-data/rabbitmq:/var/lib/rabbitmq
  
  # Monitoring data
  - ./docker-data/monitoring/prometheus:/prometheus
  - ./docker-data/monitoring/grafana/data:/var/lib/grafana
```

### Development Volumes

```yaml
volumes:
  # Source code hot reload
  - ./apps/api-nest:/app
  - /app/node_modules  # Anonymous volume for node_modules
  - /app/dist          # Anonymous volume for build output
```

## Monitoring Integration

### Prometheus Metrics

The NestJS API exposes metrics at `/metrics`:

- **HTTP Request Metrics**: Duration, count, status codes
- **Database Metrics**: Query count, duration by operation
- **Business Metrics**: Custom application metrics
- **Node.js Metrics**: Memory, CPU, garbage collection

### Grafana Dashboards

Pre-configured dashboards for:

- **API Performance**: Request rates, latency, errors
- **Database Performance**: Connection pools, query performance
- **System Metrics**: Memory, CPU, disk usage
- **Business Metrics**: User activity, feature usage

## Security Configuration

### Container Security

```dockerfile
# Use specific version, not latest
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Use non-root user
USER nestjs

# Remove unnecessary packages
RUN apk del npm
```

### Network Security

```yaml
networks:
  mono-network:
    driver: bridge
    # Isolate services from external networks
```

### Secret Management

```yaml
# Use Docker secrets in production
secrets:
  jwt_secret:
    external: true
  database_password:
    external: true
```

## Development Workflow

### Starting Development Environment

```bash
# 1. Start all services
./start-nestjs-dev.sh

# 2. Check service status
docker-compose ps

# 3. View logs
docker-compose logs -f api-nest

# 4. Access services
curl http://localhost:3001/api/v1/public/health
open http://localhost:3001/docs
open http://localhost:15672  # RabbitMQ UI
```

### Database Operations

```bash
# Run migrations
docker-compose exec api-nest pnpm prisma migrate dev

# Generate Prisma client
docker-compose exec api-nest pnpm prisma generate

# Seed database
docker-compose exec api-nest pnpm run seed

# Database shell access
docker-compose exec postgres psql -U developer -d mono
```

### Debugging

```bash
# Access container shell
docker-compose exec api-nest sh

# View application logs
docker-compose logs -f api-nest

# Check service health
docker-compose exec api-nest curl http://localhost:3001/api/v1/public/health

# Inspect running processes
docker-compose exec api-nest ps aux
```

## Production Deployment

### Building Production Image

```bash
# Build optimized production image
docker build -t itellico/mono-nestjs-api:latest -f Dockerfile .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 \
  -t itellico/mono-nestjs-api:latest .
```

### Environment Preparation

```bash
# Create production environment file
cp .env.example .env.production

# Edit production settings
vim .env.production

# Validate configuration
docker run --rm --env-file .env.production \
  itellico/mono-nestjs-api:latest node -e "console.log('Config OK')"
```

### Health Monitoring

```bash
# Check container health
docker ps --filter health=healthy

# View health check logs
docker inspect <container_id> | jq '.[].State.Health'

# Manual health check
docker exec <container_id> curl -f http://localhost:3001/api/v1/public/health
```

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using the port
lsof -i :3001

# Kill conflicting processes (Node.js only)
pkill -f "node.*3001"

# Use the safe port utility
source scripts/utils/safe-port-utils.sh
kill_node_ports 3001
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U developer

# Test connection from API container
docker-compose exec api-nest nc -zv postgres 5432

# Check logs
docker-compose logs postgres
```

#### Memory Issues

```bash
# Check container resource usage
docker stats

# Check Node.js memory usage
docker-compose exec api-nest node -e "console.log(process.memoryUsage())"

# Increase container memory limit
# Add to docker-compose.yml:
# mem_limit: 1g
```

#### Build Failures

```bash
# Clear Docker build cache
docker builder prune

# Force rebuild without cache
docker-compose build --no-cache api-nest

# Check Dockerfile syntax
docker build --dry-run -f Dockerfile .
```

### Performance Optimization

#### Image Size Optimization

```dockerfile
# Use specific Alpine versions
FROM node:20.11-alpine

# Multi-stage builds to exclude dev dependencies
FROM node:20-alpine AS builder
# ... build steps
FROM node:20-alpine AS runtime
# ... runtime setup
```

#### Build Speed Optimization

```dockerfile
# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code after dependencies
COPY . .
```

#### Runtime Performance

```yaml
# Set resource limits
services:
  api-nest:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

## Best Practices

### Development

- ✅ Use `.dockerignore` to exclude unnecessary files
- ✅ Volume mount source code for hot reload
- ✅ Use development-specific environment variables
- ✅ Enable detailed logging and debugging

### Production

- ✅ Multi-stage builds for smaller images
- ✅ Run as non-root user
- ✅ Include health checks
- ✅ Use specific image tags, not `latest`
- ✅ Set resource limits
- ✅ Use secrets management for sensitive data

### Security

- ✅ Regular base image updates
- ✅ Vulnerability scanning with tools like Trivy
- ✅ Minimal attack surface
- ✅ Network isolation
- ✅ Secret rotation procedures

This Docker configuration provides a robust, scalable, and secure foundation for the NestJS API in both development and production environments.