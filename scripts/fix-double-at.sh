#!/bin/bash

echo "🔧 Fixing double @@ symbols in import paths..."

cd /Users/mm2/dev_mm/mono/apps/api

# Fix double @@ back to single @
find src/routes -name "*.ts" -exec sed -i '' 's|@@/|@/|g' {} \;

echo "✅ Fixed all double @@ import paths"

# Count fixed files
fixed_count=$(find src/routes -name "*.ts" -exec grep -l "@/" {} \; | wc -l)
echo "📊 Total files with correct @/ imports: $fixed_count"