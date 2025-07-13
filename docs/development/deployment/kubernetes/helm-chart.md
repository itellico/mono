# Helm Chart for itellico Mono

This document describes the Helm chart structure for deploying the complete itellico Mono platform.

## Chart Structure

```
helm/itellico-mono/
├── Chart.yaml
├── values.yaml
├── values.dev.yaml
├── values.staging.yaml
├── values.prod.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmaps/
│   │   ├── api-config.yaml
│   │   ├── frontend-config.yaml
│   │   └── monitoring-config.yaml
│   ├── databases/
│   │   ├── postgresql.yaml
│   │   ├── redis.yaml
│   │   └── backup-cronjob.yaml
│   ├── applications/
│   │   ├── api.yaml
│   │   ├── frontend.yaml
│   │   └── docs.yaml
│   ├── messaging/
│   │   └── rabbitmq.yaml
│   ├── monitoring/
│   │   ├── prometheus.yaml
│   │   ├── grafana.yaml
│   │   └── exporters.yaml
│   ├── workflow/
│   │   ├── temporal.yaml
│   │   └── n8n.yaml
│   ├── ingress/
│   │   └── ingress.yaml
│   └── network-policies/
│       └── default.yaml
└── charts/
    └── dependencies/
```

## Chart.yaml

```yaml
apiVersion: v2
name: itellico-mono
description: A comprehensive Helm chart for deploying the itellico Mono platform
type: application
version: 1.0.0
appVersion: "1.0.0"
home: https://itellico.com
sources:
  - https://github.com/itellico/mono
maintainers:
  - name: itellico Team
    email: devops@itellico.com
dependencies:
  - name: postgresql
    version: "13.2.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.4.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
  - name: rabbitmq
    version: "12.5.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: rabbitmq.enabled
  - name: prometheus
    version: "25.8.x"
    repository: "https://prometheus-community.github.io/helm-charts"
    condition: monitoring.prometheus.enabled
  - name: grafana
    version: "7.0.x"
    repository: "https://grafana.github.io/helm-charts"
    condition: monitoring.grafana.enabled
keywords:
  - saas
  - platform
  - multi-tenant
  - kubernetes
  - microservices
```

## values.yaml (Default Values)

```yaml
# Global settings
global:
  imageRegistry: registry.hetzner.com
  imagePullSecrets:
    - name: regcred
  storageClass: hcloud-ssd
  domain: itellico.com
  environment: production

# Namespace configuration
namespace:
  create: true
  name: itellico-mono

# Database configurations
postgresql:
  enabled: true
  auth:
    username: developer
    password: "" # Set via secrets
    database: mono
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: hcloud-ssd-retain
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true

redis:
  enabled: true
  auth:
    enabled: true
    password: "" # Set via secrets
  master:
    persistence:
      enabled: true
      size: 10Gi
  replica:
    replicaCount: 2
    persistence:
      enabled: true
      size: 10Gi
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true

# Application configurations
api:
  enabled: true
  replicaCount: 3
  image:
    repository: itellico/api
    tag: latest
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 3001
  ingress:
    enabled: true
    hostname: api.itellico.com
    tls: true
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "2Gi"
      cpu: "1000m"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
  env:
    NODE_ENV: production
    LOG_LEVEL: info
  secrets:
    jwt:
      secret: "" # Set via secrets
      refreshSecret: "" # Set via secrets
    database:
      url: "" # Constructed from postgresql values
    redis:
      url: "" # Constructed from redis values

frontend:
  enabled: true
  replicaCount: 3
  image:
    repository: itellico/frontend
    tag: latest
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 3000
  ingress:
    enabled: true
    hostname: app.itellico.com
    tls: true
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "1Gi"
      cpu: "500m"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 15
    targetCPUUtilizationPercentage: 70
  env:
    NEXT_PUBLIC_API_URL: https://api.itellico.com
    NEXTAUTH_URL: https://app.itellico.com

docs:
  enabled: true
  replicaCount: 2
  image:
    repository: itellico/docs
    tag: latest
  service:
    type: ClusterIP
    port: 3005
  ingress:
    enabled: true
    hostname: docs.itellico.com
    tls: true
  resources:
    requests:
      memory: "128Mi"
      cpu: "50m"
    limits:
      memory: "512Mi"
      cpu: "200m"

# Message queue
rabbitmq:
  enabled: true
  auth:
    username: admin
    password: "" # Set via secrets
  persistence:
    enabled: true
    size: 20Gi
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
  ingress:
    enabled: true
    hostname: rabbitmq.itellico.com
    tls: true

# Monitoring stack
monitoring:
  enabled: true
  prometheus:
    enabled: true
    retention: 30d
    persistentVolume:
      enabled: true
      size: 50Gi
    serviceMonitor:
      enabled: true
  grafana:
    enabled: true
    adminPassword: "" # Set via secrets
    persistence:
      enabled: true
      size: 10Gi
    ingress:
      enabled: true
      hostname: grafana.itellico.com
      tls: true
  exporters:
    node:
      enabled: true
    postgres:
      enabled: true

# Workflow engines
temporal:
  enabled: true
  server:
    replicaCount: 1
    image:
      repository: temporalio/server
      tag: 1.22.4
  web:
    enabled: true
    replicaCount: 1
    ingress:
      enabled: true
      hostname: temporal.itellico.com
      tls: true

n8n:
  enabled: true
  replicaCount: 1
  image:
    repository: n8nio/n8n
    tag: latest
  persistence:
    enabled: true
    size: 10Gi
  ingress:
    enabled: true
    hostname: n8n.itellico.com
    tls: true
  auth:
    enabled: true
    username: admin
    password: "" # Set via secrets

# Development tools
mailpit:
  enabled: true
  image:
    repository: axllent/mailpit
    tag: latest
  persistence:
    enabled: false
  service:
    smtp:
      port: 1025
    web:
      port: 8025

redisInsight:
  enabled: false # Disabled in production
  image:
    repository: redislabs/redisinsight
    tag: latest

# Ingress configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

# Network policies
networkPolicies:
  enabled: true
  defaultDenyIngress: true
  allowInternalTraffic: true

# Backup configuration
backup:
  enabled: true
  schedule: "0 2 * * *" # Daily at 2 AM
  retention: 30 # days
  s3:
    endpoint: https://eu-central-1.s3.hetzner.com
    bucket: itellico-backups
    accessKey: "" # Set via secrets
    secretKey: "" # Set via secrets

# Security settings
security:
  podSecurityPolicy:
    enabled: true
  networkPolicy:
    enabled: true
  serviceAccount:
    create: true
```

## values.prod.yaml (Production Overrides)

```yaml
# Production-specific values
global:
  environment: production
  domain: itellico.com

# Increased replicas for production
api:
  replicaCount: 5
  autoscaling:
    minReplicas: 5
    maxReplicas: 30

frontend:
  replicaCount: 5
  autoscaling:
    minReplicas: 5
    maxReplicas: 20

# Production database settings
postgresql:
  architecture: replication
  primary:
    persistence:
      size: 200Gi
  readReplicas:
    replicaCount: 2
    persistence:
      size: 200Gi

redis:
  replica:
    replicaCount: 3

# Enable all monitoring
monitoring:
  prometheus:
    retention: 90d
    persistentVolume:
      size: 100Gi
  alertmanager:
    enabled: true
    config:
      receivers:
        - name: 'slack'
          slack_configs:
            - api_url: '${SLACK_WEBHOOK_URL}'
              channel: '#alerts-prod'

# Production backups
backup:
  enabled: true
  schedule: "0 */6 * * *" # Every 6 hours
  retention: 90 # days
  snapshots:
    enabled: true
    schedule: "0 1 * * *" # Daily at 1 AM

# Stricter security
security:
  podSecurityPolicy:
    enabled: true
    runAsNonRoot: true
    readOnlyRootFilesystem: true
  networkPolicy:
    enabled: true
    allowedNamespaces:
      - ingress-nginx
      - monitoring
      - cert-manager
```

## Installation

### 1. Add Helm repositories

```bash
# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 2. Create secrets

```bash
# Create namespace
kubectl create namespace itellico-mono

# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.hetzner.com \
  --docker-username=$REGISTRY_USERNAME \
  --docker-password=$REGISTRY_PASSWORD \
  --docker-email=$REGISTRY_EMAIL \
  -n itellico-mono

# Create application secrets
kubectl create secret generic itellico-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 32) \
  --from-literal=postgres-password=$(openssl rand -base64 20) \
  --from-literal=redis-password=$(openssl rand -base64 20) \
  --from-literal=rabbitmq-password=$(openssl rand -base64 20) \
  --from-literal=grafana-password=$(openssl rand -base64 20) \
  --from-literal=n8n-password=$(openssl rand -base64 20) \
  --from-literal=s3-access-key=$S3_ACCESS_KEY \
  --from-literal=s3-secret-key=$S3_SECRET_KEY \
  -n itellico-mono
```

### 3. Install the chart

```bash
# Install with default values
helm install itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --create-namespace

# Install with production values
helm install itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --create-namespace \
  --values ./helm/itellico-mono/values.prod.yaml \
  --set global.domain=yourdomain.com \
  --set postgresql.auth.password=$POSTGRES_PASSWORD \
  --set redis.auth.password=$REDIS_PASSWORD

# Dry run to preview
helm install itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --create-namespace \
  --values ./helm/itellico-mono/values.prod.yaml \
  --dry-run --debug
```

### 4. Upgrade the chart

```bash
# Upgrade with new values
helm upgrade itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --values ./helm/itellico-mono/values.prod.yaml \
  --set api.image.tag=v1.2.0

# Rollback if needed
helm rollback itellico-mono 1 -n itellico-mono
```

## Helm Templates

### _helpers.tpl

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "itellico-mono.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "itellico-mono.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "itellico-mono.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "itellico-mono.labels" -}}
helm.sh/chart: {{ include "itellico-mono.chart" . }}
{{ include "itellico-mono.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "itellico-mono.selectorLabels" -}}
app.kubernetes.io/name: {{ include "itellico-mono.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "itellico-mono.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "itellico-mono.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create database URL
*/}}
{{- define "itellico-mono.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s-postgresql:%d/%s?schema=public" .Values.postgresql.auth.username .Values.postgresql.auth.password .Release.Name .Values.postgresql.primary.service.ports.postgresql .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.api.secrets.database.url }}
{{- end }}
{{- end }}

{{/*
Create Redis URL
*/}}
{{- define "itellico-mono.redisUrl" -}}
{{- if .Values.redis.enabled }}
{{- printf "redis://:%s@%s-redis-master:%d/0" .Values.redis.auth.password .Release.Name .Values.redis.master.service.ports.redis }}
{{- else }}
{{- .Values.api.secrets.redis.url }}
{{- end }}
{{- end }}
```

## Monitoring and Operations

### View deployment status

```bash
# Check all resources
helm status itellico-mono -n itellico-mono

# List all resources
kubectl get all -n itellico-mono

# Check pod status
kubectl get pods -n itellico-mono

# View logs
kubectl logs -n itellico-mono -l app=api --tail=100 -f
```

### Access services

```bash
# Port forward to access services locally
kubectl port-forward -n itellico-mono svc/api 3001:3001
kubectl port-forward -n itellico-mono svc/frontend 3000:3000
kubectl port-forward -n itellico-mono svc/grafana 3006:80

# Get ingress endpoints
kubectl get ingress -n itellico-mono
```

### Backup and restore

```bash
# Trigger manual backup
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%Y%m%d-%H%M%S) -n itellico-mono

# List backups
kubectl exec -n itellico-mono deployment/api -- aws s3 ls s3://itellico-backups/

# Restore from backup (see PostgreSQL configuration for detailed steps)
```

## Troubleshooting

### Common issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n itellico-mono
   kubectl logs <pod-name> -n itellico-mono --previous
   ```

2. **Service connection issues**
   ```bash
   kubectl exec -n itellico-mono deployment/api -- nslookup postgresql
   kubectl exec -n itellico-mono deployment/api -- nc -zv postgresql 5432
   ```

3. **Ingress not working**
   ```bash
   kubectl describe ingress -n itellico-mono
   kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
   ```

4. **Volume mount issues**
   ```bash
   kubectl get pvc -n itellico-mono
   kubectl describe pvc <pvc-name> -n itellico-mono
   ```

### Debug mode

Enable debug mode for troubleshooting:

```bash
helm upgrade itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --set api.env.LOG_LEVEL=debug \
  --set frontend.env.NODE_ENV=development
```

## Best Practices

1. **Always use specific image tags** in production, not `latest`
2. **Set resource limits** to prevent resource exhaustion
3. **Enable autoscaling** for production workloads
4. **Use separate values files** for different environments
5. **Encrypt secrets** using Sealed Secrets or similar
6. **Regular backups** with tested restore procedures
7. **Monitor all services** with appropriate alerts
8. **Use network policies** to restrict traffic
9. **Keep Helm charts** in version control
10. **Document all customizations** and operational procedures