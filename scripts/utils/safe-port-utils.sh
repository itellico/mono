#!/bin/bash

# Safe Port Utilities - Protects Docker port forwarding processes
# Source this file in your scripts: source scripts/utils/safe-port-utils.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Safe kill function that preserves Docker processes
# Usage: safe_kill_port <port> [process_filter]
# Examples:
#   safe_kill_port 3000          # Kills all non-Docker processes on port 3000
#   safe_kill_port 3001 node     # Kills only Node.js processes on port 3001
safe_kill_port() {
    local port=$1
    local process_filter=${2:-""}  # Optional: only kill specific process types
    
    if ! lsof -ti:$port > /dev/null 2>&1; then
        return 0  # Port is already free
    fi
    
    # Get all PIDs using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    for pid in $pids; do
        if [ -z "$pid" ]; then
            continue
        fi
        
        # Get process info
        local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        
        # Skip Docker processes
        if [[ "$process_name" == *"com.docker"* ]] || [[ "$process_name" == *"docker"* ]]; then
            echo -e "${BLUE}ℹ Port $port: Docker process preserved${NC}"
            continue
        fi
        
        # If process filter is specified, only kill matching processes
        if [ -n "$process_filter" ] && [[ "$process_name" != *"$process_filter"* ]]; then
            echo -e "${YELLOW}⚠ Port $port: Skipping $process_name (not $process_filter)${NC}"
            continue
        fi
        
        # Kill the process
        if kill -9 $pid 2>/dev/null; then
            echo -e "${GREEN}✓ Port $port: Killed $process_name (PID: $pid)${NC}"
        else
            echo -e "${RED}✗ Port $port: Failed to kill $process_name (PID: $pid)${NC}"
        fi
    done
}

# Kill multiple ports safely
# Usage: safe_kill_ports <port1> <port2> ...
safe_kill_ports() {
    for port in "$@"; do
        safe_kill_port $port
    done
}

# Kill Node.js processes on specific ports
# Usage: kill_node_ports <port1> <port2> ...
kill_node_ports() {
    for port in "$@"; do
        safe_kill_port $port "node"
    done
}

# Check if port is used by Docker
# Usage: is_docker_port <port>
# Returns: 0 if Docker is using the port, 1 otherwise
is_docker_port() {
    local port=$1
    
    if ! lsof -ti:$port > /dev/null 2>&1; then
        return 1  # Port is free
    fi
    
    local pid=$(lsof -ti:$port | head -1)
    local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "")
    
    if [[ "$process_name" == *"com.docker"* ]] || [[ "$process_name" == *"docker"* ]]; then
        return 0  # Docker is using the port
    else
        return 1  # Non-Docker process
    fi
}

# Check port status with details
# Usage: check_port_status <port>
check_port_status() {
    local port=$1
    
    if ! lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Port $port is free${NC}"
        return 0
    fi
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    echo -e "${YELLOW}Port $port is in use by:${NC}"
    
    for pid in $pids; do
        local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        local process_cmd=$(ps -p $pid -o args= 2>/dev/null | head -c 80 || echo "")
        
        if [[ "$process_name" == *"com.docker"* ]] || [[ "$process_name" == *"docker"* ]]; then
            echo -e "  ${BLUE}🐳 Docker: $process_name (PID: $pid)${NC}"
        else
            echo -e "  ${YELLOW}📦 $process_name (PID: $pid)${NC}"
            echo -e "     ${process_cmd}${NC}"
        fi
    done
}

# Restart Docker Desktop on macOS
# Usage: restart_docker_desktop
restart_docker_desktop() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${RED}This function only works on macOS${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Restarting Docker Desktop...${NC}"
    osascript -e 'quit app "Docker"' 2>/dev/null || true
    sleep 5
    open -a Docker
    
    echo -e "${YELLOW}Waiting for Docker to start (30 seconds)...${NC}"
    local count=0
    while ! docker info >/dev/null 2>&1 && [ $count -lt 30 ]; do
        sleep 1
        ((count++))
    done
    
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker Desktop restarted successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Docker Desktop failed to start${NC}"
        return 1
    fi
}

# Export functions for use in sourcing scripts
export -f safe_kill_port
export -f safe_kill_ports
export -f kill_node_ports
export -f is_docker_port
export -f check_port_status
export -f restart_docker_desktop