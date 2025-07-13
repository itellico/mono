#!/bin/bash

# Update all controller paths from v1 to remove version prefix
# Since we're using global v2 prefix, we don't need v1 in individual controllers

cd /Users/mm2/dev_mm/mono/apps/api-nest/src

# Update all controllers that have v1 prefix
find . -name "*.controller.ts" -exec sed -i '' "s/@Controller('v1\//@Controller('/g" {} \;

echo "Updated all controller paths to remove v1 prefix"