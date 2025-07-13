#!/bin/bash

# Fix variable name issues where function parameters were changed
# but the variable usage inside the function wasn't updated

cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing variable name mismatches..."

# Fix specific patterns where parameter names were changed but usage wasn't
find . -name "*.service.ts" -exec sed -i '' \
  -e 's/where: { id: parseInt(tenantId) }/where: { id: parseInt(tenant_id) }/g' \
  -e 's/where: { id: tenantId }/where: { id: tenant_id }/g' \
  -e 's/where: { id: userId }/where: { id: user_id }/g' \
  -e 's/where: { id: parseInt(userId) }/where: { id: parseInt(user_id) }/g' \
  -e 's/where: { id: accountId }/where: { id: account_id }/g' \
  -e 's/where: { id: parseInt(accountId) }/where: { id: parseInt(account_id) }/g' \
  -e 's/`tenant:\${tenantId}/`tenant:\${tenant_id}/g' \
  -e 's/`user:\${userId}/`user:\${user_id}/g' \
  -e 's/`account:\${accountId}/`account:\${account_id}/g' \
  -e 's/id: userId,/id: user_id,/g' \
  -e 's/{ userId }/{ user_id }/g' \
  -e 's/{ tenantId }/{ tenant_id }/g' \
  -e 's/{ accountId }/{ account_id }/g' \
  -e 's/account_id: accountId/account_id: account_id/g' \
  -e 's/tenant_id: tenantId/tenant_id: tenant_id/g' \
  -e 's/user_id: userId/user_id: user_id/g' \
  {} \;

# Fix specific service files with known issues
echo "Fixing specific service issues..."

# Fix tenant service
sed -i '' 's/parseInt(tenantId)/parseInt(tenant_id)/g' modules/platform/services/tenants.service.ts
sed -i '' 's/where: { tenantId }/where: { tenant_id }/g' modules/platform/services/tenants.service.ts
sed -i '' 's/{ tenantId,/{ tenant_id,/g' modules/platform/services/tenants.service.ts

# Fix user service  
sed -i '' 's/id: userId,/id: user_id,/g' modules/user/user.service.ts
sed -i '' 's/{ userId,/{ user_id,/g' modules/user/user.service.ts

# Fix account services
find modules/account/services -name "*.ts" -exec sed -i '' \
  -e 's/parseInt(accountId)/parseInt(account_id)/g' \
  -e 's/where: { accountId }/where: { account_id }/g' \
  -e 's/{ accountId,/{ account_id,/g' \
  {} \;

echo "Variable name fixes applied!"