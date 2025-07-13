#!/bin/bash

# Update Prisma Schema after Database Normalization
# Created: 2025-01-12

echo "Updating Prisma schema to reflect database changes..."

# First, introspect the database to get the current state
echo "1. Introspecting database..."
cd /Users/mm2/dev_mm/mono
pnpm prisma db pull

echo "2. Generating Prisma client..."
pnpm prisma generate

echo "3. Formatting schema..."
pnpm prisma format

echo "✅ Prisma schema updated successfully!"
echo ""
echo "Note: The following changes should be reflected:"
echo "  - User.account_role removed (replaced with account_role_id FK)"
echo "  - User boolean permission columns removed"
echo "  - User preferences moved to user_preferences table"
echo "  - Account preference columns removed"
echo ""
echo "Next steps:"
echo "1. Review the updated schema.prisma file"
echo "2. Update TypeScript types if needed"
echo "3. Update API code to use new relations"