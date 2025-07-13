#!/bin/bash

echo "🔧 Fixing incorrect UUID import paths..."

# Find all files with the wrong import path and replace them
find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec sed -i '' 's|../../../../../../../../src/lib/types/uuid|@/types/uuid|g' {} \;

echo "✅ Fixed all UUID import paths"

# Count how many files were affected
fixed_count=$(find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec grep -l "@/types/uuid" {} \; | wc -l)
echo "📊 Total files with correct UUID imports: $fixed_count"