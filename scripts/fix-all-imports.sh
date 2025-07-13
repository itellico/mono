#!/bin/bash

echo "🔧 Fixing ALL incorrect import paths in route files..."

# Fix all relative import patterns to use the @/ alias
cd ./apps/api

echo "📁 Fixing types imports..."
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*types/|@/types/|g' {} \;

echo "📁 Fixing services imports..."  
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*services/|@/services/|g' {} \;

echo "📁 Fixing utils imports..."
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*utils/|@/utils/|g' {} \;

echo "📁 Fixing lib imports..."
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*lib/|@/lib/|g' {} \;

echo "📁 Fixing config imports..."
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*config/|@/config/|g' {} \;

echo "📁 Fixing plugins imports..."
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*plugins/|@/plugins/|g' {} \;

echo "📁 Fixing schemas imports..."
find src/routes -name "*.ts" -exec sed -i '' -E 's|[./]*schemas/|@/schemas/|g' {} \;

echo "✅ Fixed all import paths"

# Count corrected files
correct_count=$(find src/routes -name "*.ts" -exec grep -l "@/" {} \; | wc -l)
echo "📊 Total files with correct @/ imports: $correct_count"