# syntax=docker/dockerfile:1.6
# Imagen del backend (Express + better-sqlite3 + Socket.io).
# Usamos bookworm-slim (glibc) para que better-sqlite3 use sus prebuilds
# oficiales y evite compilación con node-gyp en cada build.

# ─── Stage deps: instala SOLO dependencies ─────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copiamos sólo el manifest para maximizar el cache de Docker:
# si no cambia package.json, npm install se sirve del cache layer.
COPY backend/package.json ./

RUN npm install --omit=dev --no-audit --no-fund \
 && npm cache clean --force

# ─── Stage runtime: imagen final, mínima y no-root ─────────────────────
FROM node:20-bookworm-slim AS runtime

# Usuario no-root para reducir blast radius en caso de RCE.
RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/index.js ./
COPY backend/src ./src

# /app/data se monta como volumen en docker-compose para persistir SQLite.
RUN mkdir -p /app/data && chown -R app:app /app

USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/database.sqlite

EXPOSE 3000

# Healthcheck contra /health (sin curl → no agregamos paquetes extras).
HEALTHCHECK --interval=30s --timeout=3s --start-period=8s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# seed.js es idempotente (INSERT OR IGNORE) — corre al arranque para
# garantizar que admin@ifx.com y cliente@ifx.com existan.
CMD ["sh", "-c", "node src/db/seed.js && node index.js"]
