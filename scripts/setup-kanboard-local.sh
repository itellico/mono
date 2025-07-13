#!/bin/bash

echo "Setting up Kanboard using local PHP container..."

# Create Kanboard directory
mkdir -p /Users/mm2/dev_mm/mono/php/kanboard

# Download Kanboard
echo "Downloading Kanboard v1.2.35..."
cd /Users/mm2/dev_mm/mono/php
curl -L https://github.com/kanboard/kanboard/archive/v1.2.35.tar.gz -o kanboard.tar.gz
tar xzf kanboard.tar.gz
mv kanboard-1.2.35/* kanboard/
rm -rf kanboard-1.2.35 kanboard.tar.gz

# Create data and plugins directories
mkdir -p kanboard/data kanboard/plugins

# Download Mattermost plugin
echo "Downloading Mattermost plugin..."
cd kanboard/plugins
curl -L https://github.com/kanboard/plugin-mattermost/releases/download/v1.0.4/Mattermost-1.0.4.zip -o mattermost.zip
unzip -o mattermost.zip
rm mattermost.zip

# Copy config
echo "Setting up configuration..."
cp /Users/mm2/dev_mm/mono/docker/kanboard/config.php /Users/mm2/dev_mm/mono/php/kanboard/

# Set permissions
echo "Setting permissions..."
chmod -R 755 /Users/mm2/dev_mm/mono/php/kanboard/data
chmod -R 755 /Users/mm2/dev_mm/mono/php/kanboard/plugins

echo ""
echo "Kanboard setup complete!"
echo "Access it at: http://localhost:4041"
echo "Default credentials: admin/admin"