#!/bin/bash

echo "=== Setting up Persistent Docker Volumes ==="
echo ""

# Base directory for all volumes
VOLUME_BASE="/Users/mm2/dev_mm/mono/docker/volumes"

# Create directory structure
echo "Creating volume directories..."

# Database volumes
mkdir -p "$VOLUME_BASE/postgres"
mkdir -p "$VOLUME_BASE/redis"

# Kanboard specific
mkdir -p "$VOLUME_BASE/kanboard/data"
mkdir -p "$VOLUME_BASE/kanboard/plugins"

# Monitoring
mkdir -p "$VOLUME_BASE/grafana"
mkdir -p "$VOLUME_BASE/prometheus"

# Other services
mkdir -p "$VOLUME_BASE/redisinsight"
mkdir -p "$VOLUME_BASE/rabbitmq"
mkdir -p "$VOLUME_BASE/n8n"
mkdir -p "$VOLUME_BASE/temporal"

# Set proper permissions
echo "Setting permissions..."

# PostgreSQL needs specific UID/GID (999:999 for postgres user)
chown -R 999:999 "$VOLUME_BASE/postgres" 2>/dev/null || true

# Grafana needs UID 472
chown -R 472:472 "$VOLUME_BASE/grafana" 2>/dev/null || true

# Make Kanboard directories writable by PHP
chmod -R 755 "$VOLUME_BASE/kanboard"

echo ""
echo "✅ Persistent volume directories created at: $VOLUME_BASE"
echo ""
echo "Volume mapping:"
echo "  PostgreSQL data → $VOLUME_BASE/postgres"
echo "  Kanboard data   → $VOLUME_BASE/kanboard/data"
echo "  Kanboard plugins → $VOLUME_BASE/kanboard/plugins"
echo "  Redis data      → $VOLUME_BASE/redis"
echo "  Grafana data    → $VOLUME_BASE/grafana"
echo "  Prometheus data → $VOLUME_BASE/prometheus"
echo ""
echo "Next steps:"
echo "1. Stop your containers: docker-compose down"
echo "2. Start with override: docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d"
echo "3. Run the Kanboard migration: ./scripts/migrate-kanboard-to-postgres.sh"
echo ""
echo "To make the override permanent, add to your .env file:"
echo "COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml"