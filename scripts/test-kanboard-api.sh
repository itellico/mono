#!/bin/bash

echo "Testing Kanboard API connection..."

# Load the API token from .env.kanboard
source /Users/mm2/dev_mm/mono/.env.kanboard

# Test API endpoint
echo "API Endpoint: $KANBOARD_API_ENDPOINT"
echo "API Token: ${KANBOARD_API_TOKEN:0:20}..." # Show only first 20 chars for security

# Test API call - Get version
echo ""
echo "Testing API call (getVersion)..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Auth: $KANBOARD_API_TOKEN" \
  -d '{"jsonrpc":"2.0","method":"getVersion","id":1}' \
  "$KANBOARD_API_ENDPOINT" | jq .

# Test API call - Get current user
echo ""
echo "Testing API call (getMe)..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Auth: $KANBOARD_API_TOKEN" \
  -d '{"jsonrpc":"2.0","method":"getMe","id":1}' \
  "$KANBOARD_API_ENDPOINT" | jq .

echo ""
echo "API test complete!"