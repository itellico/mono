#!/bin/bash

# Simple Kanboard API test
API_TOKEN="ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad"
API_URL="http://localhost:4041/jsonrpc.php"

echo "Testing Kanboard API with different authentication methods..."
echo ""

# Method 1: Using Authorization header with Token
echo "1. Testing with Authorization: Bearer header..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"jsonrpc": "2.0", "method": "getVersion", "id": 1}' | jq .

echo ""

# Method 2: Using X-API-Auth header
echo "2. Testing with X-API-Auth header..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Auth: $API_TOKEN" \
  -d '{"jsonrpc": "2.0", "method": "getVersion", "id": 1}' | jq .

echo ""

# Method 3: Using basic auth with token as username
echo "3. Testing with Basic Auth (token as username)..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -u "$API_TOKEN:api-token" \
  -d '{"jsonrpc": "2.0", "method": "getVersion", "id": 1}' | jq .

echo ""

# Method 4: Using basic auth with jsonrpc as username
echo "4. Testing with Basic Auth (jsonrpc as username)..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -u "jsonrpc:$API_TOKEN" \
  -d '{"jsonrpc": "2.0", "method": "getVersion", "id": 1}' | jq .