#!/bin/bash

# Simple MDX Issue Fixer for specific files
# This script fixes known MDX compilation errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           MDX Issue Fixer - Targeted Fix                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fix the specific files with errors
echo -e "${BLUE}Fixing known problematic files...${NC}"

# Fix nestjs-service-update-guide.md (line 457)
if [ -f "docs/database/nestjs-service-update-guide.md" ]; then
    echo -e "${YELLOW}Fixing: docs/database/nestjs-service-update-guide.md${NC}"
    sed -i.bak -E '457s/<([0-9])/\&lt;\1/g' docs/database/nestjs-service-update-guide.md && \
    rm -f docs/database/nestjs-service-update-guide.md.bak
    echo -e "${GREEN}✅ Fixed${NC}"
fi

# Fix performance-monitoring-guide.md (line 12)
if [ -f "docs/database/performance-monitoring-guide.md" ]; then
    echo -e "${YELLOW}Fixing: docs/database/performance-monitoring-guide.md${NC}"
    sed -i.bak -E '12s/<([0-9])/\&lt;\1/g' docs/database/performance-monitoring-guide.md && \
    rm -f docs/database/performance-monitoring-guide.md.bak
    echo -e "${GREEN}✅ Fixed${NC}"
fi

# Now do a comprehensive search and fix for all < followed by numbers
echo ""
echo -e "${BLUE}Searching for all instances of '<number' pattern...${NC}"

# Find and fix all occurrences
find docs -name "*.md" -type f | while read -r file; do
    # Check if file contains the pattern
    if grep -q '<[0-9]' "$file" 2>/dev/null; then
        echo -e "${YELLOW}Found issues in: $file${NC}"
        # Create backup
        cp "$file" "$file.bak"
        # Fix the issue - replace <number with &lt;number
        sed -i '' -E 's/<([0-9])/\&lt;\1/g' "$file"
        # Check if changes were made
        if ! diff -q "$file" "$file.bak" >/dev/null; then
            echo -e "${GREEN}✅ Fixed: $file${NC}"
            rm -f "$file.bak"
        else
            rm -f "$file.bak"
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ MDX issue fixing complete!${NC}"
echo ""
echo -e "${BLUE}You can now rebuild the documentation site.${NC}"