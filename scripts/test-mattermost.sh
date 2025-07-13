#!/bin/bash

# Test Mattermost notification via N8N webhook
# This script sends a test documentation approval request

echo "🚀 Testing Mattermost notification via N8N..."

# Change to project directory
cd /Users/mm2/dev_mm/mono

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -E '^(MATTERMOST_WEBHOOK_URL|MATTERMOST_DOCS_CHANNEL|N8N_DOCS_WEBHOOK_URL)' .env.local | xargs)
    echo "✅ Environment variables loaded from .env.local"
else
    echo "⚠️  .env.local not found, using defaults"
fi

# Run the test script
echo "📤 Executing test script..."
npx tsx scripts/test-mattermost-notification.ts

echo ""
echo "📱 Check your #mono-docs channel in Mattermost for the notification!"