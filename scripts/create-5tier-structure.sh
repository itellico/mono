#!/bin/bash
# Create 5-tier API structure

set -e

echo "🚀 Creating 5-tier API structure..."

API_BASE="apps/api/src/routes/v1"

# Create tier directories
echo "📁 Creating tier directories..."
mkdir -p "$API_BASE/public"
mkdir -p "$API_BASE/user"
mkdir -p "$API_BASE/account"
mkdir -p "$API_BASE/tenant"
mkdir -p "$API_BASE/platform"

# Create subdirectories for platform tier
mkdir -p "$API_BASE/platform/admin"
mkdir -p "$API_BASE/platform/audit"
mkdir -p "$API_BASE/platform/monitoring"
mkdir -p "$API_BASE/platform/ai"
mkdir -p "$API_BASE/platform/integrations"
mkdir -p "$API_BASE/platform/webhooks"
mkdir -p "$API_BASE/platform/system"
mkdir -p "$API_BASE/platform/operations"
mkdir -p "$API_BASE/platform/documentation"

# Create subdirectories for tenant tier
mkdir -p "$API_BASE/tenant/content/categories"
mkdir -p "$API_BASE/tenant/content/tags"
mkdir -p "$API_BASE/tenant/content/templates"
mkdir -p "$API_BASE/tenant/data/schemas"
mkdir -p "$API_BASE/tenant/data/option-sets"
mkdir -p "$API_BASE/tenant/workflows"
mkdir -p "$API_BASE/tenant/forms"
mkdir -p "$API_BASE/tenant/media"
mkdir -p "$API_BASE/tenant/administration"
mkdir -p "$API_BASE/tenant/monitoring"

# Create subdirectories for account tier
mkdir -p "$API_BASE/account/users"
mkdir -p "$API_BASE/account/billing"
mkdir -p "$API_BASE/account/business"
mkdir -p "$API_BASE/account/configuration"
mkdir -p "$API_BASE/account/analytics"
mkdir -p "$API_BASE/account/changes"
mkdir -p "$API_BASE/account/invitations"

# Create subdirectories for user tier
mkdir -p "$API_BASE/user/profile"
mkdir -p "$API_BASE/user/settings"
mkdir -p "$API_BASE/user/activity"
mkdir -p "$API_BASE/user/content"
mkdir -p "$API_BASE/user/marketplace"
mkdir -p "$API_BASE/user/messaging"
mkdir -p "$API_BASE/user/media"
mkdir -p "$API_BASE/user/search"
mkdir -p "$API_BASE/user/saved-searches"
mkdir -p "$API_BASE/user/notifications"
mkdir -p "$API_BASE/user/subscriptions"

# Create subdirectories for public tier
mkdir -p "$API_BASE/public/auth"
mkdir -p "$API_BASE/public/health"
mkdir -p "$API_BASE/public/contact"
mkdir -p "$API_BASE/public/search"

echo "✅ Directory structure created"

# Create tier index files
echo "📝 Creating tier index files..."

for tier in public user account tenant platform; do
  # Capitalize first letter
  tier_cap="$(echo ${tier:0:1} | tr '[:lower:]' '[:upper:]')${tier:1}"
  
  cat > "$API_BASE/$tier/index.ts" << EOF
import type { FastifyPluginAsync } from 'fastify';

/**
 * $tier_cap tier routes
 * All routes under this tier require $tier-level access
 */
export const ${tier}Routes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering $tier tier routes');
  
  // Register sub-routes here
  // Example: await fastify.register(authRoutes, { prefix: '/auth' });
};

export default ${tier}Routes;
EOF
  echo "✅ Created $tier/index.ts"
done

echo ""
echo "✨ 5-tier structure created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Move existing routes to appropriate tiers"
echo "2. Update route imports in tier index files"
echo "3. Update main app.ts to register tier routes"
echo "4. Update permissions to match tier.resource.action pattern"