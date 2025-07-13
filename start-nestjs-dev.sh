#!/bin/bash

# NestJS Development Environment Startup Script

set -e

echo "🚀 Starting NestJS Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create required directories
print_status "Creating required directories..."
mkdir -p docker-data/{databases/postgres/data,cache/redis,rabbitmq,monitoring/{prometheus,grafana/data}}

# Check if .env file exists for NestJS
if [ ! -f "apps/api-nest/.env" ]; then
    print_warning ".env file not found for NestJS. Creating from .env.example..."
    if [ -f "apps/api-nest/.env.example" ]; then
        cp apps/api-nest/.env.example apps/api-nest/.env
        print_success "Created .env file. Please review and update the configuration."
    else
        print_warning ".env.example not found. Creating basic .env file..."
        cat > apps/api-nest/.env << 'EOF'
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://developer:developer@localhost:5432/mono
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://developer:developer@localhost:5672
JWT_SECRET=dev-jwt-secret-for-development-only
COOKIE_SECRET=dev-cookie-secret-for-development-only
LOG_LEVEL=debug
METRICS_ENABLED=true
EOF
        print_success "Created basic .env file"
    fi
fi

# Kill any existing ports that might conflict (safely)
print_status "Checking for conflicting ports..."
if command -v lsof &> /dev/null; then
    # Only kill Node.js processes, not Docker
    pkill -f "node.*3001" 2>/dev/null || true
    print_success "Cleared any conflicting Node.js processes"
fi

# Start services
print_status "Starting Docker services..."
docker-compose -f docker-compose.yml -f docker-compose.nestjs.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."

# Wait for PostgreSQL
print_status "Waiting for PostgreSQL..."
timeout 60s bash -c 'until docker-compose exec -T postgres pg_isready -U developer; do sleep 1; done' || {
    print_error "PostgreSQL failed to start"
    exit 1
}

# Wait for Redis
print_status "Waiting for Redis..."
timeout 30s bash -c 'until docker-compose exec -T redis redis-cli ping; do sleep 1; done' || {
    print_error "Redis failed to start"
    exit 1
}

# Wait for RabbitMQ
print_status "Waiting for RabbitMQ..."
timeout 60s bash -c 'until docker-compose exec -T rabbitmq rabbitmq-diagnostics ping; do sleep 2; done' || {
    print_error "RabbitMQ failed to start"
    exit 1
}

# Run database migrations
print_status "Running Prisma migrations..."
cd apps/api-nest
if [ -f "package.json" ]; then
    if command -v pnpm &> /dev/null; then
        pnpm prisma migrate dev --name init || print_warning "Migration may have already been applied"
        pnpm prisma generate
    else
        print_warning "pnpm not found. Please run 'pnpm prisma migrate dev' manually in apps/api-nest/"
    fi
fi
cd ../..

# Wait for NestJS API to be ready
print_status "Waiting for NestJS API to be ready..."
timeout 120s bash -c 'until curl -f http://localhost:3001/api/v1/public/health 2>/dev/null; do sleep 2; done' || {
    print_warning "NestJS API health check failed, but continuing..."
}

# Display status
print_success "🎉 NestJS Development Environment is ready!"
echo ""
echo "📋 Service URLs:"
echo "  🚀 NestJS API:        http://localhost:3001"
echo "  📚 API Documentation: http://localhost:3001/docs"
echo "  📈 Metrics:           http://localhost:3001/metrics"
echo "  🏥 Health Check:      http://localhost:3001/api/v1/public/health"
echo "  🐰 RabbitMQ UI:       http://localhost:15672 (admin/admin)"
echo "  📊 Prometheus:        http://localhost:9090"
echo "  📈 Grafana:           http://localhost:5005 (admin/admin123)"
echo ""
echo "📂 Useful Commands:"
echo "  View logs:    docker-compose logs -f api-nest"
echo "  Restart API:  docker-compose restart api-nest"
echo "  Stop all:     docker-compose -f docker-compose.yml -f docker-compose.nestjs.yml down"
echo ""
echo "🧪 Testing:"
echo "  curl http://localhost:3001/api/v1/public/health"
echo "  curl http://localhost:3001/metrics"
echo ""
print_success "Happy coding! 🚀"