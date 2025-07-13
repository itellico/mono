#!/bin/bash

# Docker Build Script for Mono Platform
# Builds both frontend and API containers with proper tagging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY=${REGISTRY:-"mono-platform"}
VERSION=${VERSION:-"latest"}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${BLUE}🏗️  Building Mono Platform Docker Images${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Git Commit: ${GIT_COMMIT}${NC}"
echo -e "${YELLOW}Build Date: ${BUILD_DATE}${NC}"
echo ""

# Build Frontend
echo -e "${BLUE}📦 Building Frontend (Next.js)...${NC}"
docker build \
  --target runner \
  --tag "${REGISTRY}/frontend:${VERSION}" \
  --tag "${REGISTRY}/frontend:${GIT_COMMIT}" \
  --label "version=${VERSION}" \
  --label "git-commit=${GIT_COMMIT}" \
  --label "build-date=${BUILD_DATE}" \
  --label "component=frontend" \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend build completed successfully${NC}"
else
  echo -e "${RED}❌ Frontend build failed${NC}"
  exit 1
fi

echo ""

# Build API
echo -e "${BLUE}🚀 Building API (Fastify)...${NC}"
docker build \
  --target runner \
  --tag "${REGISTRY}/api:${VERSION}" \
  --tag "${REGISTRY}/api:${GIT_COMMIT}" \
  --label "version=${VERSION}" \
  --label "git-commit=${GIT_COMMIT}" \
  --label "build-date=${BUILD_DATE}" \
  --label "component=api" \
  ./apps/api

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ API build completed successfully${NC}"
else
  echo -e "${RED}❌ API build failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All builds completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Built Images:${NC}"
echo -e "  • ${REGISTRY}/frontend:${VERSION}"
echo -e "  • ${REGISTRY}/frontend:${GIT_COMMIT}"
echo -e "  • ${REGISTRY}/api:${VERSION}"
echo -e "  • ${REGISTRY}/api:${GIT_COMMIT}"
echo ""

# Show image sizes
echo -e "${BLUE}📊 Image Sizes:${NC}"
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" \
  "${REGISTRY}/frontend:${VERSION}" \
  "${REGISTRY}/api:${VERSION}"

echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "  • Test images: docker-compose -f docker-compose.prod.yml up"
echo -e "  • Push to registry: docker push ${REGISTRY}/frontend:${VERSION}"
echo -e "  • Deploy to production: ./scripts/docker-deploy.sh"