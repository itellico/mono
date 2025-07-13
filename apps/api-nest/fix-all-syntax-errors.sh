#!/bin/bash

# Fix all syntax errors from disable-missing-models script
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing syntax errors in all service files..."

# Find all files with broken Promise.all syntax and fix them
find . -name "*.service.ts" -exec grep -l "// this.prisma\." {} \; | while read file; do
  echo "Fixing $file..."
  
  # Create a temporary file with fixes
  cp "$file" "$file.bak"
  
  # Use perl for more complex multi-line fixes
  perl -i -pe '
    # Fix Promise.all with commented prisma calls
    if (/const \[.*\] = await Promise\.all\(\[/) {
      $in_promise = 1;
    }
    
    if ($in_promise && /\/\/ this\.prisma\./) {
      # Replace commented prisma calls with empty arrays or nulls
      if (/findMany|findFirst|find/) {
        s/\/\/ this\.prisma\.[^(]+\([^)]*\),?/\[\],/;
      } elsif (/count/) {
        s/\/\/ this\.prisma\.[^(]+\([^)]*\),?/0,/;
      } elsif (/findUnique/) {
        s/\/\/ this\.prisma\.[^(]+\([^)]*\),?/null,/;
      }
    }
    
    if ($in_promise && /\]\);/) {
      $in_promise = 0;
    }
  ' "$file"
  
  # Fix standalone commented prisma calls
  sed -i '' \
    -e 's/const [a-zA-Z]* = await \/\/ this\.prisma\.[^;]*;/const result = null;/g' \
    -e 's/await \/\/ this\.prisma\.[^;]*;/\/\/ await this.prisma...;/g' \
    "$file"
done

# Fix specific analytics.service.ts issues
echo "Fixing analytics.service.ts specifically..."
sed -i '' \
  -e '76,84s/\/\/ this\.prisma\.audit_logs\.findMany({.*orderBy: { created_at: '\''desc'\'' },.*include: { user: true },.*}),/\[\],/' \
  -e '83s/\/\/ this\.prisma\.audit_logs\.count({ where }),/0,/' \
  modules/account/services/analytics.service.ts

# Fix billing.service.ts
echo "Fixing billing.service.ts..."
sed -i '' \
  -e 's/\/\/ this\.prisma\.subscription\./\[\]; \/\/ this.prisma.subscription./g' \
  -e 's/\/\/ this\.prisma\.invoice\./\[\]; \/\/ this.prisma.invoice./g' \
  -e 's/\/\/ this\.prisma\.paymentMethod\./\[\]; \/\/ this.prisma.paymentMethod./g' \
  modules/account/services/billing.service.ts

# Fix users.service.ts
echo "Fixing users.service.ts..."
find . -name "users.service.ts" -exec sed -i '' \
  -e 's/const roles = await \/\/ this\.prisma\.[^;]*;/const roles = [];/g' \
  -e 's/const permissions = await \/\/ this\.prisma\.[^;]*;/const permissions = [];/g' \
  {} \;

# Fix platform services
echo "Fixing platform services..."
find modules/platform/services -name "*.service.ts" -exec sed -i '' \
  -e 's/\/\/ this\.prisma\.modelSchema\./0; \/\/ this.prisma.modelSchema./g' \
  -e 's/\/\/ this\.prisma\.workflow\./\[\]; \/\/ this.prisma.workflow./g' \
  -e 's/\/\/ this\.prisma\.integration\./\[\]; \/\/ this.prisma.integration./g' \
  -e 's/\/\/ this\.prisma\.modelDefinition\./\[\]; \/\/ this.prisma.modelDefinition./g' \
  {} \;

echo "Syntax error fixes complete!"