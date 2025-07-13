# Redis Insight Setup Guide

## Problem
"Could not connect to 127.0.0.1:6379, please check the connection details."

## Solution

Redis Insight is running at http://192.168.178.94:5540/, but you need to add the Redis database connection manually.

### Step 1: Access Redis Insight
1. Open http://192.168.178.94:5540/ in your browser
2. You'll see the Redis Insight interface

### Step 2: Add Redis Database

Since Redis Insight is running inside Docker, you cannot use `127.0.0.1` or `localhost` to connect to Redis. You need to use the Docker network hostname.

#### Connection Details:
- **Host**: `redis` (Docker service name) OR `host.docker.internal` (to access host's localhost from container)
- **Port**: `6379`
- **Database Alias**: `Mono Redis` (or any name you prefer)
- **Username**: (leave empty)
- **Password**: (leave empty)

### Step 3: Alternative Connection Options

#### Option A: Use Docker Network (Recommended)
```
Host: redis
Port: 6379
```

#### Option B: Use Host Machine IP
```
Host: 192.168.178.94
Port: 6379
```

#### Option C: Use Docker Host Gateway
```
Host: host.docker.internal
Port: 6379
```

### Step 4: Test Connection
1. Click "Test Connection" button
2. If successful, click "Add Redis Database"
3. You should now see your Redis data

## Docker Network Explanation

The issue occurs because:
- Redis Insight runs inside a Docker container
- `127.0.0.1` inside the container refers to the container itself, not the host
- Redis is running in another container named `redis`
- Both containers are on the same Docker network `mono-network`

## Verification Commands

```bash
# Check Redis is accessible from host
redis-cli -h localhost -p 6379 ping

# Check Redis container is running
docker ps | grep redis

# Check Redis Insight container
docker ps | grep redis-insight

# Get Redis container IP (if needed)
docker inspect mono-redis | grep IPAddress
```

## Quick Fix Script

If you want to pre-configure Redis Insight with the connection, you can use this approach:

```bash
# Connect to Redis Insight container
docker exec -it mono-redis-insight sh

# Inside container, Redis is accessible at 'redis:6379'
redis-cli -h redis -p 6379 ping
```

## Common Issues

1. **"Connection Refused"**: Make sure Redis container is running
2. **"Unknown host"**: Use `redis` as hostname, not `localhost`
3. **"Network unreachable"**: Check Docker network configuration

## Redis Insight Features

Once connected, you can:
- Browse all keys
- Monitor real-time commands
- Analyze memory usage
- Run Redis commands
- View slow queries
- Check connected clients