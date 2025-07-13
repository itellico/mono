---
title: System Design
sidebar_label: System Design
---

# System Design Architecture

The itellico Mono platform is designed as a modern, scalable, multi-tenant SaaS application using a hybrid architecture that combines the best of Next.js and Fastify.

## Overview

System design principles:

- **Hybrid Architecture**: Next.js frontend + Fastify API
- **Multi-Tenant**: Complete tenant isolation
- **Microservices Ready**: Modular design
- **Event-Driven**: Asynchronous processing
- **Cloud-Native**: Container-first approach

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
│                     (Nginx / CloudFlare)                     │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
        ┌─────────▼──────────┐  ┌────────▼────────┐
        │   Next.js App      │  │  Fastify API    │
        │   (Port 3000)      │  │  (Port 3001)    │
        │                    │  │                 │
        │  - React Frontend  │  │  - REST API     │
        │  - SSR/SSG Pages   │  │  - WebSockets   │
        │  - API Routes*     │  │  - GraphQL*     │
        └─────────┬──────────┘  └────────┬────────┘
                  │                       │
        ┌─────────▼───────────────────────▼────────┐
        │              Service Layer               │
        │                                          │
        │  ┌──────────┐  ┌──────────┐  ┌────────┐│
        │  │  Auth    │  │  Cache   │  │  Queue ││
        │  │ Service  │  │  (Redis) │  │  (Bull)││
        │  └──────────┘  └──────────┘  └────────┘│
        └──────────────────┬───────────────────────┘
                           │
        ┌──────────────────▼───────────────────────┐
        │             Data Layer                   │
        │                                          │
        │  ┌──────────┐  ┌──────────┐  ┌────────┐│
        │  │PostgreSQL│  │   S3     │  │Elastic ││
        │  │(Primary) │  │(Storage) │  │(Search)││
        │  └──────────┘  └──────────┘  └────────┘│
        └──────────────────────────────────────────┘
```

### Component Architecture

```typescript
// Frontend Architecture (Next.js)
interface FrontendArchitecture {
  framework: 'Next.js 15';
  features: [
    'Server Components',
    'App Router',
    'Streaming SSR',
    'Partial Prerendering',
    'Server Actions'
  ];
  stateManagement: {
    server: 'TanStack Query';
    client: 'Zustand';
    forms: 'React Hook Form';
  };
  styling: {
    framework: 'Tailwind CSS';
    components: 'shadcn/ui';
    animations: 'Framer Motion';
  };
}

// Backend Architecture (Fastify)
interface BackendArchitecture {
  framework: 'Fastify 4';
  features: [
    'High Performance',
    'Schema Validation',
    'Plugin System',
    'Decorators',
    'Hooks'
  ];
  api: {
    rest: '5-tier hierarchy';
    graphql: 'Optional';
    websocket: 'Real-time';
  };
  database: {
    orm: 'Prisma';
    db: 'PostgreSQL';
    cache: 'Redis';
  };
}
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy

```typescript
interface TenantIsolation {
  database: {
    strategy: 'Schema per tenant';
    sharding: 'By tenant ID';
    connection: 'Pooled per tenant';
  };
  storage: {
    strategy: 'Folder per tenant';
    cdn: 'Separate paths';
    encryption: 'Tenant-specific keys';
  };
  cache: {
    strategy: 'Key prefixing';
    pattern: 'tenant:{id}:*';
    ttl: 'Configurable per tenant';
  };
  search: {
    strategy: 'Index per tenant';
    filtering: 'Tenant ID required';
  };
}
```

### Request Flow

```typescript
// 1. Request arrives with tenant context
interface Request {
  headers: {
    'X-Tenant-ID': string;
    'Authorization': string;
  };
  context: {
    tenant: Tenant;
    user: User;
    permissions: Permission[];
  };
}

// 2. Middleware validates tenant
async function tenantMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];
  const tenant = await getTenant(tenantId);
  
  if (!tenant || tenant.status !== 'ACTIVE') {
    return res.status(403).send('Invalid tenant');
  }
  
  req.context.tenant = tenant;
  next();
}

// 3. Data access is scoped
async function getUserData(context: Context) {
  return prisma.user.findMany({
    where: {
      tenantId: context.tenant.id,
      // Additional filters
    }
  });
}
```

## Service Architecture

### Core Services

```typescript
interface CoreServices {
  auth: {
    type: 'NextAuth + Custom JWT';
    features: [
      'Multi-factor auth',
      'SSO support',
      'Session management',
      'Permission caching'
    ];
  };
  storage: {
    type: 'S3-compatible';
    features: [
      'Direct upload',
      'Image processing',
      'CDN delivery',
      'Signed URLs'
    ];
  };
  messaging: {
    type: 'WebSocket + Redis Pub/Sub';
    features: [
      'Real-time updates',
      'Presence tracking',
      'Message history',
      'Typing indicators'
    ];
  };
  search: {
    type: 'PostgreSQL FTS + ElasticSearch';
    features: [
      'Full-text search',
      'Faceted search',
      'Fuzzy matching',
      'Multi-language'
    ];
  };
}
```

### Microservices Design

```typescript
// Service boundaries
interface ServiceBoundaries {
  core: {
    api: 'Main Fastify API';
    web: 'Next.js Frontend';
  };
  services: {
    auth: 'Authentication service';
    media: 'Media processing service';
    notification: 'Notification service';
    analytics: 'Analytics service';
    billing: 'Billing service';
  };
  workers: {
    email: 'Email queue worker';
    image: 'Image processing worker';
    export: 'Data export worker';
    cleanup: 'Cleanup worker';
  };
}

// Communication patterns
interface ServiceCommunication {
  sync: {
    protocol: 'HTTP/REST';
    authentication: 'Service tokens';
    timeout: '30s default';
  };
  async: {
    broker: 'Redis Pub/Sub';
    queue: 'Bull/BullMQ';
    events: 'Event sourcing';
  };
}
```

## Data Flow Architecture

### Request Processing

```typescript
// 1. Client Request
interface ClientRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: '/api/v1/user/profile';
  headers: Headers;
  body?: any;
}

// 2. API Gateway
interface APIGateway {
  rateLimiting: {
    provider: 'Redis';
    limits: RateLimits;
  };
  authentication: {
    provider: 'JWT';
    validation: 'Fastify hooks';
  };
  routing: {
    pattern: '5-tier hierarchy';
    versioning: 'URL-based';
  };
}

// 3. Business Logic
interface BusinessLogic {
  validation: {
    schema: 'TypeBox';
    rules: 'Custom validators';
  };
  authorization: {
    pattern: 'RBAC + ABAC';
    caching: 'Redis';
  };
  processing: {
    transactions: 'Database';
    events: 'Event bus';
  };
}

// 4. Data Access
interface DataAccess {
  orm: {
    provider: 'Prisma';
    patterns: 'Repository';
  };
  caching: {
    strategy: 'Cache-aside';
    invalidation: 'Event-based';
  };
  optimization: {
    queries: 'Batching';
    connections: 'Pooling';
  };
}
```

### Event-Driven Architecture

```typescript
interface EventSystem {
  bus: {
    provider: 'Redis Pub/Sub';
    patterns: ['publish-subscribe', 'request-reply'];
  };
  events: {
    naming: 'domain.entity.action';
    schema: 'JSON Schema';
    versioning: 'Semantic';
  };
  handlers: {
    sync: 'In-process';
    async: 'Queue workers';
    retry: 'Exponential backoff';
  };
}

// Event examples
const events = {
  'user.profile.updated': UserProfileUpdatedEvent,
  'booking.status.changed': BookingStatusChangedEvent,
  'payment.completed': PaymentCompletedEvent,
  'tenant.subscription.expired': TenantSubscriptionExpiredEvent,
};
```

## Caching Architecture

### Multi-Layer Caching

```typescript
interface CachingLayers {
  browser: {
    strategy: 'Cache-Control headers';
    duration: 'Content-dependent';
  };
  cdn: {
    provider: 'CloudFlare';
    strategy: 'Edge caching';
    purging: 'Tag-based';
  };
  application: {
    nextjs: {
      dataCache: 'Automatic';
      fullRoute: 'ISR/SSG';
      client: 'TanStack Query';
    };
    api: {
      redis: 'Shared cache';
      memory: 'LRU in-process';
    };
  };
  database: {
    queryCache: 'PostgreSQL';
    connectionPool: 'PgBouncer';
  };
}
```

### Cache Invalidation

```typescript
interface CacheInvalidation {
  strategies: {
    ttl: 'Time-based expiry';
    event: 'Event-driven invalidation';
    tag: 'Tag-based invalidation';
    manual: 'Explicit invalidation';
  };
  patterns: {
    writeThrough: 'Update cache on write';
    writeBehind: 'Async cache update';
    cacheAside: 'Lazy loading';
  };
}

// Invalidation example
async function invalidateUserCache(userId: string, tenantId: string) {
  // Clear all cache layers
  await Promise.all([
    // Redis cache
    redis.del(`tenant:${tenantId}:user:${userId}:*`),
    // CDN cache
    cloudflare.purgeTag(`user-${userId}`),
    // Client cache
    broadcastInvalidation(`user.${userId}`),
  ]);
}
```

## Security Architecture

### Defense in Depth

```typescript
interface SecurityLayers {
  network: {
    waf: 'CloudFlare WAF';
    ddos: 'Rate limiting';
    ssl: 'TLS 1.3';
  };
  application: {
    authentication: 'JWT + MFA';
    authorization: 'RBAC + ABAC';
    validation: 'Input sanitization';
    csrf: 'Double submit tokens';
  };
  data: {
    encryption: {
      atRest: 'AES-256';
      inTransit: 'TLS';
      keys: 'AWS KMS';
    };
    masking: 'PII protection';
    audit: 'Complete trail';
  };
}
```

### Authentication Flow

```typescript
// 1. Login request
POST /api/v1/public/auth/login
{
  email: string;
  password: string;
  mfaCode?: string;
}

// 2. Verification
async function verifyCredentials(credentials) {
  const user = await findUser(credentials.email);
  const valid = await bcrypt.compare(credentials.password, user.hash);
  
  if (user.mfaEnabled) {
    const mfaValid = await verifyMFA(user, credentials.mfaCode);
    if (!mfaValid) throw new Error('Invalid MFA');
  }
  
  return user;
}

// 3. Token generation
function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { sub: user.id, tenant: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = generateRefreshToken();
  
  return { accessToken, refreshToken };
}

// 4. Session management
async function createSession(user: User, tokens: Tokens) {
  const session = await redis.setex(
    `session:${tokens.refreshToken}`,
    86400, // 24 hours
    JSON.stringify({
      userId: user.id,
      tenantId: user.tenantId,
      permissions: await getUserPermissions(user),
    })
  );
  
  return session;
}
```

## Deployment Architecture

### Container Strategy

```yaml
# Docker Compose for development
version: '3.8'
services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001
    
  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### Kubernetes Architecture

```yaml
# Production deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
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
        image: itellico/web:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Monitoring & Observability

### Monitoring Stack

```typescript
interface MonitoringStack {
  metrics: {
    collector: 'Prometheus';
    storage: 'VictoriaMetrics';
    visualization: 'Grafana';
  };
  logs: {
    aggregation: 'Loki';
    shipping: 'Promtail';
    analysis: 'Grafana';
  };
  traces: {
    collection: 'OpenTelemetry';
    storage: 'Tempo';
    analysis: 'Grafana';
  };
  alerts: {
    manager: 'AlertManager';
    channels: ['email', 'slack', 'pagerduty'];
  };
}
```

### Key Metrics

```typescript
interface KeyMetrics {
  business: {
    activeUsers: 'Daily/Monthly active';
    revenue: 'MRR, ARR, churn';
    conversion: 'Signup, activation, retention';
  };
  application: {
    latency: 'p50, p95, p99';
    throughput: 'Requests per second';
    errors: 'Error rate by type';
    saturation: 'CPU, memory, connections';
  };
  infrastructure: {
    availability: 'Uptime percentage';
    capacity: 'Resource utilization';
    cost: 'Per tenant, per service';
  };
}
```

## Scalability Patterns

### Horizontal Scaling

```typescript
interface ScalingStrategy {
  web: {
    strategy: 'Auto-scaling groups';
    metric: 'CPU + request rate';
    min: 2;
    max: 20;
  };
  api: {
    strategy: 'Kubernetes HPA';
    metric: 'Custom metrics';
    min: 3;
    max: 50;
  };
  database: {
    read: 'Read replicas';
    write: 'Connection pooling';
    sharding: 'By tenant ID';
  };
  cache: {
    strategy: 'Redis Cluster';
    sharding: 'Consistent hashing';
  };
}
```

### Performance Optimization

```typescript
interface PerformanceOptimizations {
  frontend: {
    bundling: 'Code splitting';
    loading: 'Progressive enhancement';
    rendering: 'Streaming SSR';
    caching: 'Service worker';
  };
  backend: {
    queries: 'Query optimization';
    caching: 'Result caching';
    batching: 'DataLoader pattern';
    pooling: 'Connection reuse';
  };
  infrastructure: {
    cdn: 'Edge caching';
    compression: 'Brotli/gzip';
    http2: 'Multiplexing';
  };
}
```

## Disaster Recovery

### Backup Strategy

```typescript
interface BackupStrategy {
  database: {
    frequency: 'Continuous WAL';
    retention: '30 days';
    testing: 'Weekly restore test';
  };
  files: {
    sync: 'Real-time to S3';
    versioning: 'Enabled';
    replication: 'Cross-region';
  };
  configuration: {
    vcs: 'Git';
    secrets: 'Vault backup';
    infrastructure: 'Terraform state';
  };
}
```

### Recovery Procedures

```typescript
interface RecoveryProcedures {
  rto: '< 1 hour'; // Recovery Time Objective
  rpo: '< 5 minutes'; // Recovery Point Objective
  
  procedures: {
    database: 'Point-in-time recovery';
    application: 'Blue-green deployment';
    data: 'Incremental restore';
    verification: 'Automated testing';
  };
}
```

## Best Practices

1. **Design for failure**: Assume components will fail
2. **Stateless services**: Enable easy scaling
3. **Async by default**: Use queues for heavy operations
4. **Cache aggressively**: But invalidate smartly
5. **Monitor everything**: Observability is key
6. **Document decisions**: ADRs for architecture
7. **Security first**: Defense in depth
8. **Test continuously**: Load, stress, chaos

## Related Documentation

- [API Design](/architecture/api-design)
- [Data Models](/architecture/data-models)
- [Security Architecture](/architecture/security)
- [Performance Guide](/architecture/performance)