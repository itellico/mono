# Kanboard for Mono Project

Kanboard is configured as the task management and roadmap tool for the Mono project.

## Access URLs

### Available URLs:
- **Kanboard**: http://localhost:4040/kanboard/
- **Click-dummy**: http://localhost:4040/ (root)
- **Click-dummy (explicit)**: http://localhost:4040/click-dummy/

### Alternative domain-based access:
- **Kanboard**: http://kanboard.localhost:4040/

Note: For domain-based access to work, add this to your `/etc/hosts` file:
```
127.0.0.1 kanboard.localhost
```

## Default Credentials

When you first access Kanboard, use:
- **Username**: admin
- **Password**: admin

**Important**: Change these credentials immediately after first login!

## Database

Kanboard is configured to use PostgreSQL:
- **Database**: kanboard
- **Host**: postgres
- **User**: developer
- **Password**: developer

## Email

Configured to use Mailpit for email testing:
- All emails sent by Kanboard can be viewed at: http://localhost:4025

## API Access

Kanboard provides a JSON-RPC API. To enable API access:
1. Log in as admin
2. Go to Settings → API
3. Generate API tokens for users/applications

API endpoint: http://localhost:4040/kanboard/jsonrpc.php

## Configuration

The main configuration file is located at:
```
/php/kanboard/config.php
```

## Data Storage

All Kanboard data (attachments, etc.) is stored in:
```
/php/kanboard/data/
```

## Restart Services

After making any configuration changes:
```bash
docker-compose restart php nginx
```

## Creating a New Database

If you need to recreate the Kanboard database:
```bash
docker-compose exec postgres psql -U developer -c "DROP DATABASE IF EXISTS kanboard;"
docker-compose exec postgres psql -U developer -c "CREATE DATABASE kanboard;"
```

Then access Kanboard in your browser to run the initial setup.