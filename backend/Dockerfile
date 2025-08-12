FROM node:18-alpine AS base
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install dependencies with better caching
COPY package*.json ./
RUN npm ci || npm install

# Copy source code
COPY . .

ENV PORT=3001
EXPOSE 3001

# Healthcheck for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/health || exit 1

# Default to dev for docker-compose; can override with CMD in compose
CMD ["npm", "run", "dev"]