#!/bin/bash

echo "Installing Kanboard plugins..."

# Wait for Kanboard container to be ready
echo "Waiting for Kanboard to be ready..."
sleep 10

# Install Mattermost plugin
echo "Installing Mattermost plugin..."
docker-compose exec -T kanboard sh -c "
    cd /var/www/app/plugins && \
    curl -L https://github.com/kanboard/plugin-mattermost/releases/download/v1.0.4/Mattermost-1.0.4.zip -o mattermost.zip && \
    unzip -o mattermost.zip && \
    rm mattermost.zip && \
    chown -R nginx:nginx /var/www/app/plugins/
"

echo "Mattermost plugin installed successfully!"
echo ""
echo "Access Kanboard at:"
echo "  - Direct: http://localhost:4041"
echo "  - Default credentials: admin/admin"
echo ""
echo "To configure Mattermost integration:"
echo "  1. Log in to Kanboard"
echo "  2. Go to Settings -> Integrations"
echo "  3. Configure Mattermost webhook URL and channel"