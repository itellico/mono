# Frontend (Next.js) Configuration

The Next.js application serves as the frontend of the itellico Mono platform, providing the user interface and client-side functionality. This service runs on port 3000 and communicates with the Fastify backend API.

## Kubernetes Manifests

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: itellico-mono
  labels:
    app: frontend
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: frontend
        tier: frontend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/api/metrics"
    spec:
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
                  - frontend
              topologyKey: kubernetes.io/hostname
      containers:
      - name: frontend
        image: registry.hetzner.com/itellico/frontend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.itellico.com"
        - name: NEXTAUTH_URL
          value: "https://app.itellico.com"
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: frontend-secrets
              key: nextauth-secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: frontend-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: frontend-secrets
              key: redis-url
        - name: NEXT_PUBLIC_APP_URL
          value: "https://app.itellico.com"
        - name: NEXT_PUBLIC_SITE_NAME
          value: "itellico Mono"
        - name: NEXT_PUBLIC_FEATURES_FLAGS
          value: '{"darkMode":true,"multiTenant":true,"aiFeatures":true}'
        - name: NEXT_TELEMETRY_DISABLED
          value: "1"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /api/health
            port: http
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
        volumeMounts:
        - name: cache
          mountPath: /.next/cache
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: cache
        emptyDir: {}
      - name: tmp
        emptyDir: {}
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: itellico-mono
  labels:
    app: frontend
    tier: frontend
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: frontend
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
  name: frontend-config
  namespace: itellico-mono
data:
  runtime-config.js: |
    window.__RUNTIME_CONFIG__ = {
      apiUrl: 'https://api.itellico.com',
      appUrl: 'https://app.itellico.com',
      environment: 'production',
      features: {
        darkMode: true,
        multiTenant: true,
        aiFeatures: true,
        analytics: true
      },
      monitoring: {
        sentryDsn: '${SENTRY_DSN}',
        googleAnalytics: '${GA_TRACKING_ID}'
      }
    };
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: frontend-secrets
  namespace: itellico-mono
type: Opaque
stringData:
  nextauth-secret: "your-nextauth-secret-change-this-in-production"
  database-url: "postgresql://developer:password@postgresql:5432/mono?schema=public"
  redis-url: "redis://redis:6379/0"
  google-client-id: "your-google-oauth-client-id"
  google-client-secret: "your-google-oauth-client-secret"
  github-client-id: "your-github-oauth-client-id"
  github-client-secret: "your-github-oauth-client-secret"
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: itellico-mono
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 15
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 1
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  namespace: itellico-mono
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/server-snippet: |
      # Security headers
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
      add_header Content-Security-Policy "default-src 'self' https://api.itellico.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
      
      # Compression
      gzip on;
      gzip_types text/plain application/json application/javascript text/css text/xml application/xml;
      gzip_min_length 1000;
      gzip_proxied any;
      gzip_comp_level 6;
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.itellico.com
    - itellico.com
    - www.itellico.com
    secretName: frontend-tls
  rules:
  - host: app.itellico.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
  - host: itellico.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
  - host: www.itellico.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

### Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-network-policy
  namespace: itellico-mono
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 3001
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
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
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

### PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: frontend-pdb
  namespace: itellico-mono
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: frontend
```

## Dockerfile

```dockerfile
# Dependencies stage
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Next.js standalone server
CMD ["node", "server.js"]
```

## next.config.js Configuration

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['cdn.itellico.com', 's3.eu-central-1.amazonaws.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for canvas module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Build and Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - '.github/workflows/frontend.yml'

env:
  REGISTRY: registry.hetzner.com
  IMAGE_NAME: itellico/frontend

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
        context: ./apps/web
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          NEXT_PUBLIC_API_URL=${{ vars.NEXT_PUBLIC_API_URL }}
    
    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v4
      with:
        namespace: itellico-mono
        manifests: |
          kubernetes/applications/frontend/deployment.yaml
        images: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

## Performance Optimization

### 1. Image Optimization

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL={generateBlurDataURL()}
      loading="lazy"
      {...props}
    />
  );
}
```

### 2. Static Generation

```typescript
// pages/[slug].tsx
export async function getStaticProps({ params }) {
  const data = await fetchPageData(params.slug);
  
  return {
    props: { data },
    revalidate: 60, // ISR - revalidate every minute
  };
}

export async function getStaticPaths() {
  const paths = await fetchAllPaths();
  
  return {
    paths,
    fallback: 'blocking', // Generate missing pages on-demand
  };
}
```

### 3. Bundle Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react'],
  },
  
  // Split chunks for better caching
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    };
    return config;
  },
};
```

## Monitoring

### Custom Metrics Endpoint

```typescript
// pages/api/metrics.ts
import { register } from 'prom-client';

export default async function handler(req, res) {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
}
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Frontend Monitoring",
    "panels": [
      {
        "title": "Page Views",
        "targets": [
          {
            "expr": "sum(rate(nextjs_page_views_total[5m])) by (path)"
          }
        ]
      },
      {
        "title": "Core Web Vitals",
        "targets": [
          {
            "expr": "histogram_quantile(0.75, sum(rate(nextjs_web_vitals_bucket[5m])) by (metric, le))"
          }
        ]
      },
      {
        "title": "API Response Times",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(nextjs_api_duration_seconds_bucket[5m])) by (le))"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   kubectl logs -n itellico-mono job/frontend-build
   
   # Verify environment variables
   kubectl exec -n itellico-mono deployment/frontend -- env | grep NEXT_
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   kubectl top pods -n itellico-mono -l app=frontend
   
   # Increase memory limits if needed
   kubectl set resources deployment/frontend -n itellico-mono --limits=memory=2Gi
   ```

3. **Static Asset Issues**
   ```bash
   # Check if assets are being served
   kubectl exec -n itellico-mono deployment/frontend -- ls -la .next/static
   
   # Verify CDN configuration
   kubectl exec -n itellico-mono deployment/frontend -- curl -I https://cdn.itellico.com/_next/static/css/main.css
   ```

4. **SSR Errors**
   ```bash
   # Check server-side rendering errors
   kubectl logs -n itellico-mono deployment/frontend | grep -i error
   
   # Enable debug mode
   kubectl set env deployment/frontend -n itellico-mono NODE_OPTIONS="--inspect"
   ```

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.itellico.com
NEXT_PUBLIC_APP_URL=https://app.itellico.com
NEXTAUTH_URL=https://app.itellico.com
NEXTAUTH_SECRET=<secure-random-string>

# Database (for NextAuth)
DATABASE_URL=postgresql://developer:password@postgresql:5432/mono

# Redis (for session storage)
REDIS_URL=redis://redis:6379

# OAuth Providers
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>

# Analytics & Monitoring
NEXT_PUBLIC_GA_ID=<google-analytics-id>
SENTRY_DSN=<sentry-dsn>
SENTRY_AUTH_TOKEN=<sentry-auth-token>

# Feature Flags
NEXT_PUBLIC_FEATURES_FLAGS='{"darkMode":true,"multiTenant":true}'
```

## Security Best Practices

1. **Content Security Policy**: Configured in Ingress annotations
2. **Environment Variables**: Never expose sensitive data in NEXT_PUBLIC_ vars
3. **Authentication**: Use HTTP-only cookies for auth tokens
4. **CORS**: Configure proper CORS headers in the API
5. **Rate Limiting**: Implemented at Ingress level
6. **SSL/TLS**: Enforced through Ingress configuration

## Caching Strategy

### CDN Configuration

```yaml
# Configure Cloudflare or similar CDN
Cache-Control headers:
- Static assets: public, max-age=31536000, immutable
- HTML pages: public, max-age=0, must-revalidate
- API routes: private, no-cache

# Example in next.config.js
async headers() {
  return [
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```