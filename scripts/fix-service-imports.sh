#!/bin/bash

echo "🔧 Fixing incorrect service import paths..."

# Find all files with wrong service import paths and replace them
find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec sed -i '' 's|../../../services/|@/services/|g' {} \;

echo "✅ Fixed all service import paths"

# Count how many files were affected
fixed_count=$(find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec grep -l "@/services/" {} \; | wc -l)
echo "📊 Total files with correct service imports: $fixed_count"