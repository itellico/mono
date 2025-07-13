# Kubernetes Quick Reference

## Essential Commands

### Cluster Management

```bash
# Create Hetzner Kubernetes cluster
hcloud k8s cluster create \
  --name itellico-mono \
  --version 1.29 \
  --location fsn1 \
  --network-zone eu-central

# Get kubeconfig
hcloud k8s cluster kubeconfig save itellico-mono

# Check cluster status
kubectl cluster-info
kubectl get nodes
```

### Deployment Commands

```bash
# Deploy using Helm
helm install itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --create-namespace \
  --values ./helm/itellico-mono/values.prod.yaml

# Update deployment
helm upgrade itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --values ./helm/itellico-mono/values.prod.yaml

# Check deployment status
kubectl get all -n itellico-mono
helm status itellico-mono -n itellico-mono
```

### Service URLs

After deployment, services are available at:

- **Frontend**: https://app.itellico.com
- **API**: https://api.itellico.com
- **Documentation**: https://docs.itellico.com
- **Grafana**: https://grafana.itellico.com
- **RabbitMQ**: https://rabbitmq.itellico.com
- **Temporal**: https://temporal.itellico.com
- **N8N**: https://n8n.itellico.com

### Monitoring

```bash
# View pod logs
kubectl logs -f deployment/api -n itellico-mono

# Check resource usage
kubectl top nodes
kubectl top pods -n itellico-mono

# Access Grafana locally
kubectl port-forward -n itellico-mono svc/grafana 3006:80
```

### Database Operations

```bash
# Connect to PostgreSQL
kubectl exec -it statefulset/postgresql -n itellico-mono -- psql -U developer -d mono

# Create database backup
kubectl exec statefulset/postgresql -n itellico-mono -- pg_dump -U developer mono | gzip > backup-$(date +%Y%m%d).sql.gz

# Run migrations
kubectl exec deployment/api -n itellico-mono -- pnpm prisma migrate deploy
```

### Troubleshooting

```bash
# Debug pod issues
kubectl describe pod <pod-name> -n itellico-mono
kubectl logs <pod-name> -n itellico-mono --previous

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n itellico-mono -- sh
# Inside the debug pod:
nc -zv postgresql 5432
nc -zv redis 6379
nc -zv api 3001

# Check ingress
kubectl describe ingress -n itellico-mono
kubectl get events -n itellico-mono --sort-by='.lastTimestamp'
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment api --replicas=10 -n itellico-mono

# Check HPA status
kubectl get hpa -n itellico-mono
kubectl describe hpa api-hpa -n itellico-mono

# Update HPA limits
kubectl patch hpa api-hpa -n itellico-mono --type='json' \
  -p='[{"op": "replace", "path": "/spec/maxReplicas", "value": 30}]'
```

### Secrets Management

```bash
# Create secrets
kubectl create secret generic api-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=database-url="postgresql://user:pass@postgresql:5432/mono" \
  -n itellico-mono

# Update secrets
kubectl create secret generic api-secrets \
  --from-literal=jwt-secret=new-secret \
  --dry-run=client -o yaml | kubectl apply -f -

# View secret (base64 encoded)
kubectl get secret api-secrets -n itellico-mono -o yaml
```

### Backup and Restore

```bash
# Trigger manual backup
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%Y%m%d) -n itellico-mono

# List backups in S3
kubectl exec deployment/api -n itellico-mono -- aws s3 ls s3://itellico-backups/postgres/

# Restore from backup
kubectl exec -i statefulset/postgresql -n itellico-mono -- psql -U developer postgres < backup.sql
```

### Rolling Updates

```bash
# Update image
kubectl set image deployment/api api=itellico/api:v2.0.0 -n itellico-mono

# Check rollout status
kubectl rollout status deployment/api -n itellico-mono

# Rollback if needed
kubectl rollout undo deployment/api -n itellico-mono

# View rollout history
kubectl rollout history deployment/api -n itellico-mono
```

### Cost Monitoring

```bash
# Check node pool sizes
hcloud k8s node-pool list --cluster-name itellico-mono

# Update node pool
hcloud k8s node-pool update general-purpose \
  --cluster-name itellico-mono \
  --min-nodes 2 \
  --max-nodes 8

# View resource requests/limits
kubectl describe resourcequota -n itellico-mono
```

## Environment Variables Reference

### API Service

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://developer:password@postgresql:5432/mono
REDIS_URL=redis://redis:6379
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
CORS_ORIGINS=https://app.itellico.com
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
TEMPORAL_ADDRESS=temporal:7233
S3_ENDPOINT=https://eu-central-1.s3.hetzner.com
S3_BUCKET=itellico-uploads
LOG_LEVEL=info
```

### Frontend Service

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.itellico.com
NEXTAUTH_URL=https://app.itellico.com
NEXTAUTH_SECRET=<secret>
```

## Service Dependencies

```mermaid
graph TD
    Frontend --> API
    Frontend --> Redis
    API --> PostgreSQL
    API --> Redis
    API --> RabbitMQ
    API --> Temporal
    API --> S3
    Temporal --> PostgreSQL
    N8N --> PostgreSQL
    Grafana --> Prometheus
    Prometheus --> All[All Services]
```

## Quick Health Checks

```bash
# Check all services are running
for svc in api frontend postgresql redis rabbitmq; do
  echo -n "$svc: "
  kubectl get pods -n itellico-mono -l app=$svc -o jsonpath='{.items[0].status.phase}'
  echo
done

# Test endpoints
curl -f https://api.itellico.com/health || echo "API unhealthy"
curl -f https://app.itellico.com || echo "Frontend unhealthy"
```

## Emergency Procedures

### Complete System Restart

```bash
# Scale down all deployments
kubectl scale deployment --all --replicas=0 -n itellico-mono

# Wait for pods to terminate
kubectl wait --for=delete pod --all -n itellico-mono --timeout=300s

# Scale up in order
kubectl scale statefulset postgresql --replicas=1 -n itellico-mono
kubectl wait --for=condition=ready pod -l app=postgresql -n itellico-mono

kubectl scale deployment redis --replicas=1 -n itellico-mono
kubectl wait --for=condition=ready pod -l app=redis -n itellico-mono

kubectl scale deployment api --replicas=3 -n itellico-mono
kubectl wait --for=condition=ready pod -l app=api -n itellico-mono

kubectl scale deployment frontend --replicas=3 -n itellico-mono
```

### Database Recovery

```bash
# Stop all applications
kubectl scale deployment api frontend --replicas=0 -n itellico-mono

# Restore database
kubectl exec -i statefulset/postgresql -n itellico-mono -- psql -U developer postgres <<EOF
DROP DATABASE IF EXISTS mono;
CREATE DATABASE mono;
EOF

# Restore from backup
kubectl exec -i statefulset/postgresql -n itellico-mono -- psql -U developer mono < backup.sql

# Run migrations
kubectl exec deployment/api -n itellico-mono -- pnpm prisma migrate deploy

# Restart applications
kubectl scale deployment api frontend --replicas=3 -n itellico-mono
```

## Useful Aliases

Add to your shell profile:

```bash
alias k='kubectl'
alias kn='kubectl -n itellico-mono'
alias klog='kubectl logs -f -n itellico-mono'
alias kexec='kubectl exec -it -n itellico-mono'
alias kget='kubectl get -n itellico-mono'
alias kdesc='kubectl describe -n itellico-mono'
alias kscale='kubectl scale -n itellico-mono'

# Quick status check
alias kstatus='kubectl get pods,svc,ingress,pvc -n itellico-mono'

# Watch pods
alias kwatch='watch -n 2 kubectl get pods -n itellico-mono'
```