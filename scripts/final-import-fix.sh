#!/bin/bash

echo "🔧 Final comprehensive import path fix..."

cd /Users/mm2/dev_mm/mono/apps/api

# Fix malformed relative + absolute paths
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*@/|@/|g' {} \;

# Fix any other malformed patterns
find src/routes -name "*.ts" -exec sed -i '' -E 's|from ['\''"][./]*([^@].*)/types/|from "@/types/|g' {} \;
find src/routes -name "*.ts" -exec sed -i '' -E 's|from ['\''"][./]*([^@].*)/services/|from "@/services/|g' {} \;
find src/routes -name "*.ts" -exec sed -i '' -E 's|from ['\''"][./]*([^@].*)/utils/|from "@/utils/|g' {} \;

echo "✅ Final import path fixes complete"

# Verify corrections
echo "📊 Checking for remaining malformed imports..."
malformed=$(find src/routes -name "*.ts" -exec grep -l "\..*@/" {} \; | wc -l)
echo "⚠️  Files with malformed imports: $malformed"

if [ $malformed -gt 0 ]; then
  echo "🔍 Sample malformed imports:"
  find src/routes -name "*.ts" -exec grep -l "\..*@/" {} \; | head -3 | xargs grep "\..*@/"
fi

correct=$(find src/routes -name "*.ts" -exec grep -l "from '@/" {} \; | wc -l)
echo "✅ Files with correct imports: $correct"