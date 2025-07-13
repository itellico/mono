# Service Configuration Details

This section provides detailed Kubernetes configurations for each service in the itellico Mono platform.

## Service List

### Core Services
- [PostgreSQL Database](./postgresql.md)
- [Redis Cache](./redis.md)
- [Backend API (Fastify)](./api-service.md) - RESTful API backend service on port 3001
- [Frontend (Next.js)](./frontend-service.md) - Web application frontend on port 3000

### Message Queue
- [RabbitMQ](./rabbitmq.md)

### Monitoring Stack
- [Prometheus](./prometheus.md)
- [Grafana](./grafana.md)
- [Exporters](./exporters.md)

### Workflow Services
- [Temporal](./temporal.md)
- [N8N](./n8n.md)

### Supporting Services
- [Mailpit](./mailpit.md)
- [Documentation Site](./docs-site.md)
- [RedisInsight](./redis-insight.md)

## Configuration Structure

Each service configuration includes:

1. **Deployment/StatefulSet**: Main workload definition
2. **Service**: Internal service exposure
3. **ConfigMap**: Configuration files
4. **Secret**: Sensitive configuration
5. **PersistentVolumeClaim**: Storage requirements
6. **Ingress**: External access configuration
7. **HorizontalPodAutoscaler**: Auto-scaling rules
8. **NetworkPolicy**: Network access rules
9. **ServiceMonitor**: Prometheus monitoring

## Environment-Specific Values

Use Helm values files for different environments:

- `values.dev.yaml`: Development environment
- `values.staging.yaml`: Staging environment
- `values.prod.yaml`: Production environment

## Quick Deployment

Deploy all services with:

```bash
# Using kubectl
kubectl apply -k kubernetes/

# Using Helm
helm install itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --create-namespace \
  --values ./helm/itellico-mono/values.prod.yaml
```