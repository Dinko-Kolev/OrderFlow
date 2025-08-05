FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install -g next

# Copy source code
COPY . .

# Build Tailwind CSS
RUN npx tailwindcss build -o styles/tailwind.css

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]