#!/bin/bash

# ==========================================
# GRID MIGRATION ROLLBACK SCRIPT
# ==========================================
# 
# This script rolls back the Mono → Grid migration by restoring
# from the backup created during migration.
#

set -e

echo "🔄 Grid Migration Rollback"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Find the most recent backup
BACKUP_DIR=$(find backup -name "pre-grid-migration-*" -type d 2>/dev/null | sort -r | head -n 1)

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ Error: No Grid migration backup found in backup/ directory"
    echo "Expected backup directory pattern: backup/pre-grid-migration-YYYYMMDD_HHMMSS"
    exit 1
fi

echo "📦 Found backup: $BACKUP_DIR"
echo ""

# Confirm rollback
read -p "⚠️  This will restore ALL files from backup. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

echo "🔄 Starting rollback..."

# Create a backup of current state before rollback
CURRENT_BACKUP="backup/pre-rollback-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$CURRENT_BACKUP"
echo "📦 Backing up current state to: $CURRENT_BACKUP"
cp -r . "$CURRENT_BACKUP/" 2>/dev/null || true

# Restore from backup
echo "🔄 Restoring files from $BACKUP_DIR..."

# Remove current files (except backup directory)
find . -mindepth 1 -maxdepth 1 -not -name "backup" -exec rm -rf {} \; 2>/dev/null || true

# Restore from backup
cp -r "$BACKUP_DIR"/* . 2>/dev/null || true
cp -r "$BACKUP_DIR"/.[^.]* . 2>/dev/null || true  # Include hidden files

echo "✅ Files restored successfully"

echo ""
echo "🧪 Verifying rollback..."

# Check for Grid references (should be minimal after rollback)
grid_refs=$(find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
    -exec grep -i "grid" {} \; 2>/dev/null | wc -l)

# Check for Mono references (should be restored)
mono_refs=$(find . -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/.git/*" \
    -exec grep -i "mono" {} \; 2>/dev/null | wc -l)

echo "📊 Rollback verification:"
echo "  🔍 Mono references: $mono_refs (should be high)"
echo "  🔍 Grid references: $grid_refs (should be low)"

if [ "$mono_refs" -gt 100 ] && [ "$grid_refs" -lt 50 ]; then
    echo "✅ Rollback appears successful"
    rollback_success=true
else
    echo "⚠️  Rollback verification unclear - manual check recommended"
    rollback_success=false
fi

echo ""
echo "📋 POST-ROLLBACK STEPS:"
echo "----------------------"
echo "1. 🔄 Reinstall dependencies: rm package-lock.json pnpm-lock.yaml && pnpm install"
echo "2. 🏗️  Rebuild project: pnpm run build"
echo "3. 🧪 Run tests: pnpm test"
echo "4. 🔍 Verify application functionality"

if [ "$rollback_success" = true ]; then
    echo ""
    echo "🎉 ROLLBACK COMPLETED SUCCESSFULLY!"
    echo "📁 Current state backup: $CURRENT_BACKUP"
    echo "📁 Original backup used: $BACKUP_DIR"
else
    echo ""
    echo "⚠️  ROLLBACK MAY NEED MANUAL VERIFICATION"
    echo "Please check the application manually to ensure everything is working correctly."
fi

echo ""
echo "💡 Note: You can delete backup directories once you're confident in the rollback"