#!/bin/bash

# Redis Insight initialization script
# This will be executed when the container starts

echo "Initializing Redis Insight with default connections..."

# Wait for Redis Insight to be ready
sleep 10

# Try to add connections via API (this may need to be done manually through UI)
echo "Redis Insight is ready at http://localhost:5540"
echo "Please manually add the following connections:"
echo "1. Name: mono, Host: mono-redis, Port: 6379"
echo "2. Name: mono-test, Host: mono-test-redis, Port: 6379"