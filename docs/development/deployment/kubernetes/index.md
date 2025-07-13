# Kubernetes Deployment on Hetzner Cloud

This guide provides a comprehensive walkthrough for deploying the itellico Mono platform on Hetzner Cloud using Kubernetes.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Hetzner Cloud Setup](#hetzner-cloud-setup)
4. [Kubernetes Cluster Creation](#kubernetes-cluster-creation)
5. [Essential Tools Installation](#essential-tools-installation)
6. [Storage Configuration](#storage-configuration)
7. [Networking Setup](#networking-setup)
8. [Service Deployments](#service-deployments)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Security Considerations](#security-considerations)
11. [Backup Strategy](#backup-strategy)
12. [Cost Optimization](#cost-optimization)

## Overview

The itellico Mono platform consists of multiple microservices that need to be orchestrated in Kubernetes:

- **Frontend**: Next.js application
- **API**: Fastify backend service
- **Databases**: PostgreSQL and Redis
- **Message Queue**: RabbitMQ
- **Monitoring**: Prometheus, Grafana, and exporters
- **Workflow**: Temporal and N8N
- **Supporting Services**: Mailpit, documentation site, and more

## Prerequisites

### Required Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install hcloud CLI
wget https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz
tar -xf hcloud-linux-amd64.tar.gz
sudo mv hcloud /usr/local/bin/

# Install k9s (optional but recommended)
curl -sS https://webinstall.dev/k9s | bash
```

### Hetzner Cloud Account Setup

1. Create a Hetzner Cloud account at [console.hetzner.cloud](https://console.hetzner.cloud)
2. Generate an API token:
   - Go to Security → API Tokens
   - Create a new token with Read & Write permissions
   - Save the token securely

```bash
# Configure hcloud CLI
hcloud context create itellico-mono
# Enter your API token when prompted
```

## Hetzner Cloud Setup

### 1. Create a Project

```bash
# Set your project context
hcloud context active itellico-mono
```

### 2. SSH Key Setup

```bash
# Create SSH key if you don't have one
ssh-keygen -t ed25519 -f ~/.ssh/hetzner_k8s -C "k8s@itellico"

# Upload SSH key to Hetzner
hcloud ssh-key create --name k8s-admin --public-key-from-file ~/.ssh/hetzner_k8s.pub
```

### 3. Network Creation

```bash
# Create a private network for the cluster
hcloud network create --name k8s-network --ip-range 10.0.0.0/16

# Create subnets
hcloud network add-subnet k8s-network --type cloud --network-zone eu-central --ip-range 10.0.1.0/24
```

## Kubernetes Cluster Creation

### Option 1: Using Hetzner's Managed Kubernetes (Recommended)

```bash
# Create a managed Kubernetes cluster
hcloud k8s cluster create \
  --name itellico-mono-cluster \
  --version 1.29 \
  --location fsn1 \
  --network-zone eu-central

# Create node pools
hcloud k8s node-pool create \
  --cluster-name itellico-mono-cluster \
  --name general-purpose \
  --server-type cx31 \
  --min-nodes 3 \
  --max-nodes 10 \
  --location fsn1

# Create dedicated database node pool
hcloud k8s node-pool create \
  --cluster-name itellico-mono-cluster \
  --name database \
  --server-type cx51 \
  --min-nodes 2 \
  --max-nodes 3 \
  --location fsn1 \
  --labels workload=database

# Get kubeconfig
hcloud k8s cluster kubeconfig save itellico-mono-cluster
```

### Option 2: Self-Managed k3s Cluster

```bash
# Create master nodes
for i in 1 2 3; do
  hcloud server create \
    --name k8s-master-$i \
    --server-type cx21 \
    --image ubuntu-22.04 \
    --ssh-key k8s-admin \
    --network k8s-network \
    --location fsn1
done

# Create worker nodes
for i in 1 2 3 4; do
  hcloud server create \
    --name k8s-worker-$i \
    --server-type cx31 \
    --image ubuntu-22.04 \
    --ssh-key k8s-admin \
    --network k8s-network \
    --location fsn1
done

# Install k3s on first master
ssh root@<master-1-ip> "curl -sfL https://get.k3s.io | sh -s - server --cluster-init"

# Join other masters
ssh root@<master-2-ip> "curl -sfL https://get.k3s.io | sh -s - server --server https://<master-1-ip>:6443"
ssh root@<master-3-ip> "curl -sfL https://get.k3s.io | sh -s - server --server https://<master-1-ip>:6443"

# Get node token
ssh root@<master-1-ip> "cat /var/lib/rancher/k3s/server/node-token"

# Join workers
for worker_ip in <worker-ips>; do
  ssh root@$worker_ip "curl -sfL https://get.k3s.io | sh -s - agent --server https://<master-1-ip>:6443 --token <node-token>"
done
```

## Essential Tools Installation

### 1. Install Cert-Manager

```bash
# Install cert-manager for SSL certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Create Let's Encrypt ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@itellico.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 2. Install NGINX Ingress Controller

```bash
# Install NGINX Ingress
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."load-balancer.hetzner.cloud/location"=fsn1

# Get the Load Balancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

### 3. Install Hetzner CSI Driver

```bash
# Create secret with Hetzner API token
kubectl create secret generic hcloud \
  -n kube-system \
  --from-literal=token=<your-hetzner-api-token>

# Install Hetzner CSI
kubectl apply -f https://raw.githubusercontent.com/hetznercloud/csi-driver/v2.6.0/deploy/kubernetes/hcloud-csi.yml
```

## Storage Configuration

### 1. Create Storage Classes

```bash
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: hcloud-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: csi.hetzner.cloud
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: hcloud-ssd-retain
provisioner: csi.hetzner.cloud
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Retain
EOF
```

### 2. Create Persistent Volume Claims

```bash
# Create namespace
kubectl create namespace itellico-mono

# PostgreSQL PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: itellico-mono
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: hcloud-ssd-retain
  resources:
    requests:
      storage: 100Gi
EOF

# Redis PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data
  namespace: itellico-mono
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: hcloud-ssd
  resources:
    requests:
      storage: 10Gi
EOF

# RabbitMQ PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: rabbitmq-data
  namespace: itellico-mono
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: hcloud-ssd
  resources:
    requests:
      storage: 20Gi
EOF
```

## Networking Setup

### 1. Create Network Policies

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: itellico-mono
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-internal
  namespace: itellico-mono
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: itellico-mono
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress
  namespace: itellico-mono
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: frontend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
EOF
```

### 2. Configure DNS

Point your domain to the Load Balancer IP:

```bash
# Get Load Balancer IP
LB_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Configure your DNS A records to point to: $LB_IP"

# Required DNS records:
# A    @               -> $LB_IP
# A    api             -> $LB_IP
# A    grafana         -> $LB_IP
# A    docs            -> $LB_IP
# A    rabbitmq        -> $LB_IP
# A    temporal        -> $LB_IP
```

## Service Deployments

The complete Kubernetes manifests for all services are organized in the following structure:

```
kubernetes/
├── namespaces/
│   └── itellico-mono.yaml
├── configmaps/
│   ├── api-config.yaml
│   ├── frontend-config.yaml
│   └── monitoring-config.yaml
├── secrets/
│   ├── database-secrets.yaml
│   ├── api-secrets.yaml
│   └── monitoring-secrets.yaml
├── databases/
│   ├── postgresql/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── backup-cronjob.yaml
│   └── redis/
│       ├── deployment.yaml
│       └── service.yaml
├── applications/
│   ├── api/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── ingress.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── ingress.yaml
│   └── docs/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── ingress.yaml
├── messaging/
│   └── rabbitmq/
│       ├── statefulset.yaml
│       ├── service.yaml
│       └── ingress.yaml
├── monitoring/
│   ├── prometheus/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── grafana/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── ingress.yaml
│   └── exporters/
│       ├── node-exporter-daemonset.yaml
│       └── postgres-exporter.yaml
├── workflow/
│   ├── temporal/
│   │   ├── server-deployment.yaml
│   │   ├── web-deployment.yaml
│   │   └── services.yaml
│   └── n8n/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── ingress.yaml
└── utilities/
    ├── mailpit/
    │   ├── deployment.yaml
    │   └── service.yaml
    └── redis-insight/
        ├── deployment.yaml
        └── service.yaml
```

### Deploy All Services

```bash
# Apply all manifests in order
kubectl apply -f kubernetes/namespaces/
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/databases/
kubectl apply -f kubernetes/applications/
kubectl apply -f kubernetes/messaging/
kubectl apply -f kubernetes/monitoring/
kubectl apply -f kubernetes/workflow/
kubectl apply -f kubernetes/utilities/

# Or use Helm chart (recommended)
helm install itellico-mono ./helm/itellico-mono \
  --namespace itellico-mono \
  --create-namespace \
  --values ./helm/itellico-mono/values.prod.yaml
```

## Monitoring and Observability

### 1. Configure Prometheus Monitoring

```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=hcloud-ssd \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.persistence.enabled=true \
  --set grafana.persistence.storageClassName=hcloud-ssd \
  --set grafana.persistence.size=10Gi
```

### 2. Configure Logging

```bash
# Install Loki
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set loki.persistence.enabled=true \
  --set loki.persistence.storageClassName=hcloud-ssd \
  --set loki.persistence.size=50Gi \
  --set promtail.enabled=true
```

### 3. Application Performance Monitoring

```bash
# Install OpenTelemetry Collector
kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml

# Configure OpenTelemetry for the applications
cat <<EOF | kubectl apply -f -
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: itellico-collector
  namespace: itellico-mono
spec:
  mode: deployment
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
          http:
    processors:
      batch:
    exporters:
      prometheus:
        endpoint: "0.0.0.0:8889"
      jaeger:
        endpoint: jaeger-collector:14250
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch]
          exporters: [jaeger]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [prometheus]
EOF
```

## Security Considerations

### 1. RBAC Configuration

```bash
# Create service accounts and roles
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: itellico-api
  namespace: itellico-mono
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: itellico-api-role
  namespace: itellico-mono
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: itellico-api-rolebinding
  namespace: itellico-mono
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: itellico-api-role
subjects:
- kind: ServiceAccount
  name: itellico-api
  namespace: itellico-mono
EOF
```

### 2. Network Policies

```bash
# Database access policy
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-access
  namespace: itellico-mono
spec:
  podSelector:
    matchLabels:
      app: postgresql
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          database-access: "true"
    ports:
    - protocol: TCP
      port: 5432
EOF
```

### 3. Pod Security Standards

```bash
# Apply pod security standards
kubectl label namespace itellico-mono pod-security.kubernetes.io/enforce=restricted
kubectl label namespace itellico-mono pod-security.kubernetes.io/audit=restricted
kubectl label namespace itellico-mono pod-security.kubernetes.io/warn=restricted
```

### 4. Secrets Management

```bash
# Install Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create sealed secrets
echo -n mypassword | kubectl create secret generic db-password \
  --dry-run=client \
  --from-file=password=/dev/stdin \
  -o yaml | kubeseal -o yaml > sealed-db-password.yaml
```

## Backup Strategy

### 1. Database Backups

```bash
# PostgreSQL backup CronJob
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: itellico-mono
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:16-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            command:
            - /bin/sh
            - -c
            - |
              DATE=$(date +%Y%m%d_%H%M%S)
              pg_dumpall -h postgresql -U developer | gzip > /backup/postgres_backup_\${DATE}.sql.gz
              # Upload to S3 or Hetzner Storage Box
              # Keep last 30 days of backups
              find /backup -name "postgres_backup_*.sql.gz" -mtime +30 -delete
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
          restartPolicy: OnFailure
EOF
```

### 2. Volume Snapshots

```bash
# Install snapshot controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotclasses.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotcontents.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshots.yaml

# Create VolumeSnapshotClass
cat <<EOF | kubectl apply -f -
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: hcloud-snapshot
driver: csi.hetzner.cloud
deletionPolicy: Delete
EOF

# Create snapshots
cat <<EOF | kubectl apply -f -
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: postgres-snapshot-$(date +%Y%m%d)
  namespace: itellico-mono
spec:
  volumeSnapshotClassName: hcloud-snapshot
  source:
    persistentVolumeClaimName: postgres-data
EOF
```

### 3. Cluster Backup with Velero

```bash
# Install Velero
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm repo update

# Create backup location (using Hetzner Object Storage)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: cloud-credentials
  namespace: velero
type: Opaque
stringData:
  cloud: |
    [default]
    aws_access_key_id=<your-access-key>
    aws_secret_access_key=<your-secret-key>
EOF

helm install velero vmware-tanzu/velero \
  --namespace velero \
  --create-namespace \
  --set-file credentials.secretContents.cloud=<(echo "[default]
aws_access_key_id=<your-access-key>
aws_secret_access_key=<your-secret-key>") \
  --set configuration.provider=aws \
  --set configuration.backupStorageLocation.name=default \
  --set configuration.backupStorageLocation.bucket=itellico-backups \
  --set configuration.backupStorageLocation.config.region=eu-central-1 \
  --set configuration.backupStorageLocation.config.s3ForcePathStyle=true \
  --set configuration.backupStorageLocation.config.s3Url=https://eu-central-1.s3.hetzner.com \
  --set initContainers[0].name=velero-plugin-for-aws \
  --set initContainers[0].image=velero/velero-plugin-for-aws:v1.8.0 \
  --set initContainers[0].volumeMounts[0].mountPath=/target \
  --set initContainers[0].volumeMounts[0].name=plugins

# Create backup schedule
velero schedule create daily-backup --schedule="0 3 * * *" --include-namespaces itellico-mono
```

## Cost Optimization

> 📊 **For detailed Hetzner pricing and comprehensive cost analysis, see our [Kubernetes Cost Optimization Guide](./cost-optimization.md)**

### 1. Node Pool Autoscaling

```bash
# Configure cluster autoscaler
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set cloudProvider=hetzner \
  --set autoscalingGroups[0].name=general-purpose \
  --set autoscalingGroups[0].minSize=3 \
  --set autoscalingGroups[0].maxSize=10 \
  --set extraArgs.balance-similar-node-groups=true \
  --set extraArgs.skip-nodes-with-system-pods=false
```

### 2. Resource Optimization

```bash
# Install Vertical Pod Autoscaler
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vertical-pod-autoscaler.yaml

# Create VPA for API deployment
cat <<EOF | kubectl apply -f -
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
  namespace: itellico-mono
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind:       Deployment
    name:       api
  updatePolicy:
    updateMode: "Auto"
EOF
```

### 3. Cost Monitoring

```bash
# Install Kubecost
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm repo update

helm install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace \
  --set prometheus.server.global.external_labels.cluster_id=itellico-mono \
  --set prometheus.server.global.external_labels.region=eu-central \
  --set prometheus.server.global.external_labels.provider=hetzner
```

### 4. Spot Instances (when available)

```bash
# Create node pool with spot instances (future Hetzner feature)
hcloud k8s node-pool create \
  --cluster-name itellico-mono-cluster \
  --name spot-workers \
  --server-type cx31 \
  --min-nodes 0 \
  --max-nodes 5 \
  --location fsn1 \
  --labels workload=spot \
  --taints spot=true:NoSchedule
```

## Maintenance and Operations

### 1. Cluster Upgrades

```bash
# Check available versions
hcloud k8s cluster list-versions

# Upgrade control plane
hcloud k8s cluster upgrade itellico-mono-cluster --version 1.29

# Upgrade node pools
hcloud k8s node-pool upgrade general-purpose --cluster-name itellico-mono-cluster
```

### 2. Monitoring Alerts

```bash
# Configure AlertManager
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      slack_api_url: '<your-slack-webhook>'
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack'
    receivers:
    - name: 'slack'
      slack_configs:
      - channel: '#alerts'
        title: 'Kubernetes Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
EOF
```

### 3. Disaster Recovery Plan

1. **Regular Backups**: Daily automated backups of all databases and persistent volumes
2. **Multi-Region Setup**: Consider deploying to multiple Hetzner locations (fsn1, nbg1, hel1)
3. **Backup Testing**: Monthly restore tests to verify backup integrity
4. **Documentation**: Keep runbooks updated for common failure scenarios

### 4. Performance Tuning

```bash
# Node affinity for databases
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql
  namespace: itellico-mono
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: workload
                operator: In
                values:
                - database
      tolerations:
      - key: workload
        operator: Equal
        value: database
        effect: NoSchedule
EOF
```

## Troubleshooting

### Common Issues and Solutions

1. **PVC Stuck in Pending**
   ```bash
   # Check storage class
   kubectl get storageclass
   # Check CSI driver pods
   kubectl get pods -n kube-system | grep csi
   ```

2. **Ingress Not Working**
   ```bash
   # Check ingress controller
   kubectl get pods -n ingress-nginx
   # Check load balancer status
   kubectl get svc -n ingress-nginx
   ```

3. **Database Connection Issues**
   ```bash
   # Check network policies
   kubectl get networkpolicies -n itellico-mono
   # Test connectivity
   kubectl run -it --rm debug --image=busybox --restart=Never -- nc -zv postgresql 5432
   ```

4. **High Memory Usage**
   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -n itellico-mono
   # Check for memory leaks
   kubectl describe pod <pod-name> -n itellico-mono
   ```

## Conclusion

This guide provides a comprehensive approach to deploying the itellico Mono platform on Hetzner Cloud using Kubernetes. Key considerations:

- **High Availability**: Multi-master setup with node distribution across availability zones
- **Security**: Network policies, RBAC, and secrets management
- **Scalability**: Horizontal pod autoscaling and cluster autoscaling
- **Monitoring**: Complete observability stack with Prometheus, Grafana, and Loki
- **Backup**: Automated backups with multiple strategies
- **Cost Optimization**: Resource optimization and monitoring

For production deployments, ensure you:
1. Use production-grade passwords and secrets
2. Configure proper domain names and SSL certificates
3. Set up monitoring alerts
4. Implement regular backup testing
5. Document your specific configuration changes

### Next Steps

1. Review and customize the Helm values for your specific needs
2. Set up CI/CD pipelines for automated deployments
3. Configure monitoring dashboards and alerts
4. Implement security scanning and compliance checks
5. Plan for disaster recovery scenarios

For additional support and detailed configurations, refer to the individual service documentation in the [Service Configurations](./service-configurations/index.md) section.