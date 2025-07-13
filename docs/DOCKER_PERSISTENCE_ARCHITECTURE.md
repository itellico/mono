# Docker Persistence Architecture

## Overview

This document describes the persistent storage architecture for the mono project's Docker services, following industry best practices for configuration management and data persistence.

## Directory Structure

```
/mono
├── docker/                    # Docker-related files (in Git)
│   ├── configs/              # Runtime configurations (in Git)
│   │   ├── postgres/         # PostgreSQL configs
│   │   ├── redis/            # Redis configuration
│   │   ├── grafana/          # Grafana settings & provisioning
│   │   ├── prometheus/       # Prometheus configs & rules
│   │   ├── rabbitmq/         # RabbitMQ definitions
│   │   ├── nginx/            # Nginx configurations
│   │   ├── temporal/         # Temporal workflow configs
│   │   ├── n8n/              # N8N workflow configs
│   │   ├── php/              # PHP.ini settings
│   │   └── kanboard/         # Kanboard configuration
│   │
│   ├── {service}/            # Build contexts, Dockerfiles
│   └── ...                   # Other Docker build files
│
└── docker-data/              # Runtime data (NOT in Git)
    ├── databases/            # Database storage
    │   └── postgres/data/    # PostgreSQL data files
    ├── cache/                # Caching layers
    │   └── redis/data/       # Redis persistence
    ├── messaging/            # Message queues
    │   └── rabbitmq/         # RabbitMQ data
    ├── workflows/            # Workflow engines
    │   ├── n8n/              # N8N workflows & credentials
    │   └── temporal/         # Temporal state
    ├── monitoring/           # Metrics & dashboards
    │   ├── prometheus/       # Time-series data
    │   └── grafana/          # User data & plugins
    ├── apps/                 # Application data
    │   └── kanboard/         # Uploads & attachments
    ├── tools/                # Development tools
    │   ├── redisinsight/     # Redis GUI data
    │   └── mailpit/          # Email storage
    ├── runtime/              # Runtime artifacts
    │   ├── php/              # Sessions & logs
    │   └── nginx/            # Access logs
    └── test/                 # Test environment data
        └── ...               # Mirrors production structure
```

## Best Practices Implementation

### 1. **Configuration Management**
- All configuration files stored in `docker/configs/`
- Version controlled in Git for reproducibility
- Environment-specific overrides supported
- Changes tracked and reviewable

### 2. **Data Persistence**
- All runtime data in `docker-data/`
- Clear separation from configuration
- Easy backup strategy (single directory)
- Excluded from version control

### 3. **Environment Separation**
- Production: `docker-data/`
- Test: `docker-data/test/`
- Complete isolation between environments
- Parallel testing capability

## Service Configuration

### PostgreSQL
```yaml
volumes:
  - ./docker-data/databases/postgres/data:/var/lib/postgresql/data
  - ./docker/configs/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
  - ./docker/configs/postgres/conf.d:/etc/postgresql/conf.d
```

### Redis
```yaml
volumes:
  - ./docker-data/cache/redis/data:/data
  - ./docker/configs/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
```

### Grafana
```yaml
volumes:
  - ./docker-data/monitoring/grafana/data:/var/lib/grafana
  - ./docker/configs/grafana/grafana.ini:/etc/grafana/grafana.ini
  - ./docker/configs/grafana/provisioning:/etc/grafana/provisioning
```

## Migration Guide

### Running the Migration
```bash
# Complete migration for all services
./scripts/migrate-all-to-persistent.sh

# This will:
# 1. Backup all current data
# 2. Create new directory structure
# 3. Copy configurations to docker/configs/
# 4. Update docker-compose files
# 5. Restore all data
# 6. Verify services are running
```

### Post-Migration Verification
```bash
# Check service status
docker-compose ps

# Verify data directories
ls -la docker-data/

# Test service access
curl http://localhost:4041  # Kanboard
curl http://localhost:5005  # Grafana
```

## Backup Strategy

### Full Backup
```bash
# Backup everything
tar -czf mono-backup-$(date +%Y%m%d).tar.gz docker/configs docker-data

# Exclude large files if needed
tar -czf mono-backup-$(date +%Y%m%d).tar.gz \
  --exclude='docker-data/monitoring/prometheus/data' \
  docker/configs docker-data
```

### Service-Specific Backup
```bash
# PostgreSQL
docker-compose exec postgres pg_dumpall -U developer > backup.sql

# Redis
docker-compose exec redis redis-cli BGSAVE
cp docker-data/cache/redis/data/dump.rdb redis-backup.rdb
```

## Restore Procedures

### From Full Backup
```bash
# Stop services
docker-compose down

# Extract backup
tar -xzf mono-backup-20250111.tar.gz

# Start services
docker-compose up -d
```

### Database Restore
```bash
# PostgreSQL
docker-compose exec -T postgres psql -U developer < backup.sql

# Redis
docker-compose stop redis
cp redis-backup.rdb docker-data/cache/redis/data/dump.rdb
docker-compose start redis
```

## Benefits

1. **Predictable Storage**: All data in known locations
2. **Easy Backups**: Single directory to backup
3. **Configuration as Code**: All configs in Git
4. **Environment Parity**: Same structure for dev/test/prod
5. **Disaster Recovery**: Quick restore procedures
6. **Team Collaboration**: Shared configurations
7. **Audit Trail**: Git history for all config changes

## Maintenance

### Regular Tasks
- Monitor disk usage: `du -sh docker-data/*`
- Prune old data: `docker system prune -a`
- Backup critical data daily
- Review configuration changes in Git

### Health Checks
```bash
# Check all services
docker-compose ps

# Verify persistence
docker-compose restart
# Services should retain all data

# Check disk usage
df -h docker-data
```

## Troubleshooting

### Permission Issues
```bash
# Fix PostgreSQL permissions
sudo chown -R 999:999 docker-data/databases/postgres

# Fix Grafana permissions
sudo chown -R 472:472 docker-data/monitoring/grafana
```

### Migration Issues
- Check backup exists before proceeding
- Verify docker-compose files are updated
- Ensure sufficient disk space
- Review service logs: `docker-compose logs [service]`

## Related Documentation
- [Docker Volumes Guide](./DOCKER_VOLUMES_GUIDE.md)
- [Development Environment](./development/getting-started/)
- [Backup Procedures](./development/deployment/)