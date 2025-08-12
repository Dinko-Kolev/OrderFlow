FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optional: build step (keeping dev by default)
# RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]