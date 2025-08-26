# Multi-stage build for better optimization
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    tzdata

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
ENV PORT=3001
EXPOSE 3001

# Add health check endpoint creation script
RUN echo '#!/bin/bash\nwhile ! curl -f http://localhost:3001/health 2>/dev/null; do sleep 1; done' > /wait-for-health.sh && chmod +x /wait-for-health.sh

CMD ["npm", "run", "dev"]

# Production stage  
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Add health check
RUN echo '#!/bin/bash\nwhile ! curl -f http://localhost:3001/health 2>/dev/null; do sleep 1; done' > /wait-for-health.sh && chmod +x /wait-for-health.sh

CMD ["npm", "start"]

# Default to development stage
FROM development