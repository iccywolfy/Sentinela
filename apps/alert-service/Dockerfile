# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
# Copy manifests first for cache efficiency
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
# Security: run as non-root user (SEC-10)
RUN addgroup -S sentinela && adduser -S sentinela -G sentinela
WORKDIR /app

# Only production deps
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Security: least-privilege ownership
RUN chown -R sentinela:sentinela /app
USER sentinela

# Security: drop all capabilities, run readonly rootfs compatible
ENV NODE_ENV=production
EXPOSE 3003

# Disable Node.js debug flag exploitation
CMD ["node", "--max-old-space-size=512", "dist/main"]
