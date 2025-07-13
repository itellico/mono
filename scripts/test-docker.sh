#!/bin/bash
# Helper script to manage Docker test environment with correct project name

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure Docker is in PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[TEST ENV]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main command handling
case "$1" in
    up)
        print_status "Starting test environment (mono-test)..."
        docker-compose -p mono-test -f docker-compose.test.yml up -d
        ;;
    down)
        print_status "Stopping test environment (mono-test)..."
        docker-compose -p mono-test -f docker-compose.test.yml down
        ;;
    restart)
        print_status "Restarting test environment (mono-test)..."
        docker-compose -p mono-test -f docker-compose.test.yml down
        docker-compose -p mono-test -f docker-compose.test.yml up -d
        ;;
    logs)
        print_status "Showing test environment logs..."
        docker-compose -p mono-test -f docker-compose.test.yml logs -f
        ;;
    ps)
        print_status "Test environment containers:"
        docker-compose -p mono-test -f docker-compose.test.yml ps
        ;;
    clean)
        print_status "Cleaning test environment (removing volumes)..."
        docker-compose -p mono-test -f docker-compose.test.yml down -v
        ;;
    *)
        echo "Usage: $0 {up|down|restart|logs|ps|clean}"
        echo ""
        echo "Commands:"
        echo "  up       - Start test environment"
        echo "  down     - Stop test environment"
        echo "  restart  - Restart test environment"
        echo "  logs     - Show test environment logs"
        echo "  ps       - List test environment containers"
        echo "  clean    - Stop and remove test volumes"
        echo ""
        echo "Test environment uses project name: mono-test"
        echo "Test ports: PostgreSQL (5433), Redis (6380), Mailpit (4026)"
        exit 1
        ;;
esac