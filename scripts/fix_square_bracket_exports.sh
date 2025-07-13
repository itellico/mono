#!/bin/bash

# Script to fix square bracket syntax errors in TypeScript export names
# This script will find and fix all occurrences of square brackets in export names

echo "Starting to fix square bracket syntax errors in TypeScript files..."

# Find all TypeScript files with square bracket exports
FILES=$(find /Users/mm2/dev_mm/mono/apps/api/src/routes -name "*.ts" -exec grep -l "export.*\[.*\]" {} \;)

for file in $FILES; do
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Fix various square bracket patterns
    sed -i '' 's/\[uuid\]/Uuid/g' "$file"
    sed -i '' 's/\[roleId\]/RoleId/g' "$file"
    sed -i '' 's/\[permissionId\]/PermissionId/g' "$file"
    sed -i '' 's/\[code\]/Code/g' "$file"
    sed -i '' 's/\[templateId\]/TemplateId/g' "$file"
    sed -i '' 's/\[slug\]/Slug/g' "$file"
    sed -i '' 's/\[key\]/Key/g' "$file"
    sed -i '' 's/\[id\]/Id/g' "$file"
    
    # Check if the file was actually changed
    if ! diff -q "$file" "$file.backup" > /dev/null; then
        echo "  ✓ Fixed: $file"
    else
        echo "  - No changes needed: $file"
        rm "$file.backup"
    fi
done

echo "Completed fixing square bracket syntax errors."
echo "Backup files created with .backup extension."
echo "Run 'find /Users/mm2/dev_mm/mono/apps/api/src/routes -name \"*.backup\" -delete' to remove backups after verification."