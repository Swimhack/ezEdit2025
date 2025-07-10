# EzEdit.co Production Dockerfile
# Multi-stage build for optimized production deployment

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ezedit -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=ezedit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ezedit:nodejs /app/package*.json ./
COPY --chown=ezedit:nodejs . .

# Create required directories
RUN mkdir -p logs temp uploads && \
    chown -R ezedit:nodejs logs temp uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Switch to non-root user
USER ezedit

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "netlify/functions/server.js"]