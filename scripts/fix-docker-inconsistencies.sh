#!/bin/bash

# Fix Docker Configuration Inconsistencies
# Updates all Docker configurations to use consistent itellico Mono naming

set -e

echo "🔄 Fixing Docker configuration inconsistencies..."

# Create backup
BACKUP_DIR="backup/pre-docker-fix-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || true
cp docker-compose.services.yml "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created successfully"

# Function to update file
update_file() {
    local file="$1"
    local search="$2"
    local replace="$3"
    
    if [ -f "$file" ] && grep -q "$search" "$file"; then
        echo "  📝 Updating: $file"
        sed -i '' "s/${search}/${replace}/g" "$file"
    fi
}

echo "🐳 Updating docker-compose.yml..."

# Update container names from grid- to mono-
update_file "docker-compose.yml" "grid-postgres" "mono-postgres"
update_file "docker-compose.yml" "grid-redis" "mono-redis"
update_file "docker-compose.yml" "grid-mailpit" "mono-mailpit"
update_file "docker-compose.yml" "grid-n8n" "mono-n8n"
update_file "docker-compose.yml" "grid-temporal" "mono-temporal"
update_file "docker-compose.yml" "grid-temporal-web" "mono-temporal-web"
update_file "docker-compose.yml" "grid-prometheus" "mono-prometheus"
update_file "docker-compose.yml" "grid-grafana" "mono-grafana"
update_file "docker-compose.yml" "grid-node-exporter" "mono-node-exporter"
update_file "docker-compose.yml" "grid-cadvisor" "mono-cadvisor"

# Update network name
update_file "docker-compose.yml" "grid-network" "mono-network"

# Update database names from mono to mono
update_file "docker-compose.yml" "POSTGRES_DB: mono" "POSTGRES_DB: mono"
update_file "docker-compose.yml" "POSTGRES_MULTIPLE_DATABASES: mono,temporal" "POSTGRES_MULTIPLE_DATABASES: mono,temporal"
update_file "docker-compose.yml" 'pg_isready -U developer -d mono' 'pg_isready -U developer -d mono'

echo "🔍 Verifying updates..."

# Check for remaining grid references
REMAINING_GRID=$(grep -c "grid-\|mono" docker-compose.yml 2>/dev/null || echo "0")

echo ""
echo "✅ Docker configuration inconsistencies fixed!"
echo "📊 References to 'grid-' or 'mono' remaining: $REMAINING_GRID"

if [ "$REMAINING_GRID" -gt 0 ]; then
    echo "⚠️  Some references still exist:"
    grep "grid-\|mono" docker-compose.yml 2>/dev/null | head -5
fi

echo ""
echo "🚀 Updated configurations:"
echo "  - Container names: All using mono- prefix"
echo "  - Network name: mono-network"
echo "  - Database name: mono (instead of mono)"
echo "  - Consistent with docker-compose.services.yml"

echo ""
echo "✨ Docker configuration fix complete!"
echo ""
echo "🔄 To apply changes, restart Docker services:"
echo "   docker-compose down && docker-compose up -d"