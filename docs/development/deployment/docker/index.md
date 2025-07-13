---
title: Docker Management
sidebar_label: Docker
---

# Docker Management

Comprehensive guides for Docker configuration, management, and best practices in the itellico Mono platform.

## Overview

Docker is the primary containerization platform for local development and deployment:

- **Development**: Docker Compose for local services
- **Testing**: Isolated test environments
- **Production**: Container orchestration with Kubernetes
- **Data Persistence**: Comprehensive bind mount strategy

### Persistent Storage Architecture

The project uses a dual-directory approach for Docker persistence:

```
mono/
├── docker/              # Configuration files (tracked in Git)
│   ├── configs/        # Service-specific configurations
│   └── php/            # Custom Dockerfiles
└── docker-data/        # Runtime data (NOT tracked in Git)
    ├── databases/      # PostgreSQL data
    ├── cache/          # Redis persistence
    ├── monitoring/     # Grafana dashboards
    └── uploads/        # User uploads
```

## Documentation

### [Docker Persistence Architecture](/docs/DOCKER_PERSISTENCE_ARCHITECTURE.md)
Complete guide to the persistent storage architecture:
- Bind mount strategy
- Directory structure
- Service configurations
- Migration procedures

### [Docker Volumes Guide](/docs/DOCKER_VOLUMES_GUIDE.md)
Detailed volume management guide:
- Backup and restore procedures
- Volume management utilities
- Troubleshooting tips
- Best practices for data safety

### Docker Compose Management
- Service configuration with `docker-compose.yml`
- Persistence overlay with `docker-compose.persistent.yml`
- Environment-specific overrides
- Network configuration
- Resource limits

### Container Optimization
- Multi-stage builds
- Layer caching
- Size optimization
- Security hardening

## Quick Commands

```bash
# Start with Persistent Storage
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d

# Volume Management
./scripts/manage-volumes.sh list              # List all volumes
./scripts/manage-volumes.sh check-health      # Health check
./scripts/backup-docker-data.sh               # Backup all persistent data
./scripts/restore-docker-data.sh backup.tar   # Restore from backup

# Docker Compose
docker-compose logs -f [service]              # View logs
docker-compose ps                             # List services
docker-compose down                           # Stop services (data persists)

# Container Management
docker exec -it [container] bash              # Enter container
docker stats                                  # Monitor resources
du -sh docker-data/*                          # Check disk usage

# Migration to Persistent Setup
./scripts/migrate-to-persistent-docker.sh     # Migrate existing data
```

## Best Practices

1. **Use bind mounts for persistence** - More control than named volumes
2. **Separate config from data** - `docker/` for configs, `docker-data/` for data
3. **Never commit docker-data/** - Add to .gitignore
4. **Regular backups** - Use `backup-docker-data.sh` script
5. **Test restores** - Verify backup integrity regularly
6. **Monitor disk usage** - `du -sh docker-data/*`
7. **Document changes** - Keep docker-compose files well commented
8. **Use overlay files** - `docker-compose.persistent.yml` for persistence

## Related Documentation

- [Docker Persistence Architecture](/docs/DOCKER_PERSISTENCE_ARCHITECTURE.md)
- [Docker Volumes Guide](/docs/DOCKER_VOLUMES_GUIDE.md)
- [Deployment Guide](../)
- [Development Tools](/development/tools)
- [Environment Setup](/development/environment-setup)
- [Getting Started](/development/getting-started/developer-guide)