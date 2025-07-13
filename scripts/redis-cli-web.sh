#!/bin/bash

# Simple Redis CLI Web Interface
# This script provides basic Redis commands for development

echo "🔗 Redis Connection Info:"
echo "Host: localhost"
echo "Port: 6379"
echo "Container: mono-redis"
echo ""

echo "📝 Common Redis Commands:"
echo "View all keys: redis-cli keys '*'"
echo "Get value: redis-cli get 'key_name'"
echo "Set value: redis-cli set 'key_name' 'value'"
echo "Delete key: redis-cli del 'key_name'"
echo "Monitor commands: redis-cli monitor"
echo "Redis info: redis-cli info"
echo ""

echo "🚀 Testing Redis connection..."
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo "✅ Redis is running and accessible"
    echo ""
    echo "📊 Redis Info:"
    redis-cli -h localhost -p 6379 info server | grep redis_version
    redis-cli -h localhost -p 6379 info memory | grep used_memory_human
    echo ""
    echo "🔑 Current Keys:"
    redis-cli -h localhost -p 6379 keys '*' | head -10
else
    echo "❌ Cannot connect to Redis"
fi