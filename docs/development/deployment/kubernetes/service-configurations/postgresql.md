# PostgreSQL Configuration

PostgreSQL is the primary database for the itellico Mono platform, hosting multiple databases for different services.

## Databases

- **mono**: Main application database
- **temporal**: Temporal workflow engine database
- **kanboard**: Kanboard project management database
- **n8n**: N8N automation database

## Kubernetes Manifests

### StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
  namespace: itellico-mono
spec:
  serviceName: postgresql
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
        database-access: "true"
    spec:
      nodeSelector:
        workload: database
      containers:
      - name: postgresql
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_USER
          value: developer
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: POSTGRES_DB
          value: mono
        - name: POSTGRES_INITDB_ARGS
          value: "--encoding=UTF8 --locale=en_US.UTF-8"
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "8Gi"
            cpu: "4"
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        - name: postgres-init
          mountPath: /docker-entrypoint-initdb.d
        - name: postgres-config
          mountPath: /etc/postgresql
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - developer
            - -d
            - mono
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - developer
            - -d
            - mono
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: postgres-init
        configMap:
          name: postgres-init-scripts
      - name: postgres-config
        configMap:
          name: postgres-config
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: hcloud-ssd-retain
      resources:
        requests:
          storage: 100Gi
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgresql
  namespace: itellico-mono
  labels:
    app: postgresql
spec:
  ports:
  - port: 5432
    targetPort: 5432
    protocol: TCP
    name: postgres
  selector:
    app: postgresql
  type: ClusterIP
  sessionAffinity: None
```

### ConfigMap - Init Scripts

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init-scripts
  namespace: itellico-mono
data:
  01-create-databases.sql: |
    -- Create additional databases
    CREATE DATABASE temporal;
    CREATE DATABASE kanboard;
    CREATE DATABASE n8n;
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE temporal TO developer;
    GRANT ALL PRIVILEGES ON DATABASE kanboard TO developer;
    GRANT ALL PRIVILEGES ON DATABASE n8n TO developer;
    
  02-create-extensions.sql: |
    -- Connect to mono database
    \c mono
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Connect to temporal database
    \c temporal
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Connect to n8n database
    \c n8n
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### ConfigMap - PostgreSQL Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: itellico-mono
data:
  postgresql.conf: |
    # Connection settings
    listen_addresses = '*'
    max_connections = 200
    
    # Memory settings
    shared_buffers = 2GB
    effective_cache_size = 6GB
    maintenance_work_mem = 512MB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100
    random_page_cost = 1.1
    effective_io_concurrency = 200
    work_mem = 10485kB
    min_wal_size = 1GB
    max_wal_size = 4GB
    
    # Logging
    log_timezone = 'UTC'
    log_statement = 'mod'
    log_duration = off
    log_min_duration_statement = 100
    log_checkpoints = on
    log_connections = on
    log_disconnections = on
    log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
    
    # Autovacuum
    autovacuum = on
    autovacuum_max_workers = 4
    autovacuum_naptime = 30s
    
    # SSL
    ssl = on
    ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
    ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
    
  pg_hba.conf: |
    # TYPE  DATABASE        USER            ADDRESS                 METHOD
    local   all             all                                     trust
    host    all             all             127.0.0.1/32            trust
    host    all             all             ::1/128                 trust
    host    all             all             10.0.0.0/8              md5
    host    all             all             172.16.0.0/12           md5
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: itellico-mono
type: Opaque
stringData:
  password: "your-secure-password-here"
  replication-password: "your-replication-password-here"
```

### Backup CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: itellico-mono
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: postgres-backup
            image: postgres:16-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: S3_BUCKET
              value: "s3://itellico-backups/postgres"
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: backup-credentials
                  key: access-key
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: backup-credentials
                  key: secret-key
            command:
            - /bin/sh
            - -c
            - |
              set -e
              DATE=$(date +%Y%m%d_%H%M%S)
              
              # Backup all databases
              for DB in mono temporal kanboard n8n; do
                echo "Backing up database: $DB"
                pg_dump -h postgresql -U developer -d $DB | gzip > /tmp/${DB}_${DATE}.sql.gz
                
                # Upload to S3
                aws s3 cp /tmp/${DB}_${DATE}.sql.gz ${S3_BUCKET}/${DB}_${DATE}.sql.gz
                
                # Clean up local file
                rm /tmp/${DB}_${DATE}.sql.gz
              done
              
              # Delete backups older than 30 days
              aws s3 ls ${S3_BUCKET}/ | while read -r line; do
                createDate=$(echo $line | awk '{print $1" "$2}')
                createDate=$(date -d "$createDate" +%s)
                olderThan=$(date -d "30 days ago" +%s)
                if [[ $createDate -lt $olderThan ]]; then
                  fileName=$(echo $line | awk '{print $4}')
                  echo "Deleting old backup: $fileName"
                  aws s3 rm ${S3_BUCKET}/$fileName
                fi
              done
```

### Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-network-policy
  namespace: itellico-mono
spec:
  podSelector:
    matchLabels:
      app: postgresql
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          database-access: "true"
    - namespaceSelector:
        matchLabels:
          name: itellico-mono
    ports:
    - protocol: TCP
      port: 5432
  egress:
  - to:
    - podSelector: {}
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53  # DNS
    - protocol: UDP
      port: 53  # DNS
```

### PostgreSQL Exporter for Prometheus

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-exporter
  namespace: itellico-mono
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres-exporter
  template:
    metadata:
      labels:
        app: postgres-exporter
    spec:
      containers:
      - name: postgres-exporter
        image: prometheuscommunity/postgres-exporter:latest
        ports:
        - containerPort: 9187
          name: metrics
        env:
        - name: DATA_SOURCE_NAME
          value: "postgresql://developer:$(POSTGRES_PASSWORD)@postgresql:5432/mono?sslmode=disable"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-exporter
  namespace: itellico-mono
  labels:
    app: postgres-exporter
spec:
  ports:
  - port: 9187
    targetPort: 9187
    name: metrics
  selector:
    app: postgres-exporter
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postgres-exporter
  namespace: itellico-mono
spec:
  selector:
    matchLabels:
      app: postgres-exporter
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

## High Availability Setup (Optional)

For production environments, consider using a PostgreSQL operator for high availability:

### Option 1: CloudNativePG

```bash
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml

# Create PostgreSQL cluster
cat <<EOF | kubectl apply -f -
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: itellico-mono
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  
  postgresql:
    parameters:
      shared_buffers: "2GB"
      effective_cache_size: "6GB"
      max_connections: "200"
      
  bootstrap:
    initdb:
      database: mono
      owner: developer
      secret:
        name: postgres-secret
      postInitSQL:
        - CREATE DATABASE temporal;
        - CREATE DATABASE kanboard;
        - CREATE DATABASE n8n;
        
  storage:
    size: 100Gi
    storageClass: hcloud-ssd-retain
    
  monitoring:
    enabled: true
    
  backup:
    retentionPolicy: "30d"
    barmanObjectStore:
      destinationPath: "s3://itellico-backups/postgres"
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: access-key
        secretAccessKey:
          name: backup-credentials
          key: secret-key
      wal:
        compression: gzip
      data:
        compression: gzip
EOF
```

### Option 2: Zalando PostgreSQL Operator

```bash
kubectl create -f https://raw.githubusercontent.com/zalando/postgres-operator/master/manifests/configmap.yaml
kubectl create -f https://raw.githubusercontent.com/zalando/postgres-operator/master/manifests/operator-service-account-rbac.yaml
kubectl create -f https://raw.githubusercontent.com/zalando/postgres-operator/master/manifests/postgres-operator.yaml

# Create PostgreSQL cluster
cat <<EOF | kubectl apply -f -
apiVersion: acid.zalan.do/v1
kind: postgresql
metadata:
  name: postgres-cluster
  namespace: itellico-mono
spec:
  teamId: "itellico"
  volume:
    size: 100Gi
    storageClass: hcloud-ssd-retain
  numberOfInstances: 3
  users:
    developer:
    - superuser
    - createdb
  databases:
    mono: developer
    temporal: developer
    kanboard: developer
    n8n: developer
  postgresql:
    version: "16"
    parameters:
      shared_buffers: "2GB"
      effective_cache_size: "6GB"
      max_connections: "200"
  resources:
    requests:
      memory: 2Gi
      cpu: 1
    limits:
      memory: 8Gi
      cpu: 4
  patroni:
    synchronous_mode: true
    synchronous_mode_strict: false
EOF
```

## Performance Tuning

### Connection Pooling with PgBouncer

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
  namespace: itellico-mono
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
        database-access: "true"
    spec:
      containers:
      - name: pgbouncer
        image: pgbouncer/pgbouncer:latest
        ports:
        - containerPort: 6432
          name: pgbouncer
        env:
        - name: DATABASES_HOST
          value: postgresql
        - name: DATABASES_PORT
          value: "5432"
        - name: DATABASES_USER
          value: developer
        - name: DATABASES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: DATABASES_DATABASE
          value: mono
        - name: POOL_MODE
          value: transaction
        - name: MAX_CLIENT_CONN
          value: "1000"
        - name: DEFAULT_POOL_SIZE
          value: "25"
        - name: MIN_POOL_SIZE
          value: "5"
        - name: RESERVE_POOL_SIZE
          value: "5"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: pgbouncer
  namespace: itellico-mono
spec:
  ports:
  - port: 6432
    targetPort: 6432
    name: pgbouncer
  selector:
    app: pgbouncer
```

## Monitoring Queries

Create custom queries for PostgreSQL exporter:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-exporter-queries
  namespace: itellico-mono
data:
  queries.yaml: |
    pg_replication:
      query: "SELECT CASE WHEN NOT pg_is_in_recovery() THEN 0 ELSE GREATEST (0, EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))) END AS lag"
      master: true
      metrics:
        - lag:
            usage: "GAUGE"
            description: "Replication lag behind master in seconds"
    
    pg_database:
      query: "SELECT pg_database.datname, pg_database_size(pg_database.datname) as size_bytes FROM pg_database"
      master: true
      cache_seconds: 30
      metrics:
        - datname:
            usage: "LABEL"
            description: "Name of the database"
        - size_bytes:
            usage: "GAUGE"
            description: "Disk space used by the database"
    
    pg_stat_user_tables:
      query: |
        SELECT
          current_database() datname,
          schemaname,
          tablename,
          reltuples::BIGINT AS rows,
          n_live_tup AS live_rows,
          n_dead_tup AS dead_rows,
          n_mod_since_analyze AS rows_mod_since_analyze,
          COALESCE(last_vacuum, '1970-01-01Z') as last_vacuum,
          COALESCE(last_autovacuum, '1970-01-01Z') as last_autovacuum,
          COALESCE(last_analyze, '1970-01-01Z') as last_analyze,
          COALESCE(last_autoanalyze, '1970-01-01Z') as last_autoanalyze
        FROM
          pg_stat_user_tables
      metrics:
        - datname:
            usage: "LABEL"
            description: "Name of current database"
        - schemaname:
            usage: "LABEL"
            description: "Name of the schema"
        - tablename:
            usage: "LABEL"
            description: "Name of the table"
        - rows:
            usage: "GAUGE"
            description: "Estimated number of rows in the table"
        - live_rows:
            usage: "GAUGE"
            description: "Estimated number of live rows"
        - dead_rows:
            usage: "GAUGE"
            description: "Estimated number of dead rows"
        - rows_mod_since_analyze:
            usage: "GAUGE"
            description: "Number of rows modified since last analyze"
        - last_vacuum:
            usage: "GAUGE"
            description: "Time of last vacuum"
        - last_autovacuum:
            usage: "GAUGE"
            description: "Time of last autovacuum"
        - last_analyze:
            usage: "GAUGE"
            description: "Time of last analyze"
        - last_autoanalyze:
            usage: "GAUGE"
            description: "Time of last autoanalyze"
```

## Disaster Recovery

### Point-in-Time Recovery Setup

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-pitr-config
  namespace: itellico-mono
data:
  recovery.conf: |
    restore_command = 'aws s3 cp s3://itellico-backups/postgres/wal/%f %p'
    archive_cleanup_command = 'pg_archivecleanup /var/lib/postgresql/data/pg_wal %r'
    recovery_target_time = '2024-01-15 14:30:00'
    recovery_target_action = 'promote'
```

### Restore Procedure

```bash
# 1. Scale down applications
kubectl scale deployment api frontend --replicas=0 -n itellico-mono

# 2. Create restore job
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: postgres-restore-$(date +%Y%m%d-%H%M%S)
  namespace: itellico-mono
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: restore
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
          # Download latest backup
          aws s3 cp s3://itellico-backups/postgres/mono_latest.sql.gz /tmp/
          
          # Restore database
          gunzip -c /tmp/mono_latest.sql.gz | psql -h postgresql -U developer -d postgres -c "DROP DATABASE IF EXISTS mono; CREATE DATABASE mono;"
          gunzip -c /tmp/mono_latest.sql.gz | psql -h postgresql -U developer -d mono
          
          echo "Restore completed"
EOF

# 3. Wait for restore to complete
kubectl wait --for=condition=complete job/postgres-restore-* -n itellico-mono

# 4. Scale up applications
kubectl scale deployment api frontend --replicas=3 -n itellico-mono
```