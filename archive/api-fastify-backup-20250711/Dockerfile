# Multi-stage Dockerfile for Fastify API Server
# Optimized for production with security and performance best practices

# ================================
# Stage 1: Base Dependencies
# ================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ================================
# Stage 2: Build Dependencies
# ================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies including devDependencies
RUN npm ci && npm cache clean --force

# ================================
# Stage 3: Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ================================
# Stage 4: Production Runner
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Set production environment
ENV NODE_ENV production
ENV NODE_OPTIONS "--enable-source-maps --max-old-space-size=512"

# Create non-root user for security
RUN addgroup --system --gid 1001 fastify
RUN adduser --system --uid 1001 fastify

# Copy production dependencies
COPY --from=base --chown=fastify:fastify /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=fastify:fastify /app/dist ./dist

# Copy Prisma files
COPY --from=builder --chown=fastify:fastify /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=fastify:fastify /app/prisma ./prisma

# Copy package.json for version info
COPY --chown=fastify:fastify package.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown fastify:fastify /app/logs

# Switch to non-root user
USER fastify

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/public/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]