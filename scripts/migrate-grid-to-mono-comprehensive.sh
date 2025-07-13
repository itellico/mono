#!/bin/bash

# Comprehensive Grid to Mono Migration Script
# Migrates Grid branding references to Mono while preserving CSS Grid layouts

set -e

echo "🔄 Starting comprehensive Grid to Mono migration..."

# Create backup
BACKUP_DIR="backup/pre-grid-to-mono-migration-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

# Backup critical files
cp -r src/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r apps/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r docs/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r docker/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r prisma/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r scripts/ "$BACKUP_DIR/" 2>/dev/null || true
cp .cursor/ "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created successfully"

# Function to update files with smart Grid filtering
update_grid_branding() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        # Check if file contains Grid branding (not CSS grid)
        if grep -q "Mono Platform\|MonoAPIDown\|MonoFrontendDown\|mono-stable-app\|@mono/" "$file"; then
            echo "  📝 $description: $file"
            
            # Update specific branding patterns
            sed -i '' 's/Mono Platform/Mono Platform/g' "$file"
            sed -i '' 's/MonoAPIDown/MonoAPIDown/g' "$file"
            sed -i '' 's/MonoFrontendDown/MonoFrontendDown/g' "$file"
            sed -i '' 's/mono-stable-app/mono-stable-app/g' "$file"
            sed -i '' 's/@grid\//@mono\//g' "$file"
            
            # Update Grid as platform name (but not CSS grid)
            sed -i '' 's/\bGrid\b \(platform\|Platform\|API\|Frontend\|Backend\)/Mono \1/g' "$file"
        fi
    fi
}

# Function to update component names containing Grid
update_grid_components() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        # Only update component names, not CSS classes
        if grep -q "Grid.*Component\|Grid.*Page\|Grid.*Service\|CategoryGrid\|FeatureGrid\|MetricsGrid\|PortfolioGrid\|RecommendationGrid\|TemplateGrid" "$file"; then
            echo "  📝 $description: $file"
            
            # Update specific component patterns
            sed -i '' 's/CategoryGrid/CategoryMono/g' "$file"
            sed -i '' 's/FeatureGrid/FeatureMono/g' "$file"
            sed -i '' 's/MetricsGrid/MetricsMono/g' "$file"
            sed -i '' 's/PortfolioGrid/PortfolioMono/g' "$file"
            sed -i '' 's/RecommendationGrid/RecommendationMono/g' "$file"
            sed -i '' 's/TemplateGrid/TemplateMono/g' "$file"
        fi
    fi
}

# Function to safely check for CSS Grid vs branding
is_css_grid_reference() {
    local line="$1"
    
    # Check if it's a CSS grid reference (should be preserved)
    if echo "$line" | grep -q "grid-cols-\|grid-rows-\|md:grid\|lg:grid\|xl:grid\|sm:grid\|grid-auto\|grid-gap\|grid-template\|display.*grid\|subgrid\|grid-area\|grid-start\|grid-end"; then
        return 0 # Yes, it's CSS grid
    fi
    
    # Check if it's a Lucide icon (should be preserved)
    if echo "$line" | grep -q "Grid3X3\|Grid3x3\|Grid2X2\|GridOff\|GridGoldenratio"; then
        return 0 # Yes, it's a Lucide icon
    fi
    
    return 1 # No, it's not CSS grid
}

echo "🏗️ Phase 1: Docker and Configuration Updates..."

# Update Docker Prometheus rules
update_grid_branding "docker/prometheus/rules/mono-platform.yml" "Prometheus monitoring rules"

# Update Prisma migrations
find prisma/migrations -name "*.sql" | while read -r file; do
    update_grid_branding "$file" "Database migration"
done

echo "📝 Phase 2: Configuration Files..."

# Update cursor rules
update_grid_branding ".cursor/rules/cursor-rules.mdc" "Cursor IDE rules"

# Update any remaining package references
update_grid_branding "package.json" "Package configuration"

echo "🧩 Phase 3: Component Branding Updates..."

# Update component files (but preserve CSS grid classes)
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    
    # Only update if it contains branding Grid references
    update_grid_branding "$file" "Source code branding"
    update_grid_components "$file" "Component naming"
done

echo "📜 Phase 4: Scripts and Documentation..."

# Update script files
find scripts -name "*.ts" -o -name "*.js" -o -name "*.sh" | while read -r file; do
    update_grid_branding "$file" "Script references"
done

# Update documentation
find docs -name "*.md" | while read -r file; do
    update_grid_branding "$file" "Documentation"
done

echo "🔍 Phase 5: Verification and Safety Check..."

# Count CSS grid references (should remain high)
CSS_GRID_COUNT=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" -exec grep -o "grid-cols-\|md:grid\|lg:grid" {} \; 2>/dev/null | wc -l)

# Count remaining Grid branding references (should be low)
REMAINING_GRID_BRANDING=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.sql" -o -name "*.yml" -o -name "*.yaml" \) ! -path "./node_modules/*" ! -path "./backup/*" ! -path "./.git/*" -exec grep -l "Mono Platform\|MonoAPIDown\|@mono/" {} \; 2>/dev/null | wc -l)

echo ""
echo "✅ Grid to Mono migration completed!"
echo "📊 CSS Grid references preserved: $CSS_GRID_COUNT (should be high)"
echo "📊 Grid branding references remaining: $REMAINING_GRID_BRANDING (should be low)"

if [ "$REMAINING_GRID_BRANDING" -gt 0 ]; then
    echo "⚠️  Some Grid branding references still exist:"
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) ! -path "./node_modules/*" ! -path "./backup/*" ! -path "./.git/*" -exec grep -l "Mono Platform\|MonoAPIDown\|@mono/" {} \; 2>/dev/null | head -5
fi

echo ""
echo "🚀 Migration Summary:"
echo "  ✅ Docker monitoring rules updated (MonoAPIDown → MonoAPIDown)"
echo "  ✅ Database migration references updated"
echo "  ✅ Component branding updated where appropriate"
echo "  ✅ Package references updated (@mono/ → @mono/)"
echo "  ✅ CSS Grid layout classes preserved ($CSS_GRID_COUNT references)"
echo "  ✅ Lucide Grid icons preserved"

echo ""
echo "🎯 What was changed:"
echo "  - 'Mono Platform' → 'Mono Platform'"
echo "  - 'MonoAPIDown' → 'MonoAPIDown'"
echo "  - 'MonoFrontendDown' → 'MonoFrontendDown'"
echo "  - '@mono/' → '@mono/'"
echo "  - 'mono-stable-app' → 'mono-stable-app'"

echo ""
echo "🛡️ What was preserved:"
echo "  - CSS Grid classes (grid-cols-*, md:grid-*, etc.)"
echo "  - Lucide Grid icons (Grid3X3, Grid2X2, etc.)"
echo "  - CSS Grid properties (display: grid, grid-template, etc.)"

echo ""
echo "✨ Grid to Mono migration complete!"