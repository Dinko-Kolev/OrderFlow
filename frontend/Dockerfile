# Multi-stage build for Next.js optimization
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
ENV NEXT_PUBLIC_API_URL=https://backend-xyz.dinko-kolev.dev
# Development stage
FROM base AS development
RUN npm install && npm cache clean --force
COPY . .

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

# Add wait script for health checks
RUN echo '#!/bin/bash\nwhile ! curl -f http://localhost:3000 2>/dev/null; do sleep 1; done' > /wait-for-health.sh && chmod +x /wait-for-health.sh

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
ENV PORT=3000

EXPOSE 3000

# Add health check
RUN echo '#!/bin/bash\nwhile ! curl -f http://localhost:3000 2>/dev/null; do sleep 1; done' > /wait-for-health.sh && chmod +x /wait-for-health.sh

CMD ["node", "server.js"]

# Default to development for docker-compose
FROM development
