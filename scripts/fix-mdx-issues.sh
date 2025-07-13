#!/bin/bash

# Comprehensive MDX Issue Fixer
# This script finds and fixes common MDX compilation issues in markdown files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCS_DIR="${1:-./docs}"
DRY_RUN="${2:-false}"
VERBOSE="${3:-false}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              MDX Issue Fixer - Comprehensive               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to log verbose messages
log_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${YELLOW}[VERBOSE]${NC} $1"
    fi
}

# Function to fix MDX issues in a file
fix_mdx_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    local changes_made=false
    
    # Create a backup if not in dry-run mode
    if [ "$DRY_RUN" = "false" ]; then
        cp "$file" "${file}.bak"
    fi
    
    # Read file content
    content=$(<"$file")
    original_content="$content"
    
    # Pattern 1: Fix <number in markdown (not in code blocks)
    # This is the most common issue
    if echo "$content" | grep -qE '(?<!`)<[0-9]'; then
        log_verbose "Found <number pattern in $file"
        # Use perl for more advanced regex with lookbehind
        content=$(echo "$content" | perl -pe 's/(?<!`)(<)([0-9])/&lt;$2/g unless /^```/')
        changes_made=true
    fi
    
    # Pattern 2: Fix comparison operators in tables
    if echo "$content" | grep -qE '\|.*<[0-9].*\|'; then
        log_verbose "Found <number in table in $file"
        # Fix specifically in table rows
        content=$(echo "$content" | awk '
            /^\|/ && /\|.*<[0-9]/ {
                gsub(/<([0-9])/, "\\&lt;\\1")
            }
            { print }
        ')
        changes_made=true
    fi
    
    # Pattern 3: Fix <= and >= operators
    if echo "$content" | grep -qE '(<=|>=)'; then
        log_verbose "Found <= or >= operators in $file"
        content=$(echo "$content" | sed -E 's/(<)=/\&lt;=/g; s/(>)=/\&gt;=/g')
        changes_made=true
    fi
    
    # Pattern 4: Fix HTML-like tags that aren't valid JSX
    if echo "$content" | grep -qE '<[^>]+\s+[0-9]'; then
        log_verbose "Found potential HTML tag with number attribute in $file"
        # This is more complex and needs careful handling
        # For now, we'll flag it for manual review
        echo -e "${YELLOW}⚠️  Warning: $file may contain HTML tags with numeric attributes that need manual review${NC}"
    fi
    
    # Check if changes were made
    if [ "$content" != "$original_content" ]; then
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}Would fix: $file${NC}"
            if [ "$VERBOSE" = "true" ]; then
                echo -e "${BLUE}Changes that would be made:${NC}"
                diff -u <(echo "$original_content") <(echo "$content") || true
            fi
        else
            echo "$content" > "$file"
            echo -e "${GREEN}✅ Fixed: $file${NC}"
            # Remove backup if successful
            rm -f "${file}.bak"
        fi
        return 0
    else
        log_verbose "No changes needed for $file"
        # Remove unnecessary backup
        [ "$DRY_RUN" = "false" ] && rm -f "${file}.bak"
        return 1
    fi
}

# Main execution
echo -e "${BLUE}Scanning for MDX issues in: $DOCS_DIR${NC}"
echo -e "${BLUE}Dry run: $DRY_RUN${NC}"
echo -e "${BLUE}Verbose: $VERBOSE${NC}"
echo ""

# Find all markdown files
files_found=0
files_fixed=0

while IFS= read -r -d '' file; do
    ((files_found++))
    if fix_mdx_file "$file"; then
        ((files_fixed++))
    fi
done < <(find "$DOCS_DIR" -name "*.md" -o -name "*.mdx" -print0)

# Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "  Files scanned: $files_found"
echo -e "  Files fixed: $files_fixed"

if [ "$DRY_RUN" = "true" ]; then
    echo ""
    echo -e "${YELLOW}This was a dry run. To apply fixes, run:${NC}"
    echo -e "${BLUE}./scripts/fix-mdx-issues.sh $DOCS_DIR false${NC}"
fi

# Create a report of common patterns found
if [ "$VERBOSE" = "true" ]; then
    echo ""
    echo -e "${BLUE}Common patterns found:${NC}"
    grep -h '<[0-9]' "$DOCS_DIR"/**/*.md 2>/dev/null | head -10 || echo "No patterns found"
fi

echo ""
echo -e "${GREEN}✅ MDX issue scan complete!${NC}"