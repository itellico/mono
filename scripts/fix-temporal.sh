#!/bin/bash

echo "🔧 Fixing Temporal 500 Error"
echo "============================="

echo ""
echo "🔍 Current Issue:"
echo "• Temporal Web UI can't connect to Temporal Server"
echo "• Getting 500/503 errors in the web interface"
echo "• Server is running but networking isn't configured properly"

echo ""
echo "🛠️  Solution Options:"

echo ""
echo "Option 1: Restart Everything (Recommended)"
echo "docker-compose down"
echo "docker-compose up -d postgres redis"
echo "sleep 10"
echo "docker-compose up -d temporal"
echo "sleep 15" 
echo "docker-compose up -d temporal-web"

echo ""
echo "Option 2: Use Temporal CLI directly"
echo "# Connect directly to Temporal server"
echo "docker-compose exec temporal tctl namespace list"

echo ""
echo "Option 3: Check container networking"
echo "docker-compose exec temporal-web ping temporal"

echo ""
echo "🚀 Quick Fix - Let's restart the services:"
echo ""

# Stop temporal services
echo "Stopping Temporal services..."
docker-compose stop temporal-web temporal

# Restart temporal server
echo "Restarting Temporal server..."
docker-compose restart temporal

# Wait for server to be ready
echo "Waiting for Temporal server to be ready..."
sleep 20

# Start web ui
echo "Starting Temporal Web UI..."
docker-compose up -d temporal-web

# Wait for web ui
echo "Waiting for Web UI to connect..."
sleep 10

echo ""
echo "✅ Temporal restart complete!"
echo ""
echo "🔗 Test URLs:"
echo "• Temporal Web UI: http://localhost:8080"
echo "• Should see namespaces and workflows"
echo ""
echo "💡 If still having issues:"
echo "1. The Temporal server might need more time to initialize"
echo "2. Try refreshing the browser page"
echo "3. Check that both containers are healthy in docker-compose ps"