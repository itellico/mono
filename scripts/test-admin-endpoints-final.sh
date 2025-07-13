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
    
    # Accept 401 for unauthorized requests as expected behavior
    if [[ $HTTP_CODE -ge 200 && $HTTP_CODE -lt 300 ]] || [[ $HTTP_CODE -eq 401 && -z "$AUTH_HEADER" ]]; then
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

echo -e "${YELLOW}🔍 Testing New Admin Tags & Categories API Endpoints${NC}\n"

# Test without auth first (should return 401)
echo -e "${YELLOW}=== Testing Unauthorized Access (Expecting 401) ===${NC}\n"

# Test new admin tags endpoints
test_endpoint "GET" "/admin/tags" "" "GET /admin/tags (no auth - should be 401)"
test_endpoint "GET" "/admin/tags/stats" "" "GET /admin/tags/stats (no auth - should be 401)"
test_endpoint "POST" "/admin/tags" '{"name":"Test","categoryIds":[1]}' "POST /admin/tags (no auth - should be 401)"

# Test categories endpoints (RESTful)
test_endpoint "GET" "/admin/categories" "" "GET /admin/categories (no auth - should be 401)"
test_endpoint "POST" "/admin/categories" '{"name":"Test Category","type":"test"}' "POST /admin/categories (no auth - should be 401)"
test_endpoint "GET" "/admin/categories/stats" "" "GET /admin/categories/stats (no auth - should be 401)"

echo -e "${YELLOW}=== Testing Route Registration (404 vs 401 shows route exists) ===${NC}\n"

# These should return 401 (route exists, auth required) not 404 (route not found)
test_endpoint "GET" "/admin/tags" "" "Admin Tags Route Registration Check"
test_endpoint "GET" "/admin/categories" "" "Admin Categories Route Registration Check"

# Test bulk endpoints
test_endpoint "POST" "/admin/tags/bulk" '{"action":"create","tags":[]}' "POST /admin/tags/bulk (route check)"
test_endpoint "POST" "/admin/categories/bulk" '{"action":"delete","ids":[]}' "POST /admin/categories/bulk (route check)"

echo -e "${YELLOW}=== Testing CRUD Endpoint Patterns ===${NC}\n"

# Test UUID-based CRUD (RESTful pattern)
FAKE_UUID="12345678-1234-1234-1234-123456789012"

# Tags CRUD
test_endpoint "GET" "/admin/tags/$FAKE_UUID" "" "GET /admin/tags/[uuid] (RESTful)"
test_endpoint "PATCH" "/admin/tags/$FAKE_UUID" '{"name":"Updated"}' "PATCH /admin/tags/[uuid] (RESTful)"
test_endpoint "DELETE" "/admin/tags/$FAKE_UUID" "" "DELETE /admin/tags/[uuid] (RESTful)"

# Categories CRUD
test_endpoint "GET" "/admin/categories/$FAKE_UUID" "" "GET /admin/categories/[uuid] (RESTful)"
test_endpoint "PATCH" "/admin/categories/$FAKE_UUID" '{"name":"Updated"}' "PATCH /admin/categories/[uuid] (RESTful)"
test_endpoint "DELETE" "/admin/categories/$FAKE_UUID" "" "DELETE /admin/categories/[uuid] (RESTful)"

# Generate Report
echo -e "${YELLOW}=== ENDPOINT REGISTRATION REPORT ===${NC}\n"
echo -e "Total Tests: $((PASS_COUNT + FAIL_COUNT))"
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "\n${RED}Failed Tests (Routes may not be registered):${NC}"
    for result in "${RESULTS[@]}"; do
        IFS='|' read -r status desc code body <<< "$result"
        if [ "$status" == "FAIL" ]; then
            if [[ $code == "404" ]]; then
                echo -e "  - ❌ $desc (Status: $code) - ROUTE NOT FOUND"
            else
                echo -e "  - ⚠️  $desc (Status: $code) - Route exists but other error"
            fi
        fi
    done
fi

echo -e "\n${YELLOW}✅ SUCCESS CRITERIA:${NC}"
echo -e "- Status 401 (Unauthorized) = Route exists, authentication required ✅"
echo -e "- Status 404 (Not Found) = Route not registered ❌"
echo -e "- Status 200-299 = Route working (if auth was provided) ✅"

echo -e "\n${BLUE}Note: All 401 responses are expected and indicate successful route registration.${NC}"
echo -e "${BLUE}Only 404 responses indicate missing route registration.${NC}"