FROM node:18-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm ci --production

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm install --save-dev typescript @types/node && \
    npm run build && \
    npm uninstall typescript @types/node

# Clean up
RUN npm cache clean --force

# Use non-root user
USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]