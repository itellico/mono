# Docker Services Development Guide

itellico Mono uses a comprehensive Docker infrastructure for development that provides all necessary services including caching, email testing, workflow automation, monitoring, and more.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- PostgreSQL running locally (localhost:5432)
- Node.js and npm installed

### Start All Services
```bash
# Option 1: Use setup script (recommended)
./scripts/setup-services.sh

# Option 2: Manual start
docker-compose -f docker-compose.services.yml up -d
```

## 📋 Available Services

| Service | Port | URL | Credentials | Purpose |
|---------|------|-----|-------------|---------|
| **Redis Cache** | 6379 | Binary protocol | - | Application caching |
| **RedisInsight GUI** | 5540 | http://localhost:5540 | Use host: `mono-redis` | Redis management |
| **Mailpit Email** | 1025/8025 | http://localhost:8025 | - | Email testing |
| **N8N Workflows** | 5678 | http://localhost:5678 | admin/admin123 | Workflow automation |
| **Temporal Server** | 7233 | gRPC protocol | - | Workflow orchestration |
| **Temporal Web UI** | 8080 | http://localhost:8080 | - | Temporal management |
| **Grafana Dashboard** | 5005 | http://localhost:5005 | admin/admin123 | Monitoring dashboards |
| **Prometheus** | 9090 | http://localhost:9090 | - | Metrics collection |
| **Node Exporter** | 9100 | http://localhost:9100 | - | System metrics |
| **cAdvisor** | 8081 | http://localhost:8081 | - | Container metrics |

## 🔧 Service Configuration

### Email (Mailpit)
All development emails are captured by Mailpit instead of being sent externally.

**Environment Variables:**
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@mono-platform.local
SMTP_SECURE=false
```

**Testing Email:**
1. Send emails from your application
2. View them at http://localhost:8025
3. No authentication required

### Redis Cache
Redis is used for application caching and session storage.

**Environment Variables:**
```bash
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_URL=redis://localhost:6379/0
```

**Viewing Redis Data:**
1. Open RedisInsight: http://localhost:5540
2. Add database connection:
   - Host: `mono-redis` (container name)
   - Port: `6379`
   - No authentication required

### N8N Workflow Automation
Used for creating automated workflows and integrations.

**Environment Variables:**
```bash
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=
N8N_ENCRYPTION_KEY=mono-platform-n8n-key
```

**Access:**
- URL: http://localhost:5678
- Username: `admin`
- Password: `admin123`

### Temporal Workflow Engine
Handles complex workflow orchestration and scheduling.

**Environment Variables:**
```bash
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
```

**Access:**
- Server: gRPC on localhost:7233
- Web UI: http://localhost:8080

### Monitoring Stack

#### Grafana Dashboards
**Environment Variables:**
```bash
GRAFANA_URL=http://localhost:5005
```

**Access:**
- URL: http://localhost:5005
- Username: `admin`
- Password: `admin123`

#### Prometheus Metrics
**Environment Variables:**
```bash
PROMETHEUS_URL=http://localhost:9090
```

**Access:**
- URL: http://localhost:9090
- No authentication required

## 🛠️ Development Workflow

### 1. Start Development Environment
```bash
# Start Docker services
./scripts/setup-services.sh

# Start your applications (in separate terminals)
cd apps/api && npm run dev    # API server on :3001
npm run dev                   # Frontend on :3000
```

### 2. Email Testing
```bash
# All emails sent by your application appear in Mailpit
open http://localhost:8025
```

### 3. Cache Monitoring
```bash
# View Redis cache data
open http://localhost:5540
# Add connection: host=mono-redis, port=6379
```

### 4. Performance Monitoring
```bash
# View system metrics and dashboards
open http://localhost:5005  # Grafana (admin/admin123)
open http://localhost:9090  # Prometheus
```

### 5. Workflow Creation
```bash
# Create automated workflows
open http://localhost:5678  # N8N (admin/admin123)
```

## 📁 File Structure

```
/
├── docker-compose.services.yml     # Main Docker configuration
├── scripts/
│   └── setup-services.sh          # Automated setup script
├── docker/
│   ├── grafana/
│   │   ├── dashboards/            # Grafana dashboard configs
│   │   └── datasources/           # Prometheus datasource config
│   ├── prometheus/
│   │   ├── prometheus.yml         # Prometheus configuration
│   │   └── rules/                 # Alerting rules
│   └── n8n/
│       └── workflows/             # N8N workflow storage
├── .env.local                     # Main environment file
├── apps/api/.env                  # API-specific environment
└── .env.services                  # Docker services template
```

## 🔍 Troubleshooting

### Docker Services Won't Start
```bash
# Check Docker Desktop is running
docker version

# Kill conflicting ports
lsof -ti:3000,3001,6379,1025,8025,5678,7233,8080,9090,5005 | xargs kill -9

# Restart services
docker-compose -f docker-compose.services.yml down -v
docker-compose -f docker-compose.services.yml up -d
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connectivity
docker exec mono-redis redis-cli ping

# In RedisInsight, use host: mono-redis (not localhost)
```

### Email Not Appearing in Mailpit
```bash
# Check Mailpit is running
curl http://localhost:8025

# Check SMTP port
nc -z localhost 1025

# Verify environment variables include:
# SMTP_HOST=localhost
# SMTP_PORT=1025
```

### Temporal Issues
```bash
# Check Temporal server health
docker exec mono-temporal tctl --address temporal:7233 cluster health

# Check logs
docker logs mono-temporal
```

## 📊 Health Checks

All services include health checks. Check status:

```bash
# View all container status
docker ps

# Check specific service logs
docker logs mono-redis
docker logs mono-mailpit
docker logs mono-n8n
docker logs mono-temporal
docker logs mono-grafana
docker logs mono-prometheus
```

## 🔄 Service Management

### Start/Stop Individual Services
```bash
# Start specific service
docker-compose -f docker-compose.services.yml up -d redis

# Stop specific service
docker-compose -f docker-compose.services.yml stop redis

# Restart specific service
docker-compose -f docker-compose.services.yml restart redis
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.services.yml logs -f

# Specific service
docker-compose -f docker-compose.services.yml logs -f redis
```

### Clean Reset
```bash
# Stop and remove all containers + volumes
docker-compose -f docker-compose.services.yml down -v

# Start fresh
docker-compose -f docker-compose.services.yml up -d
```

## 🚨 Important Notes

1. **PostgreSQL**: Runs locally (not in Docker) on localhost:5432
2. **Email**: All emails go to Mailpit, never sent externally in development
3. **Redis**: Contains live development cache data
4. **Credentials**: Default development credentials, change for production
5. **Networking**: Services communicate via Docker network `mono-network`
6. **Data Persistence**: Volumes preserve data between restarts

## 🔗 Integration Points

### Application Integration
- **Frontend** (.env.local): Contains all service URLs and credentials
- **API** (apps/api/.env): Contains service connection details
- **Database**: Uses local PostgreSQL, not Docker
- **Cache**: Application uses Redis for caching and sessions
- **Email**: Application sends emails through Mailpit SMTP
- **Monitoring**: Metrics collected from both frontend and API

### Service Communication
- Services communicate using container names (e.g., `mono-redis`)
- External access uses localhost ports
- All services on isolated Docker network `mono-network`
- Health checks ensure service dependencies

## 📈 Performance Monitoring

### Key Metrics Available
- **Application Performance**: API response times, database queries
- **System Resources**: CPU, memory, disk usage
- **Container Stats**: Individual container performance
- **Redis Performance**: Cache hits/misses, memory usage
- **Email Statistics**: Messages sent, delivery status

### Monitoring Workflow
1. **Prometheus** collects metrics from all services
2. **Grafana** visualizes metrics in dashboards
3. **Alerting** configured for critical service failures
4. **Health checks** monitor service availability

This Docker infrastructure provides a complete development environment that mirrors production capabilities while keeping everything local and secure.