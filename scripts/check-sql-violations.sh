#!/bin/bash

# Check for Direct SQL/Database Access Violations
# ✅ ARCHITECTURE COMPLIANCE: Identifies all files violating the architecture

echo "🔍 Checking for Direct SQL/Database Access Violations..."
echo "=========================================="
echo ""

# Check for db imports from @/lib/db
echo "📊 Files importing db from @/lib/db:"
echo "------------------------------------"
DB_IMPORTS=$(find /Users/mm2/dev_mm/mono/apps/web -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "import.*{.*db.*}.*from.*['\"]@/lib/db" {} \; | grep -v node_modules | grep -v ".backup")
DB_COUNT=$(echo "$DB_IMPORTS" | grep -c .)
echo "Found: $DB_COUNT files"
echo ""

# Check for Prisma client imports
echo "📊 Files importing from @prisma/client:"
echo "--------------------------------------"
PRISMA_IMPORTS=$(find /Users/mm2/dev_mm/mono/apps/web -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "from.*['\"]@prisma/client" {} \; | grep -v node_modules | grep -v ".backup")
PRISMA_COUNT=$(echo "$PRISMA_IMPORTS" | grep -c .)
echo "Found: $PRISMA_COUNT files"
echo ""

# Check for raw SQL queries
echo "📊 Files with raw SQL queries (\$queryRaw/\$executeRaw):"
echo "-----------------------------------------------------"
RAW_SQL=$(find /Users/mm2/dev_mm/mono/apps/web -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "\$queryRaw\|\$executeRaw" {} \; | grep -v node_modules | grep -v ".backup")
RAW_SQL_COUNT=$(echo "$RAW_SQL" | grep -c .)
echo "Found: $RAW_SQL_COUNT files"
echo ""

# Check for API routes with violations
echo "📊 API Routes with direct database access:"
echo "-----------------------------------------"
API_VIOLATIONS=$(find /Users/mm2/dev_mm/mono/apps/web/src/app/api -type f -name "*.ts" -exec grep -l "import.*{.*db.*}.*from.*['\"]@/lib/db" {} \; | grep -v ".backup")
API_COUNT=$(echo "$API_VIOLATIONS" | grep -c .)
echo "Found: $API_COUNT API routes"
echo ""

# Service files with violations
echo "📊 Service files with direct database access:"
echo "--------------------------------------------"
SERVICE_VIOLATIONS=$(find /Users/mm2/dev_mm/mono/apps/web/src/lib/services -type f -name "*.ts" -exec grep -l "import.*{.*db.*}.*from.*['\"]@/lib/db\|from.*['\"]@prisma/client" {} \; | grep -v ".backup")
SERVICE_COUNT=$(echo "$SERVICE_VIOLATIONS" | grep -c .)
echo "Found: $SERVICE_COUNT service files"
echo ""

# Summary
echo "🎯 SUMMARY"
echo "=========="
TOTAL_VIOLATIONS=$((DB_COUNT + PRISMA_COUNT + RAW_SQL_COUNT))
echo "Total violations: $TOTAL_VIOLATIONS"
echo ""

# Categorize violations
echo "📁 VIOLATIONS BY CATEGORY:"
echo "=========================="
echo ""

echo "🔴 CRITICAL - API Routes (should proxy to NestJS):"
echo "$API_VIOLATIONS" | head -10
if [ $API_COUNT -gt 10 ]; then
    echo "... and $((API_COUNT - 10)) more"
fi
echo ""

echo "🟡 HIGH - Service Files (should use API clients):"
echo "$SERVICE_VIOLATIONS" | head -10
if [ $SERVICE_COUNT -gt 10 ]; then
    echo "... and $((SERVICE_COUNT - 10)) more"
fi
echo ""

echo "🟠 MEDIUM - Component/Page Files:"
COMPONENT_VIOLATIONS=$(echo "$DB_IMPORTS" | grep -E "components|app.*page\.tsx|app.*layout\.tsx" | head -10)
echo "$COMPONENT_VIOLATIONS"
echo ""

# Provide recommendations
echo "💡 RECOMMENDATIONS:"
echo "=================="
echo "1. Run ./scripts/fix-api-routes.sh to convert API routes to proxies"
echo "2. Service files should be converted to use API clients (see completed examples)"
echo "3. Components should use service layers, not direct database access"
echo "4. All database operations should go through NestJS API with proper auth"
echo ""

echo "✅ ARCHITECTURE PATTERN:"
echo "======================="
echo "Browser → Next.js → NestJS API → Database"
echo "         ↓"
echo "    Service Layer"
echo "         ↓"
echo "     API Clients"
echo ""

# Export report
REPORT_FILE="/Users/mm2/dev_mm/mono/reports/sql-violations-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p /Users/mm2/dev_mm/mono/reports

{
    echo "SQL/Database Access Violations Report"
    echo "Generated: $(date)"
    echo ""
    echo "DB Imports: $DB_COUNT files"
    echo "Prisma Imports: $PRISMA_COUNT files" 
    echo "Raw SQL: $RAW_SQL_COUNT files"
    echo "Total: $TOTAL_VIOLATIONS violations"
    echo ""
    echo "=== DB IMPORTS ==="
    echo "$DB_IMPORTS"
    echo ""
    echo "=== PRISMA IMPORTS ==="
    echo "$PRISMA_IMPORTS"
    echo ""
    echo "=== RAW SQL ==="
    echo "$RAW_SQL"
} > "$REPORT_FILE"

echo "📄 Full report saved to: $REPORT_FILE"