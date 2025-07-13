#!/bin/bash

# Fix all Promise.all syntax errors
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing Promise.all syntax errors..."

# Find files with broken Promise.all patterns
find . -name "*.service.ts" -exec grep -l "Promise.all" {} \; | while read file; do
  echo "Fixing Promise.all in $file..."
  
  # Use Python to fix multi-line Promise.all patterns
  python3 -c "
import re

with open('$file', 'r') as f:
    content = f.read()

# Fix Promise.all patterns with commented Prisma calls
# Pattern 1: Replace broken auditLog.count patterns
content = re.sub(
    r'// this\.prisma\.auditLog\.count\(\{[\s\S]*?\}\)\),',
    'Promise.resolve(0),',
    content,
    flags=re.MULTILINE
)

# Pattern 2: Replace other broken Prisma patterns inside Promise.all
content = re.sub(
    r'// this\.prisma\.\w+\.\w+\(\{[\s\S]*?\}\)\),',
    'Promise.resolve(null),',
    content,
    flags=re.MULTILINE
)

# Pattern 3: Fix standalone patterns
content = re.sub(
    r'// this\.prisma\.\w+\.findMany\(\{[\s\S]*?\}\);',
    '[];',
    content,
    flags=re.MULTILINE
)

content = re.sub(
    r'// this\.prisma\.\w+\.count\(\{[\s\S]*?\}\);',
    '0;',
    content,
    flags=re.MULTILINE
)

# Pattern 4: Fix broken Promise.all array items
content = re.sub(
    r'^\s*where: \{[\s\S]*?\},\s*\}\),?\s*$',
    '  Promise.resolve(0),',
    content,
    flags=re.MULTILINE
)

with open('$file', 'w') as f:
    f.write(content)
" || echo "Failed to process $file"
done

# Manual fixes for platform.service.ts
echo "Applying manual fixes to platform.service.ts..."
sed -i '' \
  -e '347,352s/\/\/ this\.prisma\.auditLog\.count({.*}),/Promise.resolve(0),/' \
  -e '353,358s/\/\/ this\.prisma\.auditLog\.count({.*}),/Promise.resolve(0),/' \
  -e '359,364s/\/\/ this\.prisma\.auditLog\.count({.*}),/Promise.resolve(0),/' \
  modules/platform/platform.service.ts

# Fix tenant services
echo "Fixing tenant service files..."
find modules/tenant/services -name "*.service.ts" -exec sed -i '' \
  -e 's/\/\/ this\.prisma\.\([a-zA-Z]*\)\.findMany({[^}]*});/\[\]; \/\/ await this.prisma.\1.findMany({ ... });/g' \
  -e 's/\/\/ this\.prisma\.\([a-zA-Z]*\)\.count({[^}]*});/0; \/\/ await this.prisma.\1.count({ ... });/g' \
  -e 's/\/\/ this\.prisma\.\([a-zA-Z]*\)\.findFirst({[^}]*});/null; \/\/ await this.prisma.\1.findFirst({ ... });/g' \
  {} \;

echo "Promise.all fixes complete!"