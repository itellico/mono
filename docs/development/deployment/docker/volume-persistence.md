# Docker Volume Persistence Strategy

This document explains how to make Docker databases truly persistent and prevent data loss when restarting or rebuilding Docker containers.

## Understanding Docker Volumes

Docker volumes persist data independently of container lifecycle. However, they can still be lost if:
- You run `docker-compose down -v` (removes volumes)
- You delete volumes manually
- Docker Desktop is reset or reinstalled
- The host machine crashes

## Our Persistence Strategy

### 1. **Named Volumes (Currently Implemented)**
All our databases use named volumes:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data
- `rabbitmq_data` - RabbitMQ data
- etc.

These survive container restarts but NOT volume deletion.

### 2. **Host Directory Mounts (Alternative)**
For absolute persistence, mount host directories:

```yaml
services:
  postgres:
    volumes:
      # Instead of named volume
      - ./data/postgres:/var/lib/postgresql/data
      
  redis:
    volumes:
      # Instead of named volume
      - ./data/redis:/data
```

**Pros:** Data stored in project directory, easy to backup
**Cons:** Permission issues on some systems, less portable

### 3. **Automated Backups (Recommended)**
Regular backups ensure data safety:

```bash
# Run daily via cron
./scripts/backup-databases.sh

# Backups stored in ./backups/
# Keeps last 7 days by default
```

### 4. **External Volumes**
Create volumes outside Docker Compose:

```bash
# Create external volume
docker volume create --driver local \
  --opt type=none \
  --opt device=/absolute/path/to/data \
  --opt o=bind \
  mongo_persistent_data
```

Then reference in docker-compose.yml:
```yaml
volumes:
  mongo_persistent_data:
    external: true
```

### 5. **Redis Insight Persistent Connections**
Redis Insight database connections are automatically persistent due to the `redis_insight_data` volume. To configure persistent connections:

#### Adding Database Connections
1. **Open Redis Insight**: `http://localhost:5540`
2. **Add Main Redis Database**:
   - Click **"Add Database"**
   - Choose **"Add Database Manually"**
   - **Database Alias**: `mono`
   - **Host**: `mono-redis` (⚠️ **NOT** `localhost`)
   - **Port**: `6379`
   - **Username**: (leave empty)
   - **Password**: (leave empty)
   - Click **"Add Database"**

3. **Add Test Redis Database**:
   - Click **"+ Add Database"**
   - Choose **"Add Database Manually"**
   - **Database Alias**: `mono-test`
   - **Host**: `mono-test-redis` (⚠️ **NOT** `localhost`)
   - **Port**: `6379` (⚠️ **NOT** `6380` - that's the host port)
   - **Username**: (leave empty)
   - **Password**: (leave empty)
   - Click **"Add Database"**

#### Why Container Names, Not `localhost`?
Redis Insight runs inside a Docker container, so `localhost` refers to the container itself, not your host machine. Use Docker container names:
- ✅ **Correct**: `mono-redis:6379` and `mono-test-redis:6379`
- ❌ **Wrong**: `localhost:6379` and `localhost:6380`

#### Testing Connections
Add test data to verify connections:
```bash
# Add test data to both Redis instances
pnpm run redis:test-data

# Or manually:
docker exec mono-redis redis-cli SET "test:main" "Hello from main Redis!"
docker exec mono-test-redis redis-cli SET "test:environment" "Hello from test Redis!"
```

#### Persistence
These connections survive:
- ✅ Container restarts
- ✅ Docker restarts  
- ✅ System reboots
- ✅ Volume recreation (connections stored in `redis_insight_data` volume)

## Backup and Restore Procedures

### Automatic Backup
```bash
# Backup all databases
./scripts/backup-databases.sh

# Customize backup location
BACKUP_DIR=/path/to/backups ./scripts/backup-databases.sh

# Keep backups for 30 days
KEEP_DAYS=30 ./scripts/backup-databases.sh
```

### Restore from Backup
```bash
# List available backups
./scripts/restore-databases.sh

# Restore latest backup
./scripts/restore-databases.sh latest

# Restore specific backup
./scripts/restore-databases.sh 20240115_120000

# Restore only PostgreSQL
./scripts/restore-databases.sh latest postgres

# Restore only Redis
./scripts/restore-databases.sh latest redis
```

## Best Practices

### 1. **Never Use `-v` Flag**
```bash
# ❌ WRONG - Deletes volumes
docker-compose down -v

# ✅ CORRECT - Preserves volumes
docker-compose down
```

### 2. **Regular Backups**
Set up a cron job:
```bash
# Add to crontab
0 2 * * * cd /path/to/project && ./scripts/backup-databases.sh
```

### 3. **Test Restores**
Regularly test your restore process:
```bash
# Test restore to separate environment
docker-compose -f docker-compose.test.yml up -d
./scripts/restore-databases.sh latest
```

### 4. **Monitor Volume Usage**
```bash
# Check volume sizes
docker volume ls --format "table {{.Name}}\t{{.Size}}"

# Inspect specific volume
docker volume inspect postgres_data
```

## Migrating to Host Mounts

If you want absolute control over data location:

1. **Backup existing data**
   ```bash
   ./scripts/backup-databases.sh
   ```

2. **Create host directories**
   ```bash
   mkdir -p ./data/{postgres,redis,rabbitmq,n8n,temporal,grafana}
   ```

3. **Update docker-compose.yml**
   ```yaml
   services:
     postgres:
       volumes:
         - ./data/postgres:/var/lib/postgresql/data
         - ./docker/postgres/init:/docker-entrypoint-initdb.d
   ```

4. **Restore data**
   ```bash
   docker-compose up -d
   ./scripts/restore-databases.sh latest
   ```

## Cloud/Remote Backups

For production environments, consider:

1. **AWS S3 Sync**
   ```bash
   aws s3 sync ./backups s3://my-backup-bucket/mongo-backups/
   ```

2. **Automated Cloud Backup Script**
   ```bash
   # After local backup
   ./scripts/backup-databases.sh
   
   # Upload to cloud
   rclone copy ./backups/latest remote:backups/
   ```

3. **Database-Specific Solutions**
   - PostgreSQL: WAL archiving, streaming replication
   - Redis: Redis Sentinel, Redis Cluster
   - Use managed services (RDS, ElastiCache)

## Troubleshooting

### Volume Not Found
```bash
# List all volumes
docker volume ls

# Recreate if missing
docker volume create postgres_data
```

### Permission Issues
```bash
# Fix permissions for host mounts
sudo chown -R $(id -u):$(id -g) ./data
```

### Restore Failures
```bash
# Check container logs
docker logs mono-postgres-1

# Verify backup integrity
gunzip -t backups/latest/*.gz
```

## Emergency Recovery

If all else fails:

1. **Check Docker's volume directory**
   ```bash
   # Linux
   /var/lib/docker/volumes/
   
   # macOS
   ~/Library/Containers/com.docker.docker/Data/vms/0/
   ```

2. **Use volume inspection**
   ```bash
   docker volume inspect postgres_data
   # Note the "Mountpoint" path
   ```

3. **Direct volume access**
   ```bash
   docker run --rm -v postgres_data:/data alpine ls -la /data
   ```

## Summary

To ensure your Docker databases are truly persistent:

1. ✅ Use named volumes (already implemented)
2. ✅ Run regular automated backups
3. ✅ Test restore procedures regularly
4. ✅ Never use `docker-compose down -v`
5. ✅ Consider host mounts for critical data
6. ✅ Implement off-site backups for production

With this strategy, your data will survive:
- Container restarts ✓
- Docker restarts ✓
- System reboots ✓
- Accidental volume deletion ✓ (via backups)
- Hardware failures ✓ (with off-site backups)