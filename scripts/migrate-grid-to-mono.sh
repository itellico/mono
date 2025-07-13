#!/bin/bash

# Script to migrate "itellico Grid" to "itellico Mono"
# Created: July 2025

set -e

echo "🔄 Starting migration from 'itellico Grid' to 'itellico Mono'..."

# Create backup timestamp
BACKUP_DIR="backup/pre-mono-migration-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

# Backup critical files before migration
cp -r docker/ "$BACKUP_DIR/" 2>/dev/null || true
cp CLAUDE.md "$BACKUP_DIR/" 2>/dev/null || true
cp CLAUDE_IMPROVED.md "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp docker-compose.services.yml "$BACKUP_DIR/" 2>/dev/null || true
cp -r start*.sh "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created successfully"

# Function to replace in file with verification
replace_in_file() {
    local file="$1"
    local search="$2"
    local replace="$3"
    
    if [ -f "$file" ] && grep -q "$search" "$file"; then
        echo "  📝 Updating: $file"
        sed -i '' "s/$search/$replace/g" "$file"
    fi
}

# Function to replace in all files in directory
replace_in_directory() {
    local dir="$1"
    local extensions="$2"
    local search="$3"
    local replace="$4"
    
    echo "🔍 Processing directory: $dir"
    find "$dir" -type f $extensions ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/backup/*" ! -path "*/.next/*" -exec grep -l "$search" {} \; | while read -r file; do
        replace_in_file "$file" "$search" "$replace"
    done
}

# Step 1: Replace "itellico Grid" with "itellico Mono"
echo "📚 Updating 'itellico Grid' to 'itellico Mono'..."
find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./apps/api/dist/*" ! -path "./logs/*" ! -path "./backup/*" ! -path "./.next/*" -print0 | xargs -0 sed -i '' 's/itellico Grid/itellico Mono/g'

# Step 2: Update Docker service names from grid- to mono-
echo "🐳 Updating Docker service names from 'grid-' to 'mono-'..."
replace_in_file "docker-compose.services.yml" "grid-" "mono-"
replace_in_file "docker-compose.services.yml" "container_name: grid" "container_name: mono"

# Update Grafana dashboard folder names
replace_in_file "docker/grafana/dashboards/dashboard-config.yml" "itellico Grid Dashboards" "itellico Mono Dashboards"
replace_in_file "docker/grafana/dashboards/dashboard-config.yml" "folder: 'itellico Grid'" "folder: 'itellico Mono'"

# Update Prometheus job names and descriptions
replace_in_file "docker/prometheus/prometheus.yml" "# itellico Grid API" "# itellico Mono API"
replace_in_file "docker/prometheus/prometheus.yml" "# itellico Grid Frontend" "# itellico Mono Frontend"
replace_in_file "docker/prometheus/prometheus.yml" "job_name: 'mono-api'" "job_name: 'mono-api'"
replace_in_file "docker/prometheus/prometheus.yml" "job_name: 'mono-frontend'" "job_name: 'mono-frontend'"

# Update Grafana dashboard descriptions
find docker/grafana/dashboards -name "*.json" -exec grep -l "itellico Grid" {} \; | while read -r file; do
    echo "  📊 Updating Grafana dashboard: $file"
    sed -i '' 's/"itellico Grid/"itellico Mono/g' "$file"
done

# Step 3: Update API documentation titles
echo "🌐 Updating API documentation..."
find apps/api/src/config -name "swagger*.ts" -exec grep -l "itellico Grid" {} \; | while read -r file; do
    replace_in_file "$file" "itellico Grid" "itellico Mono"
done

# Update health check descriptions
find apps/api/src -name "*.ts" -exec grep -l "itellico Grid" {} \; | while read -r file; do
    replace_in_file "$file" "itellico Grid" "itellico Mono"
done

# Step 4: Update documentation files
echo "📖 Updating documentation..."
replace_in_directory "docs" "-name '*.md'" "itellico Grid" "itellico Mono"
replace_in_directory "development" "-name '*.md'" "itellico Grid" "itellico Mono"

# Step 5: Update source code references
echo "💻 Updating source code..."
replace_in_directory "src" "-name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx'" "itellico Grid" "itellico Mono"
replace_in_directory "apps" "-name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx'" "itellico Grid" "itellico Mono"

# Step 6: Update scripts and configurations
echo "⚙️ Updating scripts and configurations..."
replace_in_directory "scripts" "-name '*.ts' -o -name '*.js'" "itellico Grid" "itellico Mono"
replace_in_directory "." "-name '*.json' -o -name '*.yml' -o -name '*.yaml' -maxdepth 2" "itellico Grid" "itellico Mono"

# Step 7: Update critical files
echo "🎯 Updating critical files..."
replace_in_file "CLAUDE.md" "itellico Grid" "itellico Mono"
replace_in_file "CLAUDE_IMPROVED.md" "itellico Grid" "itellico Mono"
replace_in_file "middleware.ts" "itellico Grid" "itellico Mono"
replace_in_file "platform.config.js" "itellico Grid" "itellico Mono"

# Step 8: Update Docker network name
echo "🌐 Updating Docker network names..."
replace_in_file "docker-compose.services.yml" "grid-network" "mono-network"

# Verify the changes
echo "🔍 Verifying migration..."
REMAINING_GRID=$(find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./apps/api/dist/*" ! -path "./logs/*" ! -path "./backup/*" ! -path "./.next/*" -exec grep -l "itellico Grid" {} \; | wc -l)

GRID_SERVICES=$(grep -c "grid-" docker-compose.services.yml 2>/dev/null || echo "0")

echo ""
echo "✅ Migration from 'itellico Grid' to 'itellico Mono' completed!"
echo "📊 Files still containing 'itellico Grid': $REMAINING_GRID"
echo "📊 Docker services still using 'grid-': $GRID_SERVICES"

if [ "$REMAINING_GRID" -gt 0 ] || [ "$GRID_SERVICES" -gt 0 ]; then
    echo "⚠️  Some references still exist. Running additional verification..."
    if [ "$REMAINING_GRID" -gt 0 ]; then
        echo "Files with 'itellico Grid':"
        find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./apps/api/dist/*" ! -path "./logs/*" ! -path "./backup/*" ! -path "./.next/*" -exec grep -l "itellico Grid" {} \; | head -5
    fi
    if [ "$GRID_SERVICES" -gt 0 ]; then
        echo "Docker services with 'grid-':"
        grep "grid-" docker-compose.services.yml | head -5
    fi
fi

echo ""
echo "🚀 Next steps:"
echo "  1. Update startup scripts with new domain strategy"
echo "  2. Create local domains setup script"
echo "  3. Test services: ./start-api.sh && ./start-frontend.sh"
echo "  4. Check Docker services: docker-compose -f docker-compose.services.yml up"

echo ""
echo "✨ itellico Mono migration complete!"