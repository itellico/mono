#!/bin/bash

# Fix PHP pdo_pgsql extension
# This script ensures the pdo_pgsql extension is installed and enabled

echo "🔧 Checking PHP pdo_pgsql extension..."

# Check if extension is loaded
if docker-compose exec php php -m | grep -q "pdo_pgsql"; then
    echo "✅ pdo_pgsql extension is already loaded"
    exit 0
fi

echo "⚠️  pdo_pgsql extension not found, installing..."

# Install the extension
docker-compose exec -u root php sh -c "
    apk add --no-cache postgresql-dev && \
    docker-php-ext-install pdo_pgsql && \
    docker-php-ext-enable pdo_pgsql
" || {
    echo "❌ Failed to install pdo_pgsql extension"
    exit 1
}

# Verify installation
if docker-compose exec php php -m | grep -q "pdo_pgsql"; then
    echo "✅ pdo_pgsql extension successfully installed and loaded"
else
    echo "❌ pdo_pgsql extension installation failed"
    exit 1
fi

echo "🎉 PHP pdo_pgsql extension is ready!"