#!/bin/bash

# Fix user_id vs userId parameter mismatches
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing user_id vs userId parameter mismatches..."

# Fix user module services
find modules/user/services -name "*.service.ts" -exec sed -i '' \
  -e 's/user_id: string/userId: string/g' \
  -e 's/parseInt(user_id)/parseInt(userId)/g' \
  -e 's/`user:\${user_id}`/`user:\${userId}`/g' \
  -e 's/id: user_id/id: userId/g' \
  {} \;

# Fix user.service.ts
sed -i '' \
  -e 's/id: user_id,/id: userId,/g' \
  -e 's/updateProfile(userId:/updateProfile(userId:/g' \
  modules/user/user.service.ts

# Fix platform services  
find modules/platform/services -name "*.service.ts" -exec sed -i '' \
  -e 's/user_id: string/userId: string/g' \
  -e 's/user_id,/userId,/g' \
  -e 's/parseInt(user_id)/parseInt(userId)/g' \
  {} \;

# Fix tenant services
find modules/tenant/services -name "*.service.ts" -exec sed -i '' \
  -e 's/user_id: string/userId: string/g' \
  -e 's/tenant_id: string/tenantId: string/g' \
  -e 's/parseInt(tenant_id)/parseInt(tenantId)/g' \
  -e 's/`tenant:\${tenant_id}`/`tenant:\${tenantId}`/g' \
  {} \;

# Fix account services that still have issues
find modules/account/services -name "*.service.ts" -exec sed -i '' \
  -e 's/user_id: string/userId: string/g' \
  -e 's/account_id: string/accountId: string/g' \
  -e 's/parseInt(account_id)/parseInt(accountId)/g' \
  -e 's/parseInt(user_id)/parseInt(userId)/g' \
  {} \;

echo "User ID parameter fixes complete!"