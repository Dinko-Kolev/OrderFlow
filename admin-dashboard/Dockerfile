# Multi-stage build for admin dashboard
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS deps
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm install && npm cache clean --force
COPY . .

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
EXPOSE 3002

# Add health check script
RUN echo '#!/bin/bash\nwhile ! curl -f http://localhost:3002 2>/dev/null; do sleep 1; done' > /wait-for-health.sh && chmod +x /wait-for-health.sh

CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN npm install && npm run build && npm cache clean --force

# Production stage
FROM base AS production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
EXPOSE 3002

# Add health check
RUN echo '#!/bin/bash\nwhile ! curl -f http://localhost:3002 2>/dev/null; do sleep 1; done' > /wait-for-health.sh && chmod +x /wait-for-health.sh

CMD ["node", "server.js"]

# Default to development
FROM development
