#!/bin/bash

# Comprehensive fix for all variable naming issues
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Comprehensive variable fix starting..."

# 1. Fix guard files where variable declarations and usages are mismatched
echo "Fixing guard files..."

# Fix account-context.guard.ts
sed -i '' \
  -e '21s/account_id/accountId/' \
  -e '25s/account_id/accountId/' \
  -e '29s/account_id/accountId/' \
  -e '33s/account_id/accountId/' \
  -e '37s/account_id/accountId/' \
  -e '44s/account_id/accountId/' \
  -e '54s/account_id: parseInt(accountId)/account_id: parseInt(accountId)/' \
  -e '62s/request.accountId = account_id/request.accountId = accountId/' \
  common/guards/account-context.guard.ts

# Fix tenant-context.guard.ts  
sed -i '' \
  -e '18s/tenant_id/tenantId/' \
  -e '22s/tenant_id/tenantId/' \
  -e '26s/tenant_id/tenantId/' \
  -e '30s/tenant_id/tenantId/' \
  -e '34s/if (!tenant_id)/if (!tenantId)/' \
  -e '36s/parseInt(tenant_id)/parseInt(tenantId)/' \
  -e '43s/request.tenantId = tenant_id/request.tenantId = tenantId/' \
  common/guards/tenant-context.guard.ts

# 2. Fix tenants.service.ts where function params were changed
echo "Fixing tenants.service.ts..."
sed -i '' \
  -e '76s/async getTenant(tenantId: string)/async getTenant(tenant_id: string)/' \
  -e '111s/async createTenant(userId: string/async createTenant(user_id: string/' \
  -e '171s/async updateTenant(tenantId: string/async updateTenant(tenant_id: string/' \
  -e '212s/async deleteTenant(tenantId: string)/async deleteTenant(tenant_id: string)/' \
  -e '254s/async suspendTenant(tenantId: string/async suspendTenant(tenant_id: string/' \
  -e '299s/async activateTenant(tenantId: string)/async activateTenant(tenant_id: string)/' \
  -e '325s/async getTenantStats(tenantId: string)/async getTenantStats(tenant_id: string)/' \
  -e '379s/async getTenantUsage(tenantId: string/async getTenantUsage(tenant_id: string/' \
  -e '407s/async getTenantSubscription(tenantId: string)/async getTenantSubscription(tenant_id: string)/' \
  -e '435s/async updateTenantSubscription(tenantId: string/async updateTenantSubscription(tenant_id: string/' \
  -e '473s/async getTenantFeatures(tenantId: string)/async getTenantFeatures(tenant_id: string)/' \
  -e '501s/async enableFeature(tenantId: string/async enableFeature(tenant_id: string/' \
  -e '529s/async disableFeature(tenantId: string/async disableFeature(tenant_id: string/' \
  -e '548s/async getTenantSettings(tenantId: string)/async getTenantSettings(tenant_id: string)/' \
  -e '564s/async updateTenantSettings(tenantId: string/async updateTenantSettings(tenant_id: string/' \
  -e '594s/async createTenantBackup(tenantId: string/async createTenantBackup(tenant_id: string/' \
  -e '609s/async exportTenantData(tenantId: string/async exportTenantData(tenant_id: string/' \
  -e '638s/async createTenant(user_id: string/async createTenant(user_id: string/' \
  modules/platform/services/tenants.service.ts

# 3. Fix all controllers to use proper parameter names
echo "Fixing all controller parameter decorators..."
find . -name "*.controller.ts" -exec sed -i '' \
  -e 's/@Param('\''account_id'\'')/@Param('\''accountId'\'')/' \
  -e 's/@Param('\''user_id'\'')/@Param('\''userId'\'')/' \
  -e 's/@Param('\''tenant_id'\'')/@Param('\''tenantId'\'')/' \
  -e 's/@Param('\''role_id'\'')/@Param('\''roleId'\'')/' \
  {} \;

# 4. Fix service method calls where parameters should use camelCase
echo "Fixing service method calls..."
find . -name "*.controller.ts" -exec sed -i '' \
  -e 's/\.getUsers(accountId/\.getUsers(account_id/' \
  -e 's/\.getUser(accountId, userId/\.getUser(account_id, user_id/' \
  -e 's/\.createUser(accountId/\.createUser(account_id/' \
  -e 's/\.updateUser(accountId, userId/\.updateUser(account_id, user_id/' \
  -e 's/\.deleteUser(accountId, userId/\.deleteUser(account_id, user_id/' \
  -e 's/\.getRoles(accountId/\.getRoles(account_id/' \
  -e 's/\.assignRole(accountId, userId/\.assignRole(account_id, user_id/' \
  -e 's/\.removeRole(accountId, userId/\.removeRole(account_id, user_id/' \
  -e 's/\.getPermissions(accountId/\.getPermissions(account_id/' \
  -e 's/\.updatePermissions(accountId, userId/\.updatePermissions(account_id, user_id/' \
  {} \;

# 5. Fix user.service.ts
echo "Fixing user.service.ts..."
sed -i '' \
  -e 's/updateProfile(user_id: string/updateProfile(userId: string/' \
  -e 's/where: { id: userId }/where: { id: parseInt(userId) }/' \
  -e 's/return { userId, /return { userId: parseInt(userId), /' \
  modules/user/user.service.ts

# 6. Fix analytics controller service calls
echo "Fixing analytics controller..."
sed -i '' \
  -e 's/\.getDashboard(accountId/\.getDashboard(account_id/' \
  -e 's/\.getAnalytics(accountId/\.getAnalytics(account_id/' \
  -e 's/\.getReports(accountId/\.getReports(account_id/' \
  -e 's/\.getInsights(accountId/\.getInsights(account_id/' \
  -e 's/\.getComparison(accountId/\.getComparison(account_id/' \
  modules/account/controllers/analytics.controller.ts

# 7. Fix billing controller service calls
echo "Fixing billing controller..."
sed -i '' \
  -e 's/\.getSubscription(accountId/\.getSubscription(account_id/' \
  -e 's/\.getInvoices(accountId/\.getInvoices(account_id/' \
  -e 's/\.getInvoice(accountId/\.getInvoice(account_id/' \
  -e 's/\.downloadInvoice(accountId/\.downloadInvoice(account_id/' \
  -e 's/\.getPaymentMethods(accountId/\.getPaymentMethods(account_id/' \
  -e 's/\.addPaymentMethod(accountId/\.addPaymentMethod(account_id/' \
  -e 's/\.deletePaymentMethod(accountId/\.deletePaymentMethod(account_id/' \
  -e 's/\.setDefaultPaymentMethod(accountId/\.setDefaultPaymentMethod(account_id/' \
  -e 's/\.updateSubscription(accountId/\.updateSubscription(account_id/' \
  -e 's/\.cancelSubscription(accountId/\.cancelSubscription(account_id/' \
  -e 's/\.resumeSubscription(accountId/\.resumeSubscription(account_id/' \
  -e 's/\.changePlan(accountId/\.changePlan(account_id/' \
  -e 's/\.previewProration(accountId/\.previewProration(account_id/' \
  -e 's/\.getUsage(accountId/\.getUsage(account_id/' \
  -e 's/\.getUsageReport(accountId/\.getUsageReport(account_id/' \
  modules/account/controllers/billing.controller.ts

echo "Comprehensive fix complete!"