#!/bin/bash

# ==========================================
# GRID MIGRATION VERIFICATION SCRIPT
# ==========================================
# 
# This script verifies that the Mono → Grid migration was successful
# and identifies any remaining references that need manual attention.
#

set -e

echo "🔍 Grid Migration Verification Report"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📊 MIGRATION STATISTICS:"
echo "------------------------"

# Count Grid references (should be high)
grid_files=$(find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
    -exec grep -l -i "grid" {} \; 2>/dev/null | wc -l)
grid_refs=$(find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
    -exec grep -i "grid" {} \; 2>/dev/null | wc -l)

echo "✅ Files containing 'Grid': $grid_files"
echo "✅ Total 'Grid' references: $grid_refs"

# Count remaining Mono references (should be low/zero)
mono_files=$(find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
    -exec grep -l -i "mono" {} \; 2>/dev/null | wc -l)
mono_refs=$(find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
    -exec grep -i "mono" {} \; 2>/dev/null | wc -l)

echo "⚠️  Files still containing 'Mono': $mono_files"
echo "⚠️  Total remaining 'Mono' references: $mono_refs"

echo ""
echo "🎯 KEY FILE VERIFICATION:"
echo "------------------------"

# Check critical files
critical_files=(
    "./package.json"
    "./apps/api/package.json"
    "./CLAUDE.md"
    "./README.md"
    "./docker-compose.yml"
    "./apps/api/src/config/swagger.config.ts"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        mono_count=$(grep -i "mono" "$file" 2>/dev/null | wc -l)
        grid_count=$(grep -i "grid" "$file" 2>/dev/null | wc -l)
        
        if [ "$mono_count" -eq 0 ] && [ "$grid_count" -gt 0 ]; then
            echo "✅ $file - Migration successful"
        elif [ "$mono_count" -eq 0 ] && [ "$grid_count" -eq 0 ]; then
            echo "⚠️  $file - No references (may need manual check)"
        else
            echo "❌ $file - Still contains $mono_count 'Mono' references"
        fi
    else
        echo "⚠️  $file - File not found"
    fi
done

if [ "$mono_files" -gt 0 ]; then
    echo ""
    echo "🔍 REMAINING mono REFERENCES:"
    echo "-----------------------------"
    echo "Files that still contain 'Mono' (first 20):"
    find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
        -exec grep -l -i "mono" {} \; 2>/dev/null | head -20
    
    echo ""
    echo "📄 Sample remaining references:"
    find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
        -exec grep -i "mono" {} \; 2>/dev/null | head -10
fi

echo ""
echo "🧪 PROJECT HEALTH CHECK:"
echo "------------------------"

# Check if package.json is valid
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
    echo "✅ Root package.json is valid JSON"
else
    echo "❌ Root package.json has syntax errors"
fi

# Check if API package.json is valid
if [ -f "apps/api/package.json" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('apps/api/package.json', 'utf8'))" 2>/dev/null; then
        echo "✅ API package.json is valid JSON"
    else
        echo "❌ API package.json has syntax errors"
    fi
fi

# Check docker-compose syntax
if [ -f "docker-compose.yml" ]; then
    if command -v docker-compose &> /dev/null; then
        if docker-compose config &> /dev/null; then
            echo "✅ docker-compose.yml syntax is valid"
        else
            echo "❌ docker-compose.yml has syntax errors"
        fi
    else
        echo "⚠️  docker-compose not installed, skipping validation"
    fi
fi

echo ""
echo "📋 RECOMMENDED NEXT STEPS:"
echo "-------------------------"

if [ "$mono_refs" -eq 0 ]; then
    echo "🎉 MIGRATION COMPLETE! All Mono references successfully replaced."
    echo ""
    echo "✅ Next steps:"
    echo "1. Regenerate package locks: rm package-lock.json pnpm-lock.yaml && pnpm install"
    echo "2. Rebuild the project: pnpm run build"
    echo "3. Run tests: pnpm test"
    echo "4. Update your local development environment"
    echo "5. Update DNS/domain configurations"
    echo "6. Commit changes to git"
else
    echo "⚠️  Manual review needed for remaining Mono references."
    echo ""
    echo "🔧 Recommended actions:"
    echo "1. Review the files listed above"
    echo "2. Manually update any intentional references"
    echo "3. Check for case-sensitive matches (mono, Mono, mono)"
    echo "4. Review git history/commit messages if needed"
    echo "5. Re-run this verification script after manual fixes"
fi

echo ""
echo "🔄 To re-run migration: ./scripts/migrate-mono-to-grid.sh"
echo "🔍 To re-run verification: ./scripts/verify-grid-migration.sh"
echo ""
echo "📊 SUMMARY: $grid_refs Grid references, $mono_refs Mono references remaining"

# Exit with error code if Mono references remain
if [ "$mono_refs" -gt 0 ]; then
    exit 1
else
    exit 0
fi