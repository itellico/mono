#!/bin/bash

# Comprehensive fix for all compilation errors in NestJS API
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Starting comprehensive fix for all compilation errors..."

# 1. Fix controller parameter names (accountId, userId, tenantId)
echo "Fixing controller parameter names..."
find . -name "*.controller.ts" -exec sed -i '' \
  -e 's/@Param('\''account_id'\'')/@Param('\''accountId'\'')/' \
  -e 's/@Param('\''user_id'\'')/@Param('\''userId'\'')/' \
  -e 's/@Param('\''tenant_id'\'')/@Param('\''tenantId'\'')/' \
  {} \;

# 2. Fix Promise.all syntax errors (remove trailing commas and fix patterns)
echo "Fixing Promise.all syntax errors..."
find . -name "*.service.ts" -exec perl -i -pe '
  # Fix Promise.resolve patterns with trailing commas
  s/Promise\.resolve\(\[\]\),\s*\/\/.*$/Promise.resolve([]), \/\/ $1/g;
  s/Promise\.resolve\(0\),\s*\/\/.*$/Promise.resolve(0), \/\/ $1/g;
  
  # Remove standalone Promise.resolve lines
  s/^\s*Promise\.resolve\(0\),\s*$//g;
' {} \;

# 3. Fix service method parameter names (they should match what controllers pass)
echo "Fixing service method parameters..."
find . -name "*.service.ts" -exec sed -i '' \
  -e 's/getBillingOverview(accountId:/getBillingOverview(accountId:/' \
  -e 's/getSubscriptions(accountId:/getSubscriptions(accountId:/' \
  -e 's/getSubscription(accountId:/getSubscription(accountId:/' \
  -e 's/createSubscription(accountId:/createSubscription(accountId:/' \
  -e 's/updateSubscription(accountId:/updateSubscription(accountId:/' \
  -e 's/cancelSubscription(accountId:/cancelSubscription(accountId:/' \
  -e 's/getInvoices(accountId:/getInvoices(accountId:/' \
  -e 's/addPaymentMethod(accountId:/addPaymentMethod(accountId:/' \
  -e 's/setDefaultPaymentMethod(accountId:/setDefaultPaymentMethod(accountId:/' \
  -e 's/removePaymentMethod(accountId:/removePaymentMethod(accountId:/' \
  -e 's/getUsage(accountId:/getUsage(accountId:/' \
  -e 's/getLimits(accountId:/getLimits(accountId:/' \
  {} \;

# 4. Fix variable usage inside service methods
echo "Fixing variable usage in service methods..."

# Fix billing.service.ts
sed -i '' \
  -e '14s/account_id/accountId/' \
  -e '156s/account_id/accountId/' \
  -e '197s/account_id/accountId/' \
  -e '216s/account_id/accountId/' \
  -e '237s/account_id/accountId/' \
  -e '260s/account_id: /account_id: parseInt(accountId)/' \
  -e '287s/account_id/accountId/' \
  modules/account/services/billing.service.ts

# Fix users.service.ts  
sed -i '' \
  -e '31s/account_id,/account_id: parseInt(accountId),/' \
  -e '55s/account_id }/account_id: parseInt(accountId) }/' \
  -e '89s/account_id }/account_id: parseInt(accountId) }/' \
  -e '127s/userId_account_id/userId_accountId/' \
  -e '128s/user_id:/userId:/' \
  -e '129s/account_id,/accountId: parseInt(accountId),/' \
  -e '142s/account_id,/accountId: parseInt(accountId),/' \
  -e '193s/userId_account_id/userId_accountId/' \
  -e '194s/user_id,/userId: user_id,/' \
  -e '195s/account_id,/accountId: parseInt(accountId),/' \
  -e '207s/userId_account_id/userId_accountId/' \
  -e '208s/user_id,/userId: user_id,/' \
  -e '209s/account_id,/accountId: parseInt(accountId),/' \
  -e '231s/userId/user_id/' \
  -e '244s/userId_account_id/userId_accountId/' \
  -e '245s/user_id,/userId: user_id,/' \
  -e '246s/account_id,/accountId: parseInt(accountId),/' \
  -e '258s/account_id,/accountId: parseInt(accountId),/' \
  -e '269s/userId_account_id/userId_accountId/' \
  -e '270s/user_id,/userId: user_id,/' \
  -e '271s/account_id,/accountId: parseInt(accountId),/' \
  -e '278s/userId/user_id/' \
  -e '289s/account_id/accountId: parseInt(accountId)/' \
  -e '372s/userId_account_id/userId_accountId/' \
  -e '373s/user_id,/userId: user_id,/' \
  -e '374s/account_id,/accountId: parseInt(accountId),/' \
  -e '399s/userId_account_id/userId_accountId/' \
  -e '400s/user_id:/userId:/' \
  -e '401s/account_id,/accountId: parseInt(accountId),/' \
  -e '413s/userId_account_id/userId_accountId/' \
  -e '414s/user_id:/userId:/' \
  -e '415s/account_id,/accountId: parseInt(accountId),/' \
  -e '424s/userId/user_id/' \
  -e '441s/account_id,/accountId: parseInt(accountId),/' \
  -e '442s/user_id:/userId:/' \
  -e '453s/account_id,/accountId: parseInt(accountId),/' \
  -e '454s/user_id:/userId:/' \
  modules/account/services/users.service.ts

# Fix analytics.service.ts
sed -i '' \
  -e '71s/account_id/account_id: parseInt(accountId)/' \
  modules/account/services/analytics.service.ts

# Fix tenant.service.ts
sed -i '' \
  -e '80s/tenantId/tenant_id/' \
  -e '47s/isActive/is_active/' \
  -e '48s/createdAt/created_at/' \
  -e '83s/createdAt/created_at/' \
  -e '138s/accountId/account_id/' \
  -e '141s/isActive/is_active/' \
  -e '182s/isActive/is_active/' \
  modules/tenant/tenant.service.ts

# 5. Fix model schema service issues
echo "Fixing model schema service..."
sed -i '' \
  -e '27s/tenant_id/tenant_id: parseInt(tenantId)/' \
  -e '72s/ConflictException/BadRequestException/' \
  modules/tenant/services/model-schemas.service.ts

# 6. Add missing import
sed -i '' '1a\
import { ConflictException } from '\''@nestjs/common'\'';' modules/tenant/services/model-schemas.service.ts

# 7. Fix account model issues (remove non-existent fields)
echo "Fixing account model references..."
find . -name "*.service.ts" -exec sed -i '' \
  -e '/subscriptions:/d' \
  -e '/invoices:/d' \
  -e '/defaultPaymentMethodId:/d' \
  -e '/\.subscriptions/d' \
  -e '/\.invoices/d' \
  -e '/\.defaultPaymentMethodId/d' \
  {} \;

# 8. Fix user model issues
echo "Fixing user model references..."
sed -i '' \
  -e '/email:/d' \
  -e '/.accounts\[/d' \
  modules/account/services/users.service.ts

# 9. Clean up any duplicate lines or empty Promise.all
echo "Cleaning up..."
find . -name "*.service.ts" -exec perl -i -pe '
  # Remove empty lines created by deletions
  s/^\s*$//g if $. > 1 && $prev =~ /^\s*$/;
  $prev = $_;
' {} \;

echo "Fix complete! Run 'pnpm tsc --noEmit' to check remaining errors."