#!/bin/bash

echo "🔄 Restarting N8N with secure cookie disabled..."
echo "============================================="

# Stop N8N
echo "⏹️  Stopping N8N..."
docker-compose stop n8n

# Remove the container to ensure environment variables are reloaded
echo "🗑️  Removing N8N container..."
docker-compose rm -f n8n

# Start N8N with new configuration
echo "▶️  Starting N8N with updated configuration..."
docker-compose up -d n8n

echo ""
echo "⏳ Waiting for N8N to be ready..."
sleep 10

# Check if N8N is running
if docker-compose ps | grep -q "mono-n8n.*Up"; then
    echo "✅ N8N is running!"
    echo ""
    echo "📋 N8N Access Details:"
    echo "• URL: http://localhost:5678"
    echo "• Username: admin"
    echo "• Password: admin123"
    echo ""
    echo "🔒 Security Note: Secure cookies have been disabled for local development."
    echo "   This setting should NOT be used in production!"
else
    echo "❌ N8N failed to start. Check logs with:"
    echo "   docker-compose logs n8n"
fi