# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage — nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
# Security: non-root nginx
RUN addgroup -S sentinela && adduser -S sentinela -G sentinela

# Security hardened nginx config
COPY --chown=sentinela:sentinela nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder --chown=sentinela:sentinela /app/dist /usr/share/nginx/html

# Security: nginx can run on port 8080 without root
RUN sed -i 's/listen       80/listen       8080/' /etc/nginx/conf.d/default.conf || true \
    && chown -R sentinela:sentinela /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown sentinela:sentinela /var/run/nginx.pid

USER sentinela
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q -O- http://localhost:8080/ | head -1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
