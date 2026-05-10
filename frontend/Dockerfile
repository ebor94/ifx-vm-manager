# syntax=docker/dockerfile:1.6
# Imagen del frontend: build con Node, sirve con nginx.
# Multi-stage para que la imagen final NO contenga node_modules ni el toolchain.

# ─── Stage build: bundle de Vite ───────────────────────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Build args para inyectar URLs en build-time (Vite hornea VITE_* en el bundle).
# Por defecto apuntan al backend en el host (docker-compose con publish 3000).
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SOCKET_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Cache de dependencias: copiamos sólo manifests primero.
# package-lock.json del root contiene las deps del workspace frontend.
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=frontend --include-workspace-root --no-audit --no-fund

# Source y build
COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ─── Stage runtime: nginx alpine, sólo los estáticos ───────────────────
FROM nginx:alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost/health || exit 1

# Nginx default CMD ya hace `nginx -g 'daemon off;'`.
