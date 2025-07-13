#!/bin/bash

# Update Monitoring Labels from Mono to itellico Mono
# Updates Grafana, Prometheus, and other monitoring configurations

set -e

echo "🔄 Updating monitoring labels from Mono to itellico Mono..."

# Create backup
BACKUP_DIR="backup/pre-monitoring-update-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r docker/grafana/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r docker/prometheus/ "$BACKUP_DIR/" 2>/dev/null || true

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

# Update Prometheus job names
echo "📊 Updating Prometheus configurations..."
update_file "docker/prometheus/prometheus.yml" "mono-api" "mono-api"
update_file "docker/prometheus/prometheus.yml" "mono-frontend" "mono-frontend"

# Update Prometheus rules file name and content
if [ -f "docker/prometheus/rules/mono-platform.yml" ]; then
    echo "  📝 Renaming and updating Prometheus rules file..."
    mv "docker/prometheus/rules/mono-platform.yml" "docker/prometheus/rules/mono-platform.yml"
    update_file "docker/prometheus/rules/mono-platform.yml" "mono-platform" "mono-platform"
    update_file "docker/prometheus/rules/mono-platform.yml" "mono-api" "mono-api" 
    update_file "docker/prometheus/rules/mono-platform.yml" "mono-frontend" "mono-frontend"
fi

# Update Grafana dashboard job references
echo "📈 Updating Grafana dashboard configurations..."

# Update job references in all dashboards
find docker/grafana/dashboards -name "*.json" -exec sed -i '' 's/job="mono-api"/job="mono-api"/g' {} \;
find docker/grafana/dashboards -name "*.json" -exec sed -i '' 's/job="mono-frontend"/job="mono-frontend"/g' {} \;

# Update tags in dashboards
find docker/grafana/dashboards -name "*.json" -exec sed -i '' 's/"mono-platform"/"itellico-mono"/g' {} \;

# Update metric names (keeping the mono_ prefix in metric names as these come from the app)
# Note: We'll keep mono_ prefixes in actual metric names since changing those requires app changes
# But we'll update labels and descriptions

# Update dashboard-specific items
update_file "docker/grafana/dashboards/mono-platform-overview.json" '"uid": "mono-overview"' '"uid": "mono-overview"'

# Rename the overview dashboard file
if [ -f "docker/grafana/dashboards/mono-platform-overview.json" ]; then
    echo "  📝 Renaming overview dashboard file..."
    mv "docker/grafana/dashboards/mono-platform-overview.json" "docker/grafana/dashboards/mono-platform-overview.json"
fi

# Update dashboard titles and descriptions to be more generic
echo "📊 Updating dashboard titles and descriptions..."

# Update overview dashboard
if [ -f "docker/grafana/dashboards/mono-platform-overview.json" ]; then
    sed -i '' 's/"title": "itellico Mono Overview"/"title": "Platform Overview"/g' "docker/grafana/dashboards/mono-platform-overview.json"
fi

# Update other dashboards
find docker/grafana/dashboards -name "*.json" -exec sed -i '' 's/itellico Mono/Platform/g' {} \;

# Verify changes
echo "🔍 Verifying updates..."
REMAINING_mono=$(grep -r "mono-api\|mono-frontend\|mono-platform" docker/grafana docker/prometheus 2>/dev/null | wc -l)

echo ""
echo "✅ Monitoring labels updated successfully!"
echo "📊 References to 'mono-*' remaining: $REMAINING_mono"

if [ "$REMAINING_mono" -gt 0 ]; then
    echo "⚠️  Some references still exist:"
    grep -r "mono-api\|mono-frontend\|mono-platform" docker/grafana docker/prometheus 2>/dev/null | head -5
fi

echo ""
echo "🚀 Updated configurations:"
echo "  - Prometheus jobs: mono-api, mono-frontend"
echo "  - Grafana dashboards: Updated job references and tags"
echo "  - Dashboard titles: Simplified to 'Platform' branding"
echo "  - Rules file: Renamed to mono-platform.yml"

echo ""
echo "✨ Monitoring update complete!"