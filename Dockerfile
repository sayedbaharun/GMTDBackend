FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy all source files
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 8080

# Start app
CMD ["node", "dist/index.js"]