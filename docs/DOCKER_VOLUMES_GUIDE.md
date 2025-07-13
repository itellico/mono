# Docker Persistent Volumes Guide

## Overview

This guide documents the persistent volume setup for all Docker services in the mono project, following best practices for data organization, backup, and maintenance.

## 📁 Volume Directory Structure

All Docker volumes are organized under a central mount point: `./docker-data/`

```
docker-data/
├── databases/              # All database storage
│   └── postgres/          
│       ├── data/          # PostgreSQL data files
│       ├── config/        # Custom configurations
│       └── backup/        # Automated backups
│
├── cache/                 # Caching layer storage
│   └── redis/            
│       ├── data/          # Redis persistence files
│       └── config/        # Redis configuration
│
├── messaging/             # Message queue storage
│   └── rabbitmq/         
│       ├── data/          # RabbitMQ persistent data
│       ├── config/        # Exchange/queue definitions
│       └── logs/          # Message logs
│
├── apps/                  # Application-specific data
│   ├── kanboard/         
│   │   ├── data/          # SQLite db, attachments
│   │   └── plugins/       # Installed plugins
│   └── clickdummy/       
│       └── data/          # User uploads, cache
│
├── workflows/             # Workflow engine storage
│   ├── n8n/              
│   │   ├── data/          # Credentials, settings
│   │   ├── workflows/     # Workflow definitions
│   │   └── custom/        # Custom nodes
│   └── temporal/         
│       ├── data/          # Workflow history
│       └── config/        # Dynamic configuration
│
├── monitoring/            # Observability data
│   ├── prometheus/       
│   │   ├── data/          # Time-series metrics
│   │   └── config/        # Scrape configurations
│   └── grafana/          
│       ├── data/          # Dashboards, users
│       ├── config/        # Datasources, settings
│       └── plugins/       # Visualization plugins
│
├── tools/                 # Development tools
│   ├── redisinsight/     
│   │   └── data/          # Connection profiles
│   └── mailpit/          
│       └── data/          # Captured emails
│
└── runtime/               # Runtime/temporary data
    ├── php/              
    │   ├── sessions/      # PHP session files
    │   └── logs/          # PHP error logs
    └── nginx/            
        └── logs/          # Access/error logs
```

## 🐳 Service Volume Mappings

| Service | Container Path | Host Path | Purpose |
|---------|---------------|-----------|---------|
| **PostgreSQL** | `/var/lib/postgresql/data` | `./docker-data/databases/postgres/data` | Database files |
| | `/etc/postgresql` | `./docker-data/databases/postgres/config` | Configuration |
| | `/backups` | `./docker-data/databases/postgres/backup` | Backup storage |
| **Redis** | `/data` | `./docker-data/cache/redis/data` | Persistence files |
| **RabbitMQ** | `/var/lib/rabbitmq` | `./docker-data/messaging/rabbitmq/data` | Message data |
| **Kanboard** | `/var/www/html/kanboard/data` | `./docker-data/apps/kanboard/data` | App data |
| **N8N** | `/home/node/.n8n` | `./docker-data/workflows/n8n/data` | Workflows |
| **Temporal** | `/etc/temporal` | `./docker-data/workflows/temporal/data` | Workflow state |
| **Prometheus** | `/prometheus` | `./docker-data/monitoring/prometheus/data` | Metrics |
| **Grafana** | `/var/lib/grafana` | `./docker-data/monitoring/grafana/data` | Dashboards |

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Run the setup script
./scripts/setup-docker-volumes.sh

# This will:
# - Create all directory structures
# - Set proper permissions
# - Configure .env file
# - Display volume mappings
```

### 2. Start Services

```bash
# Stop existing containers
docker-compose down

# Start with persistent volumes
docker-compose up -d

# Verify volumes are mounted
docker-compose ps
docker volume ls
```

### 3. Migrate Existing Data

```bash
# For Kanboard SQLite → PostgreSQL
./scripts/migrate-kanboard-to-postgres.sh
```

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```env
# Docker data root directory (default: ./docker-data)
DOCKER_DATA_ROOT=./docker-data

# Use volume configuration
COMPOSE_FILE=docker-compose.yml:docker-compose.volumes.yml
```

### Custom Data Location

To use a different storage location:

```bash
# Set custom path
export DOCKER_DATA_ROOT=/mnt/storage/docker-data

# Run setup
./scripts/setup-docker-volumes.sh

# Start services
docker-compose up -d
```

## 💾 Backup & Restore

### Full Backup

```bash
# Stop services
docker-compose down

# Create timestamped backup
tar -czf docker-data-$(date +%Y%m%d_%H%M%S).tar.gz ./docker-data

# Start services
docker-compose up -d
```

### Service-Specific Backup

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dumpall -U developer > postgres-backup.sql

# Backup Redis
docker-compose exec redis redis-cli BGSAVE

# Backup Kanboard
tar -czf kanboard-backup.tar.gz ./docker-data/apps/kanboard
```

### Restore

```bash
# Stop services
docker-compose down

# Extract backup
tar -xzf docker-data-20240111_120000.tar.gz

# Start services
docker-compose up -d
```

## 🔍 Monitoring Volume Usage

### Check Disk Usage

```bash
# Overall usage
du -sh ./docker-data/*

# Detailed by service
du -sh ./docker-data/*/*

# Monitor growth
watch -n 60 'du -sh ./docker-data/*'
```

### Inside Containers

```bash
# PostgreSQL
docker-compose exec postgres df -h /var/lib/postgresql/data

# Redis
docker-compose exec redis df -h /data

# All containers
docker-compose ps --format "table {{.Name}}\t{{.Status}}"
```

## 🛡️ Security Considerations

### Permissions

Each service runs with specific UIDs:
- PostgreSQL: 999
- Redis: 999
- Grafana: 472
- Prometheus: 65534
- N8N: 1000
- PHP/Nginx: 33

### Sensitive Data

- Database credentials: Stored in `.env`
- SSL certificates: Mount separately
- API keys: Use Docker secrets

## 🔧 Troubleshooting

### Permission Errors

```bash
# Fix PostgreSQL permissions
sudo chown -R 999:999 ./docker-data/databases/postgres

# Fix Grafana permissions
sudo chown -R 472:472 ./docker-data/monitoring/grafana
```

### Volume Not Mounting

```bash
# Check volume exists
docker volume ls

# Inspect volume
docker volume inspect mono_postgres_data

# Recreate volumes
docker-compose down -v
./scripts/setup-docker-volumes.sh
docker-compose up -d
```

### Data Migration Issues

```bash
# Check source data exists
ls -la ./php/kanboard/data/

# Verify PostgreSQL is running
docker-compose exec postgres psql -U developer -d kanboard -c '\dt'
```

## 📊 Best Practices

1. **Regular Backups**: Automate daily backups of critical data
2. **Monitor Disk Space**: Set up alerts for volume usage
3. **Test Restores**: Regularly verify backup integrity
4. **Document Changes**: Keep this guide updated
5. **Version Control**: Don't commit docker-data/ directory

## 🔗 Related Documentation

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Volumes Guide](https://docs.docker.com/storage/volumes/)
- [PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)
- [Redis Persistence](https://redis.io/docs/management/persistence/)