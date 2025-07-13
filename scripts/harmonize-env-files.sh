#!/bin/bash
# Script to harmonize all .env files in the mono project

set -e

echo "🔧 Harmonizing Environment Files for Mono Project"
echo "================================================"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the mono directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}Error: This script must be run from the mono project root directory${NC}"
    exit 1
fi

# Step 1: Backup existing env files
echo -e "\n${YELLOW}Step 1: Backing up existing environment files...${NC}"
backup_dir="backup/env-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# List of files to backup
env_files=(
    ".env"
    ".env.local"
    ".env.docker"
    ".env.services"
    ".env.kanboard"
    ".env.kanboard.example"
    ".env.example"
    ".env.production.example"
    "apps/api/.env"
    "apps/api/.env.test"
    "apps/api/.env.example"
)

for file in "${env_files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$backup_dir/"
        echo -e "  ${GREEN}✓${NC} Backed up $file"
    fi
done

# Step 2: Create the main consolidated .env file
echo -e "\n${YELLOW}Step 2: Creating consolidated .env file...${NC}"

cat > .env << 'EOF'
# Mono Platform - Main Environment Configuration
# ==============================================
# This is the primary environment file for the mono platform.
# Environment-specific overrides should go in:
# - .env.local (git-ignored, for local development)
# - .env.docker (for Docker Compose)
# - .env.production (for production deployment)

# Core Database Configuration
DATABASE_URL="postgresql://developer:developer@localhost:5432/mono"
DATABASE_URL_TEST="postgresql://developer:developer@localhost:5433/mono_test"

# Redis Configuration
REDIS_URL="redis://localhost:6379/0"
REDIS_URL_TEST="redis://localhost:6380/0"

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
JWT_SECRET=your-jwt-secret-key-here
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem
AUTH_SECRET="development-secret-key-only-for-dev"
REFRESH_TOKEN_SECRET=your-refresh-token-secret
COOKIE_SECRET=your-cookie-secret-here

# Frontend Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Kanboard Configuration
KANBOARD_USERNAME=jsonrpc
KANBOARD_PASSWORD=ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad
KANBOARD_API_TOKEN=ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad
KANBOARD_API_ENDPOINT=http://localhost:4041/jsonrpc.php

# N8N Configuration
N8N_BASE_URL=http://localhost:5678
N8N_DOCS_WEBHOOK_URL=http://localhost:5678/webhook/docs-approval
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=admin123

# Mattermost Configuration
MATTERMOST_WEBHOOK_URL=https://mm.itellico.com/hooks/tcpsebpfbbdqdyrq4tiancupyc
MATTERMOST_DOCS_CHANNEL=mono-docs

# Email Configuration (Mailpit for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@mono-platform.local
SMTP_SECURE=false

# Monitoring Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
PROMETHEUS_RETENTION=15d

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# RabbitMQ Configuration
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin123
RABBITMQ_MANAGEMENT_PORT=15672

# Documentation Site
DOCS_SITE_URL=http://localhost:3005

# Development Flags
NODE_ENV=development
LOG_LEVEL=debug
EOF

echo -e "  ${GREEN}✓${NC} Created consolidated .env file"

# Step 3: Create .env.docker for Docker overrides
echo -e "\n${YELLOW}Step 3: Creating .env.docker for Docker overrides...${NC}"

cat > .env.docker << 'EOF'
# Docker-specific Environment Overrides
# =====================================
# These values override the base .env when running with Docker Compose

# Database - Docker network addresses
DATABASE_URL="postgresql://developer:developer@postgres:5432/mono"
DATABASE_URL_TEST="postgresql://developer:developer@test-postgres:5433/mono_test"

# Redis - Docker network addresses
REDIS_URL="redis://redis:6379/0"
REDIS_URL_TEST="redis://test-redis:6380/0"

# API URLs for container-to-container communication
NEXT_PUBLIC_API_URL=http://api:3001
API_URL_INTERNAL=http://api:3001

# Kanboard - Docker network address
KANBOARD_API_ENDPOINT=http://nginx/kanboard/jsonrpc.php
KANBOARD_API_ENDPOINT_INTERNAL=http://nginx/kanboard/jsonrpc.php

# N8N - Docker network address
N8N_BASE_URL=http://n8n:5678
N8N_DOCS_WEBHOOK_URL=http://n8n:5678/webhook/docs-approval

# Email - Docker Mailpit service
SMTP_HOST=mailpit
SMTP_PORT=1025

# Temporal - Docker network address
TEMPORAL_ADDRESS=temporal:7233

# RabbitMQ - Docker network address
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
EOF

echo -e "  ${GREEN}✓${NC} Created .env.docker file"

# Step 4: Create .env.example
echo -e "\n${YELLOW}Step 4: Creating .env.example...${NC}"

cat > .env.example << 'EOF'
# Mono Platform - Environment Configuration Example
# ================================================
# Copy this file to .env and update with your values

# Core Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
DATABASE_URL_TEST="postgresql://username:password@localhost:5433/test_database"

# Redis Configuration
REDIS_URL="redis://localhost:6379/0"
REDIS_URL_TEST="redis://localhost:6380/0"

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
JWT_SECRET=generate-a-secure-random-string-here
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem
AUTH_SECRET=generate-another-secure-random-string
REFRESH_TOKEN_SECRET=generate-refresh-token-secret
COOKIE_SECRET=generate-cookie-secret

# Frontend Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Kanboard Configuration
KANBOARD_USERNAME=jsonrpc
KANBOARD_PASSWORD=your-kanboard-api-token
KANBOARD_API_TOKEN=your-kanboard-api-token
KANBOARD_API_ENDPOINT=http://localhost:4041/jsonrpc.php

# N8N Configuration
N8N_BASE_URL=http://localhost:5678
N8N_DOCS_WEBHOOK_URL=http://localhost:5678/webhook/docs-approval
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=change-this-password

# Mattermost Configuration
MATTERMOST_WEBHOOK_URL=https://your-mattermost-instance/hooks/webhook-id
MATTERMOST_DOCS_CHANNEL=channel-name

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@yourdomain.com
SMTP_SECURE=false

# Monitoring Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=change-this-password
PROMETHEUS_RETENTION=15d

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# RabbitMQ Configuration
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=change-this-password
RABBITMQ_MANAGEMENT_PORT=15672

# Documentation Site
DOCS_SITE_URL=http://localhost:3005

# Development Flags
NODE_ENV=development
LOG_LEVEL=debug
EOF

echo -e "  ${GREEN}✓${NC} Created .env.example file"

# Step 5: Update .gitignore to ensure .env.local is ignored
echo -e "\n${YELLOW}Step 5: Updating .gitignore...${NC}"

if ! grep -q "^\.env\.local$" .gitignore 2>/dev/null; then
    echo -e "\n# Local environment overrides\n.env.local" >> .gitignore
    echo -e "  ${GREEN}✓${NC} Added .env.local to .gitignore"
else
    echo -e "  ${GREEN}✓${NC} .env.local already in .gitignore"
fi

# Step 6: Create migration notes
echo -e "\n${YELLOW}Step 6: Creating migration notes...${NC}"

cat > "$backup_dir/MIGRATION_NOTES.md" << 'EOF'
# Environment Files Migration Notes

## What Changed

1. **Consolidated Configuration**: All environment variables are now in the main `.env` file
2. **Docker Overrides**: Docker-specific values are in `.env.docker`
3. **Local Overrides**: Use `.env.local` for personal development overrides (git-ignored)
4. **Removed Files**:
   - `.env.kanboard` - Merged into main `.env`
   - `.env.services` - Merged into `.env.docker`
   - `apps/api/.env` - API now uses root `.env`

## Migration Checklist

- [ ] Update your MCP server configuration to use the new environment variables
- [ ] Update any scripts that referenced the old `.env.kanboard` file
- [ ] Copy any personal overrides to `.env.local`
- [ ] Test all services to ensure they're working correctly
- [ ] Remove old environment files after confirming everything works

## MCP Configuration

If you're using Claude Desktop, update your MCP configuration to include:

```json
{
  "env": {
    "KANBOARD_USERNAME": "jsonrpc",
    "KANBOARD_PASSWORD": "your-api-token",
    "KANBOARD_API_ENDPOINT": "http://localhost:4041/jsonrpc.php"
  }
}
```
EOF

echo -e "  ${GREEN}✓${NC} Created migration notes"

# Step 7: Summary
echo -e "\n${GREEN}=== Environment Harmonization Complete ===${NC}"
echo -e "\nBackup created in: ${YELLOW}$backup_dir${NC}"
echo -e "\nNext steps:"
echo -e "1. Review the new ${YELLOW}.env${NC} file and update any values as needed"
echo -e "2. Copy any personal overrides to ${YELLOW}.env.local${NC}"
echo -e "3. Restart your services to use the new configuration"
echo -e "4. Test that everything is working correctly"
echo -e "5. Once confirmed, you can remove the old environment files"
echo -e "\nFor more details, see: ${YELLOW}$backup_dir/MIGRATION_NOTES.md${NC}"