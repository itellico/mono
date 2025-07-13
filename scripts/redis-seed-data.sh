#!/bin/bash

echo "🌱 Seeding Redis with Development Data"
echo "======================================"

# Function to add data with feedback
add_redis_data() {
    local key="$1"
    local value="$2"
    local type="$3"
    echo "📝 Adding $type: $key"
    redis-cli -h localhost -p 6379 set "$key" "$value" > /dev/null
}

add_redis_hash() {
    local key="$1"
    local field="$2"
    local value="$3"
    echo "📝 Adding hash field: $key.$field"
    redis-cli -h localhost -p 6379 hset "$key" "$field" "$value" > /dev/null
}

add_redis_list() {
    local key="$1"
    local value="$2"
    echo "📝 Adding to list: $key"
    redis-cli -h localhost -p 6379 lpush "$key" "$value" > /dev/null
}

# 1. AUTHENTICATION & SESSIONS
echo ""
echo "🔐 1. Authentication & Sessions"
add_redis_data "temp:session:demo-session-123" '{"userId":"user-123","tenantId":"tenant-1","role":"admin","expires":"2025-12-31T23:59:59Z"}' "session"
add_redis_data "temp:refresh:demo-refresh-456" '{"sessionId":"demo-session-123","userId":"user-123","expires":"2025-12-31T23:59:59Z"}' "refresh token"
add_redis_data "temp:otp:user-123:login" "123456" "OTP code"

# 2. USER PERMISSIONS & RBAC
echo ""
echo "👤 2. User Permissions & RBAC"
add_redis_data "tenant:1:user:123:permissions" '["admin.users.read","admin.users.create","admin.tenants.manage","platform.monitoring.read"]' "user permissions"
add_redis_data "tenant:1:user:456:permissions" '["user.profile.read","user.profile.update","account.billing.read"]' "user permissions"
add_redis_data "platform:roles:all" '["super_admin","tenant_admin","account_admin","user","viewer"]' "system roles"

# 3. TENANT CONFIGURATIONS
echo ""
echo "🏢 3. Tenant Configurations"
add_redis_hash "tenant:1:config" "name" "Demo Tenant"
add_redis_hash "tenant:1:config" "domain" "demo.mono.com"
add_redis_hash "tenant:1:config" "theme" "dark"
add_redis_hash "tenant:1:config" "timezone" "UTC"
add_redis_hash "tenant:1:config" "features" '["analytics","workflows","integrations"]'

add_redis_hash "tenant:2:config" "name" "Test Tenant"
add_redis_hash "tenant:2:config" "domain" "test.mono.com"
add_redis_hash "tenant:2:config" "theme" "light"
add_redis_hash "tenant:2:config" "timezone" "America/New_York"

# 4. CACHING LAYERS
echo ""
echo "⚡ 4. Application Cache"
add_redis_data "tenant:1:search:users:hash123" '{"results":[{"id":"user-123","name":"Admin User"},{"id":"user-456","name":"Demo User"}],"total":2,"page":1}' "search cache"
add_redis_data "tenant:1:analytics:dashboard" '{"totalUsers":156,"activeUsers":89,"revenue":45600,"growth":12.5}' "analytics cache"
add_redis_data "platform:features:enabled" '["audit_logging","monitoring","multi_tenant","rbac","workflows"]' "feature flags"

# 5. RATE LIMITING
echo ""
echo "🚦 5. Rate Limiting"
add_redis_data "temp:rate-limit:POST/api/login:127.0.0.1" "3" "rate limit counter"
add_redis_data "temp:rate-limit:GET/api/users:user-123" "45" "API rate limit"

# 6. WORKFLOW & QUEUE DATA
echo ""
echo "🔄 6. Workflow & Queue Data"
add_redis_list "tenant:1:queue:email" '{"type":"welcome_email","userId":"user-123","data":{"email":"demo@example.com","name":"Demo User"}}'
add_redis_list "tenant:1:queue:notifications" '{"type":"user_created","tenantId":"tenant-1","userId":"user-456","timestamp":"2025-07-06T06:00:00Z"}'

# 7. FEATURE FLAGS & SETTINGS
echo ""
echo "🎛️  7. Feature Flags & Settings"
add_redis_hash "platform:feature_flags" "new_dashboard" "true"
add_redis_hash "platform:feature_flags" "beta_workflows" "false"
add_redis_hash "platform:feature_flags" "advanced_analytics" "true"

add_redis_hash "tenant:1:settings" "max_users" "100"
add_redis_hash "tenant:1:settings" "storage_limit" "10GB"
add_redis_hash "tenant:1:settings" "api_rate_limit" "1000"

# 8. MONITORING & METRICS
echo ""
echo "📊 8. Monitoring & Metrics"
add_redis_data "platform:metrics:active_tenants" "25" "metric"
add_redis_data "platform:metrics:total_users" "1547" "metric"
add_redis_data "tenant:1:metrics:api_calls_today" "2847" "metric"

# 9. TEMPORARY DATA
echo ""
echo "⏰ 9. Temporary Data"
add_redis_data "temp:file_upload:abc123" '{"filename":"document.pdf","size":"2.4MB","status":"processing"}' "temp file"
add_redis_data "temp:export:user-123:xlsx" '{"status":"generating","progress":75,"eta":"2 minutes"}' "temp export"

# 10. LOCKS & COORDINATION
echo ""
echo "🔒 10. Locks & Coordination"
add_redis_data "lock:tenant:1:user:123:edit" "user-456" "edit lock"
add_redis_data "lock:system:backup" "backup-process-789" "system lock"

# Set TTL for temporary data
echo ""
echo "⏰ Setting TTL for temporary data..."
redis-cli -h localhost -p 6379 expire "temp:session:demo-session-123" 3600 > /dev/null
redis-cli -h localhost -p 6379 expire "temp:refresh:demo-refresh-456" 7200 > /dev/null
redis-cli -h localhost -p 6379 expire "temp:otp:user-123:login" 300 > /dev/null
redis-cli -h localhost -p 6379 expire "temp:rate-limit:POST/api/login:127.0.0.1" 3600 > /dev/null
redis-cli -h localhost -p 6379 expire "temp:file_upload:abc123" 1800 > /dev/null
redis-cli -h localhost -p 6379 expire "lock:tenant:1:user:123:edit" 1800 > /dev/null

echo ""
echo "✅ Redis seeding complete!"
echo ""
echo "📊 Summary:"
echo "   Total keys: $(redis-cli -h localhost -p 6379 dbsize)"
echo "   Memory used: $(redis-cli -h localhost -p 6379 info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"
echo ""
echo "🔍 Explore in RedisInsight: http://localhost:5540"
echo "💡 View all keys: redis-cli -h localhost -p 6379 keys '*'"