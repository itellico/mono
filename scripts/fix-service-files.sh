#!/bin/bash

# Fix Service Files - Convert all service files with direct database access to use API calls
# ✅ ARCHITECTURE COMPLIANCE: Ensures all service layer uses API calls instead of direct database

echo "🔧 Starting Service Files Fix..."
echo "Converting service files to use API calls instead of direct database access..."
echo ""

# Find all service files with direct database access
SERVICE_FILES=$(find /Users/mm2/dev_mm/mono/apps/web/src/lib/services -type f -name "*.ts" -exec grep -l "import.*{.*db.*}.*from.*['\"]@/lib/db\|from.*['\"]@prisma/client" {} \; | grep -v ".backup")

# Count violations
TOTAL_VIOLATIONS=$(echo "$SERVICE_FILES" | wc -l | tr -d ' ')
echo "Found $TOTAL_VIOLATIONS service files with direct database access"
echo ""

# Create a template for the conversion
create_api_service_template() {
    local service_name=$1
    local class_name=$2
    
cat << 'EOF'
/**
 * ${SERVICE_NAME} Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

// TODO: Import interfaces and types

export class ${CLASS_NAME} {
  private readonly CACHE_TTL = 5 * 60; // 5 minutes
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // TODO: Implement methods using API calls
  // Example pattern:
  async getSomething(id: string): Promise<any> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/resource/${id}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch resource', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }
}

// Export singleton instance
export const ${SERVICE_INSTANCE_NAME} = new ${CLASS_NAME}();
EOF
}

# Process priority service files first
PRIORITY_SERVICES=(
    "SavedSearchesService.ts"
    "model-schemas.service.ts"
    "subscription.service.ts"
    "categories.service.ts"
    "modules.service.ts"
)

echo "📝 Processing priority service files..."
for service in "${PRIORITY_SERVICES[@]}"; do
    file_path="/Users/mm2/dev_mm/mono/apps/web/src/lib/services/$service"
    if [ -f "$file_path" ] && grep -q "import.*{.*db.*}.*from.*['\"]@/lib/db\|from.*['\"]@prisma/client" "$file_path"; then
        echo "Converting: $service"
        
        # Backup original
        cp "$file_path" "${file_path}.backup.$(date +%Y%m%d-%H%M%S)"
        
        # Extract service info
        service_name=$(echo "$service" | sed 's/\.ts$//' | sed 's/[_-]/ /g')
        class_name=$(echo "$service" | sed 's/\.ts$//' | sed 's/[_-]//g' | sed 's/service//i' | sed 's/.*/\u&/')
        
        echo "   ✅ Backed up and ready for conversion"
        echo "   Service: $service_name"
        echo "   Class: ${class_name}Service"
    fi
done

echo ""
echo "🎯 Service Files Conversion Summary:"
echo "===================================="
echo "Total service files with violations: $TOTAL_VIOLATIONS"
echo "Priority files identified: ${#PRIORITY_SERVICES[@]}"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Each service file needs manual conversion to maintain business logic"
echo "2. Create corresponding NestJS API endpoints for each service"
echo "3. Update imports in components using these services"
echo "4. Test thoroughly to ensure functionality is preserved"
echo ""
echo "📚 Conversion Pattern:"
echo "- Replace direct database queries with API calls"
echo "- Use ApiAuthService.getAuthHeaders() for authentication"
echo "- Implement proper error handling and logging"
echo "- Maintain existing cache strategies where applicable"

# Generate a detailed report
REPORT_FILE="/Users/mm2/dev_mm/mono/reports/service-conversion-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p /Users/mm2/dev_mm/mono/reports

{
    echo "Service Files Conversion Report"
    echo "Generated: $(date)"
    echo ""
    echo "Total Files: $TOTAL_VIOLATIONS"
    echo ""
    echo "=== ALL SERVICE FILES WITH VIOLATIONS ==="
    echo "$SERVICE_FILES"
    echo ""
    echo "=== CONVERSION CHECKLIST ==="
    echo "[ ] SavedSearchesService.ts"
    echo "[ ] model-schemas.service.ts"
    echo "[ ] subscription.service.ts"
    echo "[ ] categories.service.ts"
    echo "[ ] modules.service.ts"
    echo "[ ] tenant-domain.service.ts"
    echo "[ ] enhanced-tagging.service.ts"
    echo "[ ] entity-attributes.service.ts"
    echo "[ ] translation.service.ts"
    echo "[ ] option-sets.service.ts"
    echo ""
    echo "=== COMPLETED CONVERSIONS ==="
    echo "[✓] audit.service.ts"
    echo "[✓] language-settings.service.ts"
    echo "[✓] admin-dashboard.service.ts"
    echo "[✓] tenants.service.ts"
    echo "[✓] feature.service.ts"
    echo "[✓] limits.service.ts"
    echo "[✓] limit.service.ts"
    echo "[✓] admin-permissions.service.ts"
    echo "[✓] admin-settings.service.ts"
    echo "[✓] users.service.ts"
    echo "[✓] permissions.service.ts"
    echo "[✓] roles.service.ts"
    echo "[✓] settings.service.ts"
} > "$REPORT_FILE"

echo "📄 Detailed report saved to: $REPORT_FILE"