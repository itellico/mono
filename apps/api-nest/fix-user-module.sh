#!/bin/bash

# Fix remaining issues in user module
cd /Users/mm2/dev_mm/mono/apps/api-nest/src/modules/user

echo "Fixing user module service files..."

# Fix profile.service.ts
echo "Fixing profile.service.ts..."
sed -i '' \
  -e 's/async getProfile(user_id: string)/async getProfile(userId: string)/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  -e 's/async updateProfile(user_id: string/async updateProfile(userId: string/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  -e 's/async uploadAvatar(user_id: string/async uploadAvatar(userId: string/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  services/profile.service.ts

# Fix settings.service.ts
echo "Fixing settings.service.ts..."
sed -i '' \
  -e 's/async getSettings(user_id: string)/async getSettings(userId: string)/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  -e 's/async updateSettings(user_id: string/async updateSettings(userId: string/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  -e 's/async getNotificationPreferences(user_id: string)/async getNotificationPreferences(userId: string)/' \
  -e 's/where: { user_id: parseInt(user_id) }/where: { user_id: parseInt(userId) }/' \
  -e 's/async updateNotificationPreferences(user_id: string/async updateNotificationPreferences(userId: string/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  -e 's/async getPrivacySettings(user_id: string)/async getPrivacySettings(userId: string)/' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  -e 's/async updatePrivacySettings(user_id: string/async updatePrivacySettings(userId: string)/' \
  -e 's/where: { user_id: parseInt(user_id) }/where: { user_id: parseInt(userId) }/' \
  services/settings.service.ts

# Fix user.service.ts
echo "Fixing user.service.ts..."
sed -i '' \
  -e 's/where: { id: parseInt(user_id) }/where: { id: parseInt(userId) }/' \
  user.service.ts

# Now let's fix the controller parameter names
echo "Fixing @AccountContext decorators..."
cd /Users/mm2/dev_mm/mono/apps/api-nest/src
find . -name "*.controller.ts" -exec sed -i '' \
  -e 's/@AccountContext() accountId:/@AccountContext() account_id:/' \
  -e 's/@Param('\''tenantId'\'') tenantId:/@Param('\''tenantId'\'') tenant_id:/' \
  -e 's/@Param('\''userId'\'') userId:/@Param('\''userId'\'') user_id:/' \
  -e 's/@Param('\''roleId'\'') roleId:/@Param('\''roleId'\'') role_id:/' \
  {} \;

# Fix getLimits call in billing.controller.ts
sed -i '' \
  -e '169s/getLimits(accountId)/getLimits(account_id)/' \
  modules/account/controllers/billing.controller.ts

echo "User module fixes complete!"