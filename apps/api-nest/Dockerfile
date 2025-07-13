# NestJS Production Dockerfile
# Multi-stage build for optimal performance and security

FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init curl
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN corepack enable && \
    pnpm install --frozen-lockfile && \
    pnpm prisma generate

# Build stage
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN corepack enable && \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate && \
    pnpm run build && \
    pnpm install --prod --frozen-lockfile

# Production stage
FROM base AS runner
ENV NODE_ENV=production

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Security: Remove unnecessary packages
RUN apk del npm

# Use non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/public/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]