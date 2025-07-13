#!/bin/bash

echo "🔧 Fixing remaining Swagger tag organization issues..."

cd ./apps/api

echo "📋 Phase 1: Fixing Account Tier sub-category tags..."
# Account tier should use account.* not account.*.* for main sections
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.users\.management\x27\]/tags: [\x27account.users\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.users\.invitations\x27\]/tags: [\x27account.users\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.users\.permissions\x27\]/tags: [\x27account.users\x27]/g' {} \;

find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.business\.forms\x27\]/tags: [\x27account.business\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.business\.workflows\x27\]/tags: [\x27account.business\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.business\.integrations\x27\]/tags: [\x27account.business\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.business\.webhooks\x27\]/tags: [\x27account.business\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.business\.ai\x27\]/tags: [\x27account.business\x27]/g' {} \;

find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.billing\.subscriptions\x27\]/tags: [\x27account.billing\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.billing\.invoices\x27\]/tags: [\x27account.billing\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.billing\.payment-methods\x27\]/tags: [\x27account.billing\x27]/g' {} \;

find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.configuration\.settings\x27\]/tags: [\x27account.configuration\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.configuration\.api-keys\x27\]/tags: [\x27account.configuration\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.configuration\.roles\x27\]/tags: [\x27account.configuration\x27]/g' {} \;

find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.analytics\.overview\x27\]/tags: [\x27account.analytics\x27]/g' {} \;
find src/routes/v1/account -name "*.ts" -exec sed -i '' 's/tags: \[\x27account\.analytics\.reports\x27\]/tags: [\x27account.analytics\x27]/g' {} \;

echo "📋 Phase 2: Fixing User Tier sub-category tags..."
# User tier should group sub-routes under main categories
find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.content\.categories\x27\]/tags: [\x27user.content\x27]/g' {} \;
find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.content\.tags\x27\]/tags: [\x27user.content\x27]/g' {} \;
find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.content\.templates\x27\]/tags: [\x27user.content\x27]/g' {} \;

find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.media\.uploads\x27\]/tags: [\x27user.media\x27]/g' {} \;
find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.media\.artwork\x27\]/tags: [\x27user.media\x27]/g' {} \;

find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.marketplace\.jobs\x27\]/tags: [\x27user.marketplace\x27]/g' {} \;
find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.marketplace\.gigs\x27\]/tags: [\x27user.marketplace\x27]/g' {} \;

find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.activity\.changes\x27\]/tags: [\x27user.activity\x27]/g' {} \;
find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.activity\.audit\x27\]/tags: [\x27user.activity\x27]/g' {} \;

find src/routes/v1/user -name "*.ts" -exec sed -i '' 's/tags: \[\x27user\.search\.saved\x27\]/tags: [\x27user.search\x27]/g' {} \;

echo "📋 Phase 3: Fixing Tenant Tier sub-category tags..."
# Tenant tier should group administration sub-routes properly
find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.administration\.accounts\x27\]/tags: [\x27tenant.administration\x27]/g' {} \;
find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.administration\.users\x27\]/tags: [\x27tenant.administration\x27]/g' {} \;
find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.administration\.permissions\x27\]/tags: [\x27tenant.administration\x27]/g' {} \;

find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.data\.schemas\x27\]/tags: [\x27tenant.data\x27]/g' {} \;
find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.data\.option-sets\x27\]/tags: [\x27tenant.data\x27]/g' {} \;

find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.content\.templates\x27\]/tags: [\x27tenant.content\x27]/g' {} \;
find src/routes/v1/tenant -name "*.ts" -exec sed -i '' 's/tags: \[\x27tenant\.content\.media\x27\]/tags: [\x27tenant.content\x27]/g' {} \;

echo "📋 Phase 4: Fixing remaining Platform admin sub-categories..."
# Platform should eliminate remaining admin sub-categories
find src/routes/v1/platform -name "*.ts" -exec sed -i '' 's/tags: \[\x27platform\.admin\.translations\.languages\x27\]/tags: [\x27platform.translations\x27]/g' {} \;
find src/routes/v1/platform -name "*.ts" -exec sed -i '' 's/tags: \[\x27platform\.admin\.translations\.extract-strings\x27\]/tags: [\x27platform.translations\x27]/g' {} \;
find src/routes/v1/platform -name "*.ts" -exec sed -i '' 's/tags: \[\x27platform\.admin\x27\]/tags: [\x27platform.administration\x27]/g' {} \;
find src/routes/v1/platform -name "*.ts" -exec sed -i '' 's/tags: \[\x27platform\.audit\x27\]/tags: [\x27platform.audit\x27]/g' {} \;
find src/routes/v1/platform -name "*.ts" -exec sed -i '' 's/tags: \[\x27platform\.ai\.llm\x27\]/tags: [\x27platform.ai\x27]/g' {} \;

echo "✅ Tag organization fixes complete!"

# Count affected files
account_changes=$(find src/routes/v1/account -name "*.ts" -exec grep -l "tags: \['account\." {} \; | wc -l)
user_changes=$(find src/routes/v1/user -name "*.ts" -exec grep -l "tags: \['user\." {} \; | wc -l)  
tenant_changes=$(find src/routes/v1/tenant -name "*.ts" -exec grep -l "tags: \['tenant\." {} \; | wc -l)
platform_changes=$(find src/routes/v1/platform -name "*.ts" -exec grep -l "tags: \['platform\." {} \; | wc -l)

echo "📊 Files with updated tags:"
echo "  Account tier: $account_changes files"
echo "  User tier: $user_changes files"
echo "  Tenant tier: $tenant_changes files"
echo "  Platform tier: $platform_changes files"