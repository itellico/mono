#!/bin/bash

echo "🔧 Fixing Redis Connection for RedisInsight"
echo "============================================"

echo ""
echo "🔍 Diagnosing the issue..."

# Check if Redis is running
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo "✅ Redis is accessible from host"
else
    echo "❌ Redis is not accessible from host"
    exit 1
fi

# Check Docker network
echo ""
echo "🌐 Docker Network Information:"
docker-compose exec redisinsight ping -c 1 redis > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ RedisInsight can reach Redis container"
else
    echo "❌ RedisInsight cannot reach Redis container"
fi

echo ""
echo "🛠️  Solution: Use Docker service name instead of localhost"
echo ""
echo "In RedisInsight, use these connection details:"
echo "┌─────────────────────────────────────────┐"
echo "│ Host:     redis                         │"
echo "│ Port:     6379                          │"
echo "│ Name:     mono-redis                    │"
echo "│ Username: (leave empty)                 │"
echo "│ Password: (leave empty)                 │"
echo "│ Database: 0                             │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "🔑 Key Point: Use 'redis' as hostname, NOT 'localhost' or '127.0.0.1'"
echo ""
echo "📋 Why this works:"
echo "• RedisInsight runs inside Docker"
echo "• Docker containers use service names for networking"
echo "• 'redis' is the service name in docker-compose.yml"
echo "• 'localhost' refers to the RedisInsight container itself"
echo ""
echo "🔗 Open RedisInsight: http://localhost:5540"