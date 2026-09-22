# ============================================================
# Stage 1: Build React/Vite frontend
# ============================================================
FROM node:22.23.2-alpine3.24 AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ============================================================
# Stage 2: Build production server dependencies
# ============================================================
FROM node:22.23.2-alpine3.24 AS server-builder

WORKDIR /app/server

RUN apk add --no-cache --virtual .build-deps \
        python3 \
        make \
        g++

COPY server/package.json server/package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force \
    && apk del .build-deps


# ============================================================
# Stage 3: Minimal production runtime
# ============================================================
FROM alpine:3.24.2 AS runner

WORKDIR /app

# Runtime libraries only.
RUN apk add --no-cache \
        libstdc++ \
        libgcc \
        su-exec

# Copy only the Node.js runtime.
# npm, npx, corepack and build tooling are NOT included.
COPY --from=server-builder /usr/local/bin/node /usr/local/bin/node

# Create unprivileged application user.
RUN addgroup -g 1000 -S node \
    && adduser -u 1000 -S -G node node

# Copy production server dependencies.
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy application server.
COPY server/ ./server/

# Copy compiled frontend.
COPY --from=frontend-builder /app/dist ./dist


# ============================================================
# Create container entrypoint
# ============================================================
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    '' \
    '# FocusFlow container entrypoint.' \
    '#' \
    '# The container starts as root only so it can fix ownership of the SQLite' \
    '# data directory (named volumes created by older root-run containers are' \
    '# root-owned). It then re-execs the server as the unprivileged `node` user,' \
    '# so the application itself never runs as root.' \
    '#' \
    '# If the container is started with an explicit non-root user (e.g.' \
    '# `user: "node"` in compose), the script is skipped entirely.' \
    '' \
    'if [ "$(id -u)" = "0" ]; then' \
    '  mkdir -p /data' \
    '  chown -R node:node /data' \
    '  exec su-exec node:node "$@"' \
    'fi' \
    '' \
    'exec "$@"' \
    > /entrypoint.sh \
    && chmod 0755 /entrypoint.sh


# ============================================================
# Persistent SQLite database directory
# ============================================================
RUN mkdir -p /data \
    && chown node:node /data


# ============================================================
# Runtime configuration
# ============================================================
ENV PORT=80 \
    HOST=0.0.0.0 \
    DATABASE_PATH=/data/focusflow.db \
    NODE_ENV=production

EXPOSE 80


# ============================================================
# Health check
# Uses Node's built-in fetch() — no wget/curl required.
# ============================================================
HEALTHCHECK \
    --interval=30s \
    --timeout=3s \
    --start-period=5s \
    --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:80/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"


# ============================================================
# Start application
# ============================================================
ENTRYPOINT ["/entrypoint.sh"]

CMD ["node", "server/server.js"]