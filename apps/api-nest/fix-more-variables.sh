#!/bin/bash

# Fix more variable issues where tenantId, userId etc should be used as is
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing more variable name issues..."

# Fix cases where we need to use the variable name as is, not the parameter
find . -name "*.service.ts" -exec sed -i '' \
  -e 's/where: { id: tenant_id }/where: { id: parseInt(tenant_id) }/g' \
  -e 's/where: { id: user_id }/where: { id: parseInt(user_id) }/g' \
  -e 's/where: { id: account_id }/where: { id: parseInt(account_id) }/g' \
  -e 's/tenantId,$/tenant_id,/g' \
  -e 's/{ tenantId,/{ tenant_id,/g' \
  -e 's/userId,$/user_id,/g' \
  -e 's/{ userId,/{ user_id,/g' \
  -e 's/{ accountId,/{ account_id,/g' \
  -e 's/accountId,$/account_id,/g' \
  -e 's/const newTenant = await this.createTenant(userId,/const newTenant = await this.createTenant(user_id,/g' \
  {} \;

# Fix specific problematic lines in tenants service
sed -i '' 's/tenantId,$/tenant_id,/g' modules/platform/services/tenants.service.ts
sed -i '' 's/{ tenantId$/{ tenant_id/g' modules/platform/services/tenants.service.ts

# Fix where clauses that should use snake_case
find . -name "*.ts" -exec sed -i '' \
  -e 's/where: { accountId }/where: { account_id }/g' \
  -e 's/where: { userId }/where: { user_id }/g' \
  -e 's/where: { tenantId }/where: { tenant_id }/g' \
  {} \;

echo "Additional variable fixes applied!"