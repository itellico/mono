#!/bin/bash

# Mono Platform - Local Domain Cleanup Script
# This script removes local domain entries from /etc/hosts

set -e

echo "🧹 Mono Platform - Local Domain Cleanup"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo to modify /etc/hosts${NC}"
    echo "Usage: sudo ./scripts/cleanup-local-domains.sh"
    exit 1
fi

# Check if Mono Platform section exists
if ! grep -q "# Mono Platform Local Development" /etc/hosts; then
    echo -e "${YELLOW}⚠️  No Mono Platform domains found in /etc/hosts${NC}"
    exit 0
fi

echo "📝 Removing Mono Platform domains from /etc/hosts..."

# Create a temporary file
TEMP_FILE=$(mktemp)

# Copy everything except Mono Platform section
awk '
    /^# Mono Platform Local Development$/ { skip = 1 }
    /^# End Mono Platform Local Development$/ { skip = 0; next }
    !skip { print }
' /etc/hosts > "$TEMP_FILE"

# Replace hosts file
cp "$TEMP_FILE" /etc/hosts
rm "$TEMP_FILE"

echo -e "${GREEN}✓ Mono Platform domains removed${NC}"

# Clean up empty lines at the end
sed -i -e :a -e '/^\s*$/d;N;ba' /etc/hosts

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "💡 To set up domains again, run:"
echo "   sudo ./scripts/setup-local-domains.sh"