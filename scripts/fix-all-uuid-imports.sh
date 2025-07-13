#!/bin/bash

echo "🔧 Fixing ALL incorrect UUID import paths..."

# Fix various wrong import path patterns
find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*apps/src/lib/types/uuid|@/types/uuid|g' {} \;
find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*src/lib/types/uuid|@/types/uuid|g' {} \;
find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*/lib/types/uuid|@/types/uuid|g' {} \;

echo "✅ Fixed all UUID import paths"

# Count how many files have correct UUID imports now
correct_count=$(find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec grep -l "@/types/uuid" {} \; | wc -l)
echo "📊 Total files with correct UUID imports: $correct_count"

# Check for any remaining wrong patterns
wrong_count=$(find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec grep -l "types/uuid" {} \; | grep -v "@/types/uuid" | wc -l)
echo "⚠️  Files with potentially incorrect imports: $wrong_count"

if [ $wrong_count -gt 0 ]; then
  echo "🔍 Files that might still have wrong imports:"
  find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec grep -l "types/uuid" {} \; | grep -v "@/types/uuid" | head -5
fi