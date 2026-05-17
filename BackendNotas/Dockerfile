# BackendNotas — NestJS + Prisma (npm workspace: backend-notas)
# Build context: monorepo root (see docker-compose.yml)
#
# Targets:
#   development — hot reload, Prisma migrate on start
#   production  — multi-stage compiled output

# -----------------------------------------------------------------------------
# Base
# -----------------------------------------------------------------------------
FROM node:22-slim AS base
WORKDIR /app
# pg_isready for startup wait script; openssl for Prisma engines
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Dependencies — cache layer: only rebuilds when lockfiles change
# -----------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY BackendNotas/package.json ./BackendNotas/
COPY FrontendNotas/package.json ./FrontendNotas/
# Install all workspaces so hoisted node_modules resolve correctly
RUN npm ci

# -----------------------------------------------------------------------------
# Development — source mounted at runtime; entrypoint runs migrations + watch
# -----------------------------------------------------------------------------
FROM deps AS development
COPY BackendNotas ./BackendNotas
COPY docker/scripts ./docker/scripts
RUN chmod +x /app/docker/scripts/*.sh \
  && npx prisma generate --schema=BackendNotas/prisma/schema.prisma
ENV NODE_ENV=development
EXPOSE 3001
ENTRYPOINT ["sh", "/app/docker/scripts/backend-entrypoint.sh"]
CMD []

# -----------------------------------------------------------------------------
# Production builder
# -----------------------------------------------------------------------------
FROM deps AS builder
COPY BackendNotas ./BackendNotas
RUN npx prisma generate --schema=BackendNotas/prisma/schema.prisma \
  && npm run build -w backend-notas

# -----------------------------------------------------------------------------
# Production runner — minimal runtime without devDependencies tooling
# -----------------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY BackendNotas/package.json ./BackendNotas/
RUN npm ci --omit=dev -w backend-notas --ignore-scripts \
  && npm install prisma @prisma/client --omit=dev -w backend-notas
COPY --from=builder /app/BackendNotas/dist ./BackendNotas/dist
COPY --from=builder /app/BackendNotas/prisma ./BackendNotas/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY docker/scripts ./docker/scripts
RUN chmod +x /app/docker/scripts/*.sh
EXPOSE 3001
ENTRYPOINT ["sh", "/app/docker/scripts/backend-entrypoint.sh"]
CMD ["npm", "run", "start:prod", "-w", "backend-notas"]
