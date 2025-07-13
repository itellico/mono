#!/bin/bash

# Fix controller parameter names to match decorators
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing controller parameter names..."

# Fix analytics controller
echo "Fixing analytics.controller.ts..."
sed -i '' \
  -e 's/@Get('\''overview'\'')/@Get('\''overview'\'')/' \
  -e 's/getAnalyticsOverview(@Param('\''account_id'\'') account_id:/getAnalyticsOverview(@Param('\''account_id'\'') accountId:/' \
  -e 's/@Get('\''activity'\'')/@Get('\''activity'\'')/' \
  -e 's/getActivity(@Param('\''account_id'\'') account_id:/getActivity(@Param('\''account_id'\'') accountId:/' \
  -e 's/@Get('\''audit-logs'\'')/@Get('\''audit-logs'\'')/' \
  -e 's/getAuditLogs(@Param('\''account_id'\'') account_id:/getAuditLogs(@Param('\''account_id'\'') accountId:/' \
  -e 's/@Get('\''permissions'\'')/@Get('\''permissions'\'')/' \
  -e 's/getPermissions(@Param('\''account_id'\'') account_id:/getPermissions(@Param('\''account_id'\'') accountId:/' \
  modules/account/controllers/analytics.controller.ts

# Fix billing controller
echo "Fixing billing.controller.ts..."
sed -i '' \
  -e 's/@Param('\''account_id'\'') account_id:/@Param('\''account_id'\'') accountId:/g' \
  -e 's/@Param('\''subscription_id'\'') subscription_id:/@Param('\''subscription_id'\'') subscriptionId:/g' \
  -e 's/@Param('\''invoice_id'\'') invoice_id:/@Param('\''invoice_id'\'') invoiceId:/g' \
  -e 's/@Param('\''payment_method_id'\'') payment_method_id:/@Param('\''payment_method_id'\'') paymentMethodId:/g' \
  modules/account/controllers/billing.controller.ts

# Fix users controller
echo "Fixing users.controller.ts..."
sed -i '' \
  -e 's/@Param('\''account_id'\'') account_id:/@Param('\''account_id'\'') accountId:/g' \
  -e 's/@Param('\''user_id'\'') user_id:/@Param('\''user_id'\'') userId:/g' \
  -e 's/@Param('\''invitation_id'\'') invitation_id:/@Param('\''invitation_id'\'') invitationId:/g' \
  modules/account/controllers/users.controller.ts

# Fix tenant controllers
echo "Fixing tenant controllers..."
find modules/tenant/controllers -name "*.controller.ts" -exec sed -i '' \
  -e 's/@Param('\''tenant_id'\'') tenant_id:/@Param('\''tenant_id'\'') tenantId:/g' \
  -e 's/@Param('\''schema_id'\'') schema_id:/@Param('\''schema_id'\'') schemaId:/g' \
  -e 's/@Param('\''field_id'\'') field_id:/@Param('\''field_id'\'') fieldId:/g' \
  -e 's/@Param('\''access_key_id'\'') access_key_id:/@Param('\''access_key_id'\'') accessKeyId:/g' \
  {} \;

# Fix platform controllers
echo "Fixing platform controllers..."
find modules/platform/controllers -name "*.controller.ts" -exec sed -i '' \
  -e 's/@Param('\''tenant_id'\'') tenant_id:/@Param('\''tenant_id'\'') tenantId:/g' \
  -e 's/@Param('\''feature_id'\'') feature_id:/@Param('\''feature_id'\'') featureId:/g' \
  -e 's/@Param('\''workflow_id'\'') workflow_id:/@Param('\''workflow_id'\'') workflowId:/g' \
  -e 's/@Param('\''task_id'\'') task_id:/@Param('\''task_id'\'') taskId:/g' \
  -e 's/@Param('\''integration_id'\'') integration_id:/@Param('\''integration_id'\'') integrationId:/g' \
  -e 's/@Param('\''model_id'\'') model_id:/@Param('\''model_id'\'') modelId:/g' \
  {} \;

# Fix user controllers
echo "Fixing user module controllers..."
find modules/user/controllers -name "*.controller.ts" -exec sed -i '' \
  -e 's/@Param('\''user_id'\'') user_id:/@Param('\''user_id'\'') userId:/g' \
  -e 's/@Param('\''session_id'\'') session_id:/@Param('\''session_id'\'') sessionId:/g' \
  {} \;

# Fix billing service to remove non-existent field
echo "Fixing billing service default_payment_method_id references..."
sed -i '' \
  -e 's/default_payment_method_id:/\/\/ default_payment_method_id:/' \
  -e '/data: { default_payment_method_id:/d' \
  -e '/select: { default_payment_method_id:/d' \
  modules/account/services/billing.service.ts

echo "Controller parameter fixes complete!"