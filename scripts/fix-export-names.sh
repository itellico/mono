#!/bin/bash

echo "🔧 Fixing export name mismatches in tier index files..."

cd /Users/mm2/dev_mm/mono/apps/api

# Function to fix imports in a tier index file
fix_tier_imports() {
  local tier=$1
  local index_file="src/routes/v1/$tier/index.ts"
  
  if [ ! -f "$index_file" ]; then
    echo "⚠️  Skipping $tier - index file not found"
    return
  fi
  
  echo "📁 Processing $tier tier..."
  
  # Read the index file and find all imports
  while IFS= read -r line; do
    if [[ $line =~ import.*from.*\'\.\/([^\']+)\' ]]; then
      subdir="${BASH_REMATCH[1]}"
      subdir_file="src/routes/v1/$tier/$subdir/index.ts"
      
      if [ -f "$subdir_file" ]; then
        # Find the actual export name
        actual_export=$(grep -m1 "export const.*Routes.*FastifyPluginAsync" "$subdir_file" | sed -E 's/.*export const ([^:]*).*/\1/')
        
        if [ ! -z "$actual_export" ]; then
          # Extract the imported name from the import line
          imported_name=$(echo "$line" | sed -E 's/import.*\{ ([^}]*) \}.*/\1/')
          
          if [ "$actual_export" != "$imported_name" ]; then
            echo "  🔄 Fixing $subdir: $imported_name → $actual_export"
            # Update the import to use the correct export name with alias
            sed -i '' "s/import { $imported_name }/import { $actual_export as $imported_name }/g" "$index_file"
          fi
        fi
      fi
    fi
  done < "$index_file"
}

# Fix each tier
fix_tier_imports "public"
fix_tier_imports "user" 
fix_tier_imports "account"
fix_tier_imports "tenant"
fix_tier_imports "platform"

echo "✅ Export name fixes complete"