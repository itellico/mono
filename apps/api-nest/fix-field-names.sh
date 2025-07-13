#!/bin/bash

# Fix field name mismatches in TypeScript files
# Convert camelCase to snake_case for Prisma field names

cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing field name mismatches..."

# Common field name replacements
find . -name "*.ts" -exec sed -i '' 's/tenantId:/tenant_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/accountId:/account_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/userId:/user_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/roleId:/role_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/permissionId:/permission_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/createdAt:/created_at:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/updatedAt:/updated_at:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/isActive:/is_active:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/isVerified:/is_verified:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/passwordHash:/password_hash:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/firstName:/first_name:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/lastName:/last_name:/g' {} \;

# Fix in where clauses
find . -name "*.ts" -exec sed -i '' 's/{ tenantId:/{ tenant_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/{ accountId:/{ account_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/{ userId:/{ user_id:/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/{ roleId:/{ role_id:/g' {} \;

# Fix parseInt calls
find . -name "*.ts" -exec sed -i '' 's/parseInt(tenantId)/parseInt(tenantId)/g' {} \;

echo "Field name fixes applied!"