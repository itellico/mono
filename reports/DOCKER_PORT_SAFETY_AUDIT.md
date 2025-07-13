# Docker Port Safety Audit Report

## Issue Summary
Docker Desktop on macOS uses proxy processes (`com.docker.backend`, `com.docker.proxy`) to forward ports from containers to localhost. When these processes are killed by aggressive port-clearing commands, containers remain running but become inaccessible, showing errors like "side-cant-privilege".

## Changes Made

### 1. Documentation Updates
- **CLAUDE.md**: Added comprehensive Docker port protection section with warnings and safe commands

### 2. Scripts Updated
All scripts now use Docker-safe port clearing that checks process names before killing:

1. **scripts/setup-services.sh** ✅
   - Lines 70-85: Added Docker process detection before killing

2. **scripts/docker-setup.sh** ✅
   - Lines 58-73: Added Docker process detection before killing

3. **scripts/start-complete-monitoring.sh** ✅
   - Lines 23-31: Changed to only kill Node.js processes

4. **scripts/fix-docker-services.sh** ✅
   - Line 71: Updated to use Docker-safe killing

5. **scripts/start-dev.sh** ✅
   - Already had Docker-safe implementation
   
6. **scripts/start-api.sh** ✅
   - New script for starting API server separately
   - Includes Docker-safe port clearing

7. **scripts/start-frontend.sh** ✅
   - New script for starting frontend separately
   - Includes Docker-safe port clearing

### 3. New Utility Created
**scripts/utils/safe-port-utils.sh** - Provides reusable functions:
- `safe_kill_port`: Kills processes on a port while preserving Docker
- `safe_kill_ports`: Kill multiple ports safely
- `kill_node_ports`: Kill only Node.js processes
- `is_docker_port`: Check if Docker is using a port
- `check_port_status`: Show detailed port usage
- `restart_docker_desktop`: Restart Docker Desktop on macOS

## Safe Port Killing Pattern
```bash
# OLD (DANGEROUS):
lsof -ti:$port | xargs kill -9

# NEW (DOCKER-SAFE):
lsof -ti:$port | xargs -I {} sh -c 'ps -p {} -o comm= | grep -qv "com.docker" && kill -9 {} || true'
```

## Usage Examples

### Using the utility functions:
```bash
# Source the utilities
source scripts/utils/safe-port-utils.sh

# Check port status
check_port_status 6379

# Kill only Node.js on specific ports
kill_node_ports 3000 3001

# Kill all non-Docker processes on a port
safe_kill_port 8080

# Check if Docker is using a port
if is_docker_port 6379; then
    echo "Docker is using port 6379"
fi
```

### If Docker ports become inaccessible:
```bash
# Quick fix - restart Docker Desktop
osascript -e 'quit app "Docker"' && sleep 5 && open -a Docker

# Or use the utility function
source scripts/utils/safe-port-utils.sh
restart_docker_desktop
```

## Recommendations
1. Always use the safe port utilities when writing new scripts
2. Never use bare `kill -9` commands on ports used by Docker
3. Test scripts with `check_port_status` before killing processes
4. Consider adding the utility source to your shell profile for easy access

## Affected Docker Ports
- 6379 (Redis)
- 1025, 8025 (Mailpit)
- 5678 (N8N)
- 7233, 8080 (Temporal)
- 5540 (RedisInsight)
- 9090 (Prometheus)
- 5005 (Grafana)
- 9100 (Node Exporter)
- 8081 (cAdvisor)
- 5432 (PostgreSQL - when using Docker)