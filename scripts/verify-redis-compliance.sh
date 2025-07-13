#!/bin/bash

# Redis Key Compliance Verification Script
# Checks that all Redis keys follow Mono Platform naming conventions

echo "🔍 Redis Key Compliance Verification"
echo "===================================="

# Check if Redis is available
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not available"
    exit 1
fi

echo "✅ Redis is available"

# Get all current keys
ALL_KEYS=$(redis-cli keys "*")

if [ -z "$ALL_KEYS" ]; then
    echo "ℹ️  No Redis keys found"
    exit 0
fi

echo "📊 Total Redis keys: $(echo "$ALL_KEYS" | wc -l)"

# Check key compliance
COMPLIANT_KEYS=""
NON_COMPLIANT_KEYS=""

while IFS= read -r key; do
    if [[ $key =~ ^(platform|tenant|temp|tag): ]]; then
        COMPLIANT_KEYS="$COMPLIANT_KEYS$key\n"
    else
        NON_COMPLIANT_KEYS="$NON_COMPLIANT_KEYS$key\n"
    fi
done <<< "$ALL_KEYS"

# Report results
COMPLIANT_COUNT=$(echo -e "$COMPLIANT_KEYS" | grep -v '^$' | wc -l)
NON_COMPLIANT_COUNT=$(echo -e "$NON_COMPLIANT_KEYS" | grep -v '^$' | wc -l)

echo ""
echo "📈 Compliance Summary:"
echo "✅ Compliant keys: $COMPLIANT_COUNT"
echo "❌ Non-compliant keys: $NON_COMPLIANT_COUNT"

if [ "$NON_COMPLIANT_COUNT" -gt 0 ]; then
    echo ""
    echo "❌ Non-compliant keys found:"
    echo -e "$NON_COMPLIANT_KEYS" | grep -v '^$' | sort | sed 's/^/  /'
    echo ""
    echo "Expected patterns:"
    echo "  - platform:* (global/system-wide data)"
    echo "  - tenant:*   (tenant-specific data)"
    echo "  - temp:*     (temporary data with TTL)"
    echo "  - tag:*      (cache invalidation tags)"
    exit 1
else
    echo ""
    echo "🎉 All Redis keys are compliant!"
    echo ""
    echo "✅ Current compliant keys:"
    echo -e "$COMPLIANT_KEYS" | grep -v '^$' | sort | sed 's/^/  /'
fi

echo ""
echo "📋 Key Distribution:"
echo -e "$COMPLIANT_KEYS" | grep -v '^$' | awk -F: '{print $1":"$2}' | sort | uniq -c | sort -nr

echo ""
echo "✅ Redis compliance check completed successfully"