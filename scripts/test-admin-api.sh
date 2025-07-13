#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
API_URL="http://localhost:3001/api/v1"

# Track results
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()

# Test function
test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local DATA=$3
    local DESCRIPTION=$4
    local AUTH_HEADER=$5
    
    echo -e "${BLUE}Testing: $DESCRIPTION${NC}"
    
    if [ -z "$DATA" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "$API_URL$ENDPOINT" \
            -H "Content-Type: application/json" \
            ${AUTH_HEADER:+-H "$AUTH_HEADER"})
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "$API_URL$ENDPOINT" \
            -H "Content-Type: application/json" \
            ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
            -d "$DATA")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ $HTTP_CODE -ge 200 && $HTTP_CODE -lt 300 ]] || [[ $HTTP_CODE -eq 401 && $ENDPOINT == "/admin/"* && -z "$AUTH_HEADER" ]]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $HTTP_CODE"
        ((PASS_COUNT++))
        RESULTS+=("PASS|$DESCRIPTION|$HTTP_CODE")
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $HTTP_CODE"
        echo "Response: $BODY"
        ((FAIL_COUNT++))
        RESULTS+=("FAIL|$DESCRIPTION|$HTTP_CODE|$BODY")
    fi
    echo ""
}

echo -e "${YELLOW}🔍 Testing Admin Tags & Categories API Endpoints${NC}\n"

# Test without auth (should return 401)
echo -e "${YELLOW}=== Testing Unauthorized Access ===${NC}\n"
test_endpoint "GET" "/admin/tags" "" "GET /admin/tags (no auth)"
test_endpoint "GET" "/admin/categories" "" "GET /admin/categories (no auth)"

# Try to get auth token using different approaches
echo -e "${YELLOW}=== Testing Authentication ===${NC}\n"

# Test different auth endpoints
test_endpoint "POST" "/auth/login" '{"email":"admin@example.com","password":"admin123"}' "POST /auth/login (admin)"
test_endpoint "POST" "/auth/login" '{"email":"test@example.com","password":"password123"}' "POST /auth/login (test user)"

# Test without proper auth but with direct token approach
AUTH_TOKEN="test-token-123" # Placeholder since we can't login
AUTH_HEADER="Authorization: Bearer $AUTH_TOKEN"

echo -e "${YELLOW}=== Testing Tags Endpoints ===${NC}\n"

# Test Tags GET endpoints
test_endpoint "GET" "/admin/tags" "" "GET /admin/tags (list)" "$AUTH_HEADER"
test_endpoint "GET" "/admin/tags/stats" "" "GET /admin/tags/stats" "$AUTH_HEADER"

# Test Tags POST endpoint
TAG_DATA='{"name":"Test Tag","slug":"test-tag-'$(date +%s)'","description":"Test tag description"}'
test_endpoint "POST" "/admin/tags" "$TAG_DATA" "POST /admin/tags (create)" "$AUTH_HEADER"

# Test specific tag operations (using placeholder UUID)
FAKE_UUID="12345678-1234-1234-1234-123456789012"
test_endpoint "GET" "/admin/tags/$FAKE_UUID" "" "GET /admin/tags/[uuid]" "$AUTH_HEADER"
test_endpoint "PUT" "/admin/tags/$FAKE_UUID" '{"name":"Updated Tag"}' "PUT /admin/tags/[uuid]" "$AUTH_HEADER"
test_endpoint "DELETE" "/admin/tags/$FAKE_UUID" "" "DELETE /admin/tags/[uuid]" "$AUTH_HEADER"

echo -e "${YELLOW}=== Testing Categories Endpoints ===${NC}\n"

# Test Categories GET endpoints
test_endpoint "GET" "/admin/categories" "" "GET /admin/categories (list)" "$AUTH_HEADER"
test_endpoint "GET" "/admin/categories/stats" "" "GET /admin/categories/stats" "$AUTH_HEADER"

# Test Categories POST endpoints
CATEGORY_DATA='{"name":"Test Category","slug":"test-category-'$(date +%s)'","description":"Test category description"}'
test_endpoint "POST" "/admin/categories/create" "$CATEGORY_DATA" "POST /admin/categories/create" "$AUTH_HEADER"

# Test specific category operations
test_endpoint "GET" "/admin/categories/$FAKE_UUID" "" "GET /admin/categories/[uuid]" "$AUTH_HEADER"
test_endpoint "PUT" "/admin/categories/update" '{"id":"'$FAKE_UUID'","name":"Updated Category"}' "PUT /admin/categories/update" "$AUTH_HEADER"
test_endpoint "POST" "/admin/categories/delete" '{"id":"'$FAKE_UUID'"}' "POST /admin/categories/delete" "$AUTH_HEADER"

# Test bulk operations
test_endpoint "POST" "/admin/categories/bulk" '{"action":"delete","ids":[]}' "POST /admin/categories/bulk" "$AUTH_HEADER"

# Test category-tag relationships
test_endpoint "GET" "/admin/categories/tags" "" "GET /admin/categories/tags" "$AUTH_HEADER"

# Generate Report
echo -e "${YELLOW}=== TEST REPORT ===${NC}\n"
echo -e "Total Tests: $((PASS_COUNT + FAIL_COUNT))"
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo -e "Success Rate: $(( PASS_COUNT * 100 / (PASS_COUNT + FAIL_COUNT) ))%\n"

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for result in "${RESULTS[@]}"; do
        IFS='|' read -r status desc code body <<< "$result"
        if [ "$status" == "FAIL" ]; then
            echo -e "  - $desc (Status: $code)"
            if [ ! -z "$body" ]; then
                echo -e "    Error: $(echo $body | jq -r '.error // .message // .' 2>/dev/null || echo $body)"
            fi
        fi
    done
fi

echo -e "\n${YELLOW}Note: Most tests are expected to fail with 401 Unauthorized without proper authentication.${NC}"
echo -e "${YELLOW}This test script focuses on verifying that the endpoints exist and respond appropriately.${NC}"