# ===================================================
# Stage 1: Build the React / Vite production bundle
# ===================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies deterministically via package-lock.json
RUN npm ci

# Copy project source files
COPY . .

# Build production static bundle (generates /app/dist)
RUN npm run build

# ===================================================
# Stage 2: Production runtime with Node.js & SQLite
# ===================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install C++ runtime required by better-sqlite3 native addon
RUN apk add --no-cache libstdc++

# Temporarily install build tools to compile better-sqlite3 if needed
RUN apk add --no-cache --virtual .build-deps python3 make g++

# Copy server package manifests
COPY server/package.json server/package-lock.json ./server/

# Install production server dependencies
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Remove compilation build tools, keeping libstdc++ runtime
RUN apk del .build-deps

# Copy server application source code
COPY server/ ./server/

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist ./dist

# Create persistent storage mount directory for SQLite database
RUN mkdir -p /data

# Expose HTTP port
EXPOSE 80

# Configure production environment variables
ENV PORT=80
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/data/focusflow.db
ENV NODE_ENV=production

# Health check to ensure server and database are healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/api/health || exit 1

# Start FocusFlow production server
CMD ["node", "server/server.js"]
