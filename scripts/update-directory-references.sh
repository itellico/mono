#!/bin/bash

echo "🔄 Updating directory references from mono-stable-app to mono..."

# Function to update mono-stable-app references
update_mono_references() {
    local file="$1"
    if [ -f "$file" ]; then
        # Update absolute paths
        sed -i '' 's|/Users/mm2/dev_mm/go/mono-stable-app|/Users/mm2/dev_mm/mono|g' "$file"
        # Update relative paths with mono-stable-app
        sed -i '' 's|../mono-stable-app/|../mono/|g' "$file"
        sed -i '' 's|mono-stable-app/|mono/|g' "$file"
        echo "✅ Updated: $file"
    fi
}

# Update all files found in previous search
echo "📁 Updating remaining files..."

# Use find to locate all files that might contain old references
find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.sh" -o -name "*.ts" -o -name "*.js" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -exec grep -l "mono-stable-app" {} \; 2>/dev/null | while read file; do
        update_mono_references "$file"
done

echo ""
echo "🔍 Checking for any remaining absolute paths that should be relative..."

# Find any remaining absolute paths that could be made relative
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -exec grep -l "/Users/mm2/dev_mm/mono" {} \; 2>/dev/null | while read file; do
        echo "⚠️  File contains absolute paths: $file"
        echo "   Consider reviewing for relative path opportunities"
done

echo ""
echo "✅ Directory reference update complete!"
echo "💡 Tip: Review the files marked above to see if absolute paths can be made relative"