#!/bin/bash

# Start Docusaurus Documentation Site with auto-restart

echo "🚀 Starting Docusaurus Documentation Site..."

# Change to docs-site directory
cd docs-site

# Kill any existing Docusaurus processes
pkill -f docusaurus || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Function to start Docusaurus
start_docusaurus() {
    echo "📚 Starting Docusaurus on port 3005..."
    pnpm run start
}

# Keep Docusaurus running
while true; do
    start_docusaurus
    
    # If it exits, wait and restart
    echo "⚠️  Docusaurus stopped. Restarting in 5 seconds..."
    sleep 5
done