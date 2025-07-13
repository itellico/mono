#!/bin/bash

# Fix variable assignment issues where declared variables were renamed but their usages weren't
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing variable assignment issues..."

# Fix account-context.guard.ts
echo "Fixing account-context.guard.ts..."
sed -i '' \
  -e '17s/let account_id:/let accountId:/' \
  -e '21s/accountId = /account_id = /' \
  -e '25s/accountId = /account_id = /' \
  -e '29s/accountId = /account_id = /' \
  -e '33s/accountId = /account_id = /' \
  -e '37s/if (accountId)/if (account_id)/' \
  -e '44s/id: parseInt(accountId)/id: parseInt(account_id)/' \
  -e '54s/account_id: parseInt(accountId)/account_id: parseInt(account_id)/' \
  -e '62s/request.accountId = accountId/request.accountId = account_id/' \
  common/guards/account-context.guard.ts

# Fix tenant-context.guard.ts
echo "Fixing tenant-context.guard.ts..."
sed -i '' \
  -e '14s/let tenant_id:/let tenantId:/' \
  -e '18s/tenantId = /tenant_id = /' \
  -e '22s/tenantId = /tenant_id = /' \
  -e '26s/tenantId = /tenant_id = /' \
  -e '30s/tenantId = /tenant_id = /' \
  -e '34s/if (!tenantId)/if (!tenant_id)/' \
  -e '36s/parseInt(tenantId)/parseInt(tenant_id)/' \
  -e '43s/request.tenantId = tenantId/request.tenantId = tenant_id/' \
  common/guards/tenant-context.guard.ts

# Fix all controller files where accountId and userId were incorrectly changed
echo "Fixing controller parameter usages..."
find . -name "*.controller.ts" -exec sed -i '' \
  -e 's/@Param('\''accountId'\'') account_id/@Param('\''accountId'\'') accountId/g' \
  -e 's/@Param('\''userId'\'') user_id/@Param('\''userId'\'') userId/g' \
  -e 's/@Param('\''tenantId'\'') tenant_id/@Param('\''tenantId'\'') tenantId/g' \
  -e 's/@Param('\''roleId'\'') role_id/@Param('\''roleId'\'') roleId/g' \
  -e 's/@Query('\''userId'\'') user_id/@Query('\''userId'\'') userId/g' \
  -e 's/@Query('\''accountId'\'') account_id/@Query('\''accountId'\'') accountId/g' \
  -e 's/@Query('\''tenantId'\'') tenant_id/@Query('\''tenantId'\'') tenantId/g' \
  {} \;

# Fix service files where function parameters were incorrectly changed
echo "Fixing service function parameters..."
find . -name "*.service.ts" -exec sed -i '' \
  -e 's/async \([a-zA-Z]*\)(\([^,)]*\)user_id: string/async \1(\2userId: string/g' \
  -e 's/async \([a-zA-Z]*\)(\([^,)]*\)account_id: string/async \1(\2accountId: string/g' \
  -e 's/async \([a-zA-Z]*\)(\([^,)]*\)tenant_id: string/async \1(\2tenantId: string/g' \
  -e 's/async \([a-zA-Z]*\)(\([^,)]*\)role_id: string/async \1(\2roleId: string/g' \
  {} \;

# Fix where clauses in service files to use snake_case
echo "Fixing where clauses to use snake_case..."
find . -name "*.service.ts" -exec sed -i '' \
  -e 's/where: { id: parseInt(userId)/where: { id: parseInt(userId)/g' \
  -e 's/where: { id: parseInt(accountId)/where: { id: parseInt(accountId)/g' \
  -e 's/where: { id: parseInt(tenantId)/where: { id: parseInt(tenantId)/g' \
  -e 's/where: { account_id: parseInt(accountId)/where: { account_id: parseInt(accountId)/g' \
  -e 's/where: { tenant_id: parseInt(tenantId)/where: { tenant_id: parseInt(tenantId)/g' \
  {} \;

echo "Done fixing variable assignments!"