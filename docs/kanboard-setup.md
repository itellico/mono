# Kanboard Setup with Mattermost Plugin

## Overview
This guide explains how to set up Kanboard with the Mattermost integration plugin in the Mono Docker environment.

## Configuration Files Created

1. **Docker Configuration** (`docker-compose.yml` + `docker-compose.persistent.yml`)
   - Added Kanboard service configuration
   - Uses official `kanboard/kanboard:latest` image
   - Configured with PostgreSQL database connection
   - Data persisted in PostgreSQL (shared database)

2. **Kanboard Configuration** (`docker/kanboard/config.php`)
   - PostgreSQL database connection settings
   - Email configuration via Mailpit
   - Security and performance settings
   - Plugin directory configuration

3. **Nginx Proxy Configuration** (`docker/nginx/conf.d/clickdummy.conf`)
   - Proxy pass configuration for `/kanboard` path
   - WebSocket support for real-time features
   - Proper header forwarding

4. **Plugin Installation Script** (`scripts/install-kanboard-plugins.sh`)
   - Automated Mattermost plugin installation
   - Post-deployment configuration

## Setup Instructions

### 1. Start Kanboard Container
```bash
# Pull and start the Kanboard container with persistence
docker-compose -f docker-compose.yml -f docker-compose.persistent.yml up -d kanboard

# Verify it's running
docker-compose ps kanboard
```

### 2. Install Mattermost Plugin
```bash
# Run the plugin installation script
./scripts/install-kanboard-plugins.sh
```

### 3. Access Kanboard
- URL: http://192.168.178.94:4041
- Default credentials: `admin` / `admin123`
- Direct access without nginx proxy path

### 4. Configure Mattermost Integration

1. Log in to Kanboard as admin
2. Navigate to **Settings** → **Integrations**
3. Find the **Mattermost** section
4. Configure:
   - **Webhook URL**: Your Mattermost incoming webhook URL
   - **Channel**: The channel to post notifications (e.g., `#kanboard`)
   - **Username**: Bot username (e.g., `Kanboard`)

### 5. Create Mattermost Webhook

In Mattermost:
1. Go to **Main Menu** → **Integrations** → **Incoming Webhooks**
2. Click **Add Incoming Webhook**
3. Select the channel for Kanboard notifications
4. Copy the webhook URL
5. Paste it in Kanboard's Mattermost settings

## Features

### Mattermost Plugin Features
- Task creation notifications
- Task update notifications
- Comment notifications
- Due date reminders
- Assignee notifications

### Persistent Data
The following data is persisted across container restarts:
- Kanboard database (in PostgreSQL at `docker-data/databases/postgres/`)
- All project data, tasks, and user settings
- Configuration stored in database
- Plugins mounted from `docker/kanboard/plugins/`

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs kanboard

# Verify PostgreSQL is running
docker-compose ps postgres
```

### Plugin Not Loading
```bash
# Check plugin directory
docker-compose exec kanboard ls -la /var/www/app/plugins/

# Check permissions
docker-compose exec kanboard chown -R nginx:nginx /var/www/app/plugins/
```

### Database Connection Issues
```bash
# Verify kanboard database exists
docker-compose exec postgres psql -U developer -d postgres -c "\\l"

# Create database if missing
docker-compose exec postgres psql -U developer -d postgres -c "CREATE DATABASE kanboard;"
```

## Integration with Mono

Kanboard is integrated into the Mono development environment:
- Accessible via Nginx proxy at `/kanboard`
- Shares PostgreSQL database with other services
- Uses Mailpit for email notifications
- Monitored by Prometheus/Grafana stack

## Security Notes

1. **Change default credentials** immediately after first login
2. **Configure 2FA** for admin accounts
3. **Use strong webhook tokens** for Mattermost integration
4. **Restrict plugin installation** in production environments

## Additional Plugins

To install additional plugins:
```bash
docker-compose exec kanboard sh -c "
    cd /var/www/app/plugins && \
    curl -L [PLUGIN_URL] -o plugin.zip && \
    unzip plugin.zip && \
    rm plugin.zip && \
    chown -R nginx:nginx .
"
```

## Backup and Restore

### Backup
```bash
# All Kanboard data is in PostgreSQL
# Use the unified backup script:
./scripts/backup-docker-data.sh

# Or backup just Kanboard database:
docker-compose exec postgres pg_dump -U developer kanboard > kanboard_backup.sql
```

### Restore
```bash
# Restore from unified backup:
./scripts/restore-docker-data.sh backup-2025-01-11.tar.gz

# Or restore just Kanboard:
docker-compose exec -T postgres psql -U developer kanboard < kanboard_backup.sql
```

## Docker Persistence Note

Kanboard is part of the unified Docker persistence architecture:
- Database stored in `docker-data/databases/postgres/data/`
- All data persists across container restarts
- Included in automated backup scripts
- No separate volume management needed