#!/bin/bash

# Script to migrate "Mono Platform" to "itellico Grid"
# Created: July 2025

set -e

echo "🔄 Starting migration from 'Mono Platform' to 'itellico Grid'..."

# Create backup timestamp
BACKUP_DIR="backup/pre-itellico-migration-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

# Backup critical files before migration
cp -r docker/ "$BACKUP_DIR/" 2>/dev/null || true
cp CLAUDE.md "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created successfully"

# Function to replace in file with verification
replace_in_file() {
    local file="$1"
    if [ -f "$file" ] && grep -q "Mono Platform" "$file"; then
        echo "  📝 Updating: $file"
        sed -i '' 's/Mono Platform/itellico Grid/g' "$file"
    fi
}

# Function to replace in all files in directory
replace_in_directory() {
    local dir="$1"
    local extensions="$2"
    
    echo "🔍 Processing directory: $dir"
    find "$dir" -type f $extensions ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/backup/*" ! -path "*/.next/*" -exec grep -l "Mono Platform" {} \; | while read -r file; do
        replace_in_file "$file"
    done
}

# Replace in documentation files
echo "📚 Updating documentation files..."
replace_in_directory "docs" "-name '*.md'"
replace_in_directory "development" "-name '*.md'"

# Replace in source code files  
echo "💻 Updating source code files..."
replace_in_directory "src" "-name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx'"
replace_in_directory "apps" "-name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx'"

# Replace in configuration files
echo "⚙️ Updating configuration files..."
replace_in_directory "." "-name '*.json' -o -name '*.yml' -o -name '*.yaml' -maxdepth 2"
replace_in_directory "docker" "-name '*.json' -o -name '*.yml' -o -name '*.yaml'"
replace_in_directory "scripts" "-name '*.ts' -o -name '*.js'"

# Update specific important files
echo "🎯 Updating critical files..."
replace_in_file "CLAUDE.md"
replace_in_file "CLAUDE_IMPROVED.md"
replace_in_file "middleware.ts"
replace_in_file "platform.config.js"

# Update Grafana dashboards to use "itellico Grid" titles
echo "📊 Updating Grafana dashboard titles..."
find docker/grafana/dashboards -name "*.json" -exec grep -l "Mono Platform" {} \; | while read -r file; do
    echo "  📊 Updating Grafana dashboard: $file"
    sed -i '' 's/"title": "Mono Platform/"title": "itellico Grid/g' "$file"
    sed -i '' 's/"Mono Platform/"itellico Grid/g' "$file"
done

# Update Prometheus rules
echo "🔍 Updating Prometheus rules..."
if [ -f "docker/prometheus/rules/mono-platform.yml" ]; then
    echo "  📈 Updating Prometheus rules"
    sed -i '' 's/Mono Platform/itellico Grid/g' "docker/prometheus/rules/mono-platform.yml"
fi

# Update API documentation titles
echo "🌐 Updating API documentation..."
find apps/api -name "*.ts" -exec grep -l "Mono Platform" {} \; | while read -r file; do
    replace_in_file "$file"
done

# Verify the changes
echo "🔍 Verifying migration..."
REMAINING=$(find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./apps/api/dist/*" ! -path "./logs/*" ! -path "./backup/*" ! -path "./.next/*" -exec grep -l "Mono Platform" {} \; | wc -l)

echo ""
echo "✅ Migration from 'Mono Platform' to 'itellico Grid' completed!"
echo "📊 Files still containing 'Mono Platform': $REMAINING"

if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Some files still contain 'Mono Platform'. Running additional cleanup..."
    find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./apps/api/dist/*" ! -path "./logs/*" ! -path "./backup/*" ! -path "./.next/*" -exec grep -l "Mono Platform" {} \; | head -10
fi

echo ""
echo "🚀 Next steps:"
echo "  1. Test the services: npm run dev"
echo "  2. Check Grafana dashboards: http://localhost:5005"
echo "  3. Verify API docs: http://localhost:3001/docs"
echo "  4. Review CLAUDE.md for any remaining references"

echo ""
echo "✨ itellico Grid migration complete!"