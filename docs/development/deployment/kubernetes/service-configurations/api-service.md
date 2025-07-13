# Backend API (Fastify) Configuration

The Fastify API service is the backend of the itellico Mono platform, providing RESTful endpoints for all operations. This service runs on port 3001 and handles all business logic, database operations, and external integrations.

## Kubernetes Manifests

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: itellico-mono
  labels:
    app: api
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: api
        tier: backend
        database-access: "true"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9091"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: itellico-api
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api
              topologyKey: kubernetes.io/hostname
      containers:
      - name: api
        image: registry.hetzner.com/itellico/api:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
          protocol: TCP
        - containerPort: 9091
          name: metrics
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-refresh-secret
        - name: CORS_ORIGINS
          value: "https://app.itellico.com,https://itellico.com"
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: rabbitmq-url
        - name: TEMPORAL_ADDRESS
          value: "temporal:7233"
        - name: TEMPORAL_NAMESPACE
          value: "default"
        - name: S3_ENDPOINT
          value: "https://eu-central-1.s3.hetzner.com"
        - name: S3_BUCKET
          value: "itellico-uploads"
        - name: S3_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: s3-access-key
        - name: S3_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: s3-secret-key
        - name: MAIL_HOST
          value: "mailpit"
        - name: MAIL_PORT
          value: "1025"
        - name: LOG_LEVEL
          value: "info"
        - name: ENABLE_SWAGGER
          value: "true"
        - name: ENABLE_METRICS
          value: "true"
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: "http://otel-collector:4317"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: config
        configMap:
          name: api-config
      - name: tmp
        emptyDir: {}
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: itellico-mono
  labels:
    app: api
    tier: backend
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: 3001
    protocol: TCP
    name: http
  - port: 9091
    targetPort: 9091
    protocol: TCP
    name: metrics
  selector:
    app: api
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: itellico-mono
data:
  production.json: |
    {
      "server": {
        "host": "0.0.0.0",
        "port": 3001,
        "logger": {
          "level": "info",
          "prettyPrint": false
        },
        "bodyLimit": 10485760,
        "trustProxy": true
      },
      "swagger": {
        "enabled": true,
        "host": "api.itellico.com",
        "schemes": ["https"],
        "info": {
          "title": "itellico Mono API",
          "version": "1.0.0"
        }
      },
      "rateLimit": {
        "global": {
          "max": 100,
          "timeWindow": "1 minute"
        },
        "auth": {
          "max": 5,
          "timeWindow": "15 minutes"
        }
      },
      "cache": {
        "ttl": 300,
        "max": 1000,
        "checkperiod": 60
      },
      "upload": {
        "maxFileSize": 52428800,
        "allowedMimeTypes": [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "video/mp4",
          "video/quicktime"
        ]
      }
    }
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: itellico-mono
type: Opaque
stringData:
  database-url: "postgresql://developer:password@postgresql:5432/mono?schema=public"
  redis-url: "redis://redis:6379/0"
  jwt-secret: "your-super-secret-jwt-key-change-this-in-production"
  jwt-refresh-secret: "your-super-secret-refresh-key-change-this-in-production"
  rabbitmq-url: "amqp://admin:admin123@rabbitmq:5672"
  s3-access-key: "your-s3-access-key"
  s3-secret-key: "your-s3-secret-key"
  mailgun-api-key: "your-mailgun-api-key"
  mailgun-domain: "mg.itellico.com"
  stripe-secret-key: "your-stripe-secret-key"
  stripe-webhook-secret: "your-stripe-webhook-secret"
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: itellico-mono
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
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
      selectPolicy: Max
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: itellico-mono
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.itellico.com,https://itellico.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.itellico.com
    secretName: api-tls
  rules:
  - host: api.itellico.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 3001
```

### Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: itellico-mono
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 3001
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9091
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to:
    - podSelector:
        matchLabels:
          app: rabbitmq
    ports:
    - protocol: TCP
      port: 5672
  - to:
    - podSelector:
        matchLabels:
          app: temporal
    ports:
    - protocol: TCP
      port: 7233
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # External HTTPS
```

### ServiceMonitor for Prometheus

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-metrics
  namespace: itellico-mono
  labels:
    app: api
spec:
  selector:
    matchLabels:
      app: api
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
    relabelings:
    - sourceLabels: [__meta_kubernetes_pod_name]
      targetLabel: pod
    - sourceLabels: [__meta_kubernetes_pod_node_name]
      targetLabel: node
```

### PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
  namespace: itellico-mono
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api
```

## Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001 9091

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/src/server.js"]
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Build and Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - '.github/workflows/api.yml'

env:
  REGISTRY: registry.hetzner.com
  IMAGE_NAME: itellico/api

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./apps/api
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v4
      with:
        namespace: itellico-mono
        manifests: |
          kubernetes/applications/api/deployment.yaml
        images: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

## Monitoring and Alerts

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "API Service Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{app=\"api\"}[5m])) by (status_code)"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{app=\"api\"}[5m])) by (le))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{app=\"api\",status_code=~\"5..\"}[5m]))"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total{pod=~\"api-.*\"}[5m])) by (pod)"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "sum(container_memory_working_set_bytes{pod=~\"api-.*\"}) by (pod)"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "prisma_pool_connections_open{app=\"api\"}"
          }
        ]
      }
    ]
  }
}
```

### Prometheus Alerts

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-alerts
  namespace: itellico-mono
spec:
  groups:
  - name: api
    interval: 30s
    rules:
    - alert: APIHighErrorRate
      expr: |
        sum(rate(http_requests_total{app="api",status_code=~"5.."}[5m])) > 0.05
      for: 5m
      labels:
        severity: critical
        service: api
      annotations:
        summary: "High error rate on API service"
        description: "API service is returning 5xx errors at {{ $value | humanizePercentage }} rate"
    
    - alert: APIHighLatency
      expr: |
        histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{app="api"}[5m])) by (le)) > 1
      for: 5m
      labels:
        severity: warning
        service: api
      annotations:
        summary: "High latency on API service"
        description: "95th percentile latency is {{ $value }}s"
    
    - alert: APIPodCrashLooping
      expr: |
        rate(kube_pod_container_status_restarts_total{namespace="itellico-mono",pod=~"api-.*"}[5m]) > 0
      for: 5m
      labels:
        severity: critical
        service: api
      annotations:
        summary: "API pod is crash looping"
        description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last 5 minutes"
    
    - alert: APIHighMemoryUsage
      expr: |
        sum(container_memory_working_set_bytes{pod=~"api-.*"}) by (pod) / sum(kube_pod_container_resource_limits{pod=~"api-.*",resource="memory"}) by (pod) > 0.9
      for: 5m
      labels:
        severity: warning
        service: api
      annotations:
        summary: "API pod high memory usage"
        description: "Pod {{ $labels.pod }} is using {{ $value | humanizePercentage }} of its memory limit"
```

## Performance Optimization

### 1. Connection Pooling

Configure Prisma with proper connection pooling:

```typescript
// prisma.config.ts
export const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  pool: {
    min: 5,
    max: 20,
    idleTimeout: 60,
    connectionTimeout: 10,
  },
};
```

### 2. Redis Caching Strategy

```typescript
// cache.config.ts
export const cacheConfig = {
  defaultTTL: 300, // 5 minutes
  strategies: {
    user: { ttl: 3600 }, // 1 hour
    tenant: { ttl: 7200 }, // 2 hours
    permissions: { ttl: 1800 }, // 30 minutes
    config: { ttl: 86400 }, // 24 hours
  },
};
```

### 3. Request Compression

```yaml
# Add to Ingress annotations
nginx.ingress.kubernetes.io/server-snippet: |
  gzip on;
  gzip_types text/plain application/json application/javascript text/css;
  gzip_min_length 1000;
  gzip_proxied any;
  gzip_comp_level 6;
```

## Troubleshooting

### Common Issues

1. **Database Connection Timeouts**
   ```bash
   kubectl logs -n itellico-mono deployment/api | grep "database"
   kubectl exec -n itellico-mono deployment/api -- nslookup postgresql
   ```

2. **High Memory Usage**
   ```bash
   kubectl top pods -n itellico-mono -l app=api
   kubectl describe pod -n itellico-mono -l app=api
   ```

3. **Slow Response Times**
   ```bash
   kubectl exec -n itellico-mono deployment/api -- curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health
   ```

4. **Authentication Issues**
   ```bash
   kubectl exec -n itellico-mono deployment/api -- env | grep JWT
   kubectl logs -n itellico-mono deployment/api | grep "auth"
   ```