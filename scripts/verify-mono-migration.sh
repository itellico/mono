#!/bin/bash

echo "🔍 Final verification: Checking for any remaining 'mono' references..."
echo ""

# Check code files for mono references
echo "📁 Checking TypeScript/JavaScript files..."
code_files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -not -path "./.next/*" \
    -exec grep -l -i "mono" {} \; 2>/dev/null)

if [ -z "$code_files" ]; then
    echo "✅ No 'mono' references found in code files!"
else
    echo "⚠️  Code files still containing 'mono':"
    echo "$code_files"
fi

echo ""
echo "📄 Checking configuration files..."
config_files=$(find . -type f \( -name "*.json" -o -name "*.yml" -o -name "*.yaml" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -exec grep -l -i "mono" {} \; 2>/dev/null)

if [ -z "$config_files" ]; then
    echo "✅ No 'mono' references found in configuration files!"
else
    echo "⚠️  Configuration files still containing 'mono':"
    echo "$config_files"
fi

echo ""
echo "📝 Checking documentation files (these may be intentional)..."
doc_files=$(find . -type f -name "*.md" \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -exec grep -l -i "mono" {} \; 2>/dev/null)

if [ -z "$doc_files" ]; then
    echo "✅ No 'mono' references found in documentation files!"
else
    echo "📋 Documentation files containing 'mono' (may need manual review):"
    echo "$doc_files"
fi

echo ""
echo "📂 Files with 'mono' in filename (consider renaming):"
find . -name "*mono*" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | while read file; do
    echo "   $file"
done

echo ""
echo "✅ Verification complete!"