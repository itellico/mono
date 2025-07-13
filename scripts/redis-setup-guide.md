# Redis Database Configuration Guide

## 🔧 Adding Redis Database to RedisInsight

### Step 1: Open RedisInsight
1. Navigate to: http://localhost:5540
2. You'll see the RedisInsight welcome screen

### Step 2: Add Database Connection
Click "Add Redis Database" and enter these connection details:

**Connection Details:**
- **Host**: `localhost` (or `127.0.0.1`)
- **Port**: `6379`
- **Database Alias**: `mono-redis` (or any name you prefer)
- **Username**: (leave empty - Redis default has no auth)
- **Password**: (leave empty - Redis default has no auth)

### Step 3: Test Connection
- Click "Test Connection" to verify
- If successful, click "Add Redis Database"

## 🐳 Docker Network Alternative (Advanced)

If you want to connect from within the Docker network:

**Connection Details:**
- **Host**: `redis` (Docker service name)
- **Port**: `6379`
- **Database Alias**: `mono-redis-internal`

## 🔑 Redis Database Numbers

Redis supports multiple databases (0-15 by default):
- **Database 0**: Default database
- **Database 1-15**: Additional logical databases

To use different databases:
1. In RedisInsight, after connecting, you can switch databases
2. In CLI: `redis-cli -h localhost -p 6379 -n 1` (for database 1)

## 🛠️ Quick CLI Commands

```bash
# Connect to default database (0)
redis-cli -h localhost -p 6379

# Connect to specific database number
redis-cli -h localhost -p 6379 -n 1

# Test connection
redis-cli -h localhost -p 6379 ping

# Get database info
redis-cli -h localhost -p 6379 info

# List all keys
redis-cli -h localhost -p 6379 keys '*'

# Switch database in CLI
SELECT 1  # Switch to database 1
```

## 🔒 Security Notes

- **Current Setup**: No authentication (development only)
- **Production**: Always use authentication and TLS
- **Network**: Currently accessible only on localhost

## 🚀 Ready to Use!

Once connected, you can:
- Browse keys and values
- Execute Redis commands
- Monitor performance
- Analyze memory usage
- View real-time metrics