#!/bin/sh
# Backend container startup:
#   1. Wait for Postgres (belt-and-suspenders with compose healthcheck)
#   2. prisma generate — client matches schema inside the container
#   3. prisma migrate deploy — apply pending migrations (idempotent)
#   4. Start NestJS (dev watch or production CMD)

set -e

cd /app

# npm workspaces: Nest core is hoisted to root; platform-express lives in BackendZerocademy/node_modules
export NODE_PATH="/app/BackendZerocademy/node_modules:/app/node_modules${NODE_PATH:+:$NODE_PATH}"

export POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_USER="${POSTGRES_USER:-zerocademy}"
export POSTGRES_DB="${POSTGRES_DB:-zerocademy_db}"

# Local Compose uses hostname "postgres". Managed DBs (e.g. Neon on Render)
# skip the wait — connectivity is validated by migrate deploy / the app.
if [ "${SKIP_POSTGRES_WAIT:-false}" = "true" ] \
  || echo "${DATABASE_URL:-}" | grep -Eqi 'neon\.tech|amazonaws\.com|render\.com|supabase\.co'; then
  echo "Skipping wait-for-postgres (managed DATABASE_URL or SKIP_POSTGRES_WAIT=true)."
else
  /app/docker/scripts/wait-for-postgres.sh
fi

PRISMA_SCHEMA="BackendZerocademy/prisma/schema.prisma"

# Prisma schema requires DATABASE_URL_UNPOOLED (directUrl). Fall back to DATABASE_URL
# when only one URL is configured (local Docker). Prefer an unpooled Neon URL in prod.
if [ -z "${DATABASE_URL_UNPOOLED:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL_UNPOOLED="$DATABASE_URL"
  echo "DATABASE_URL_UNPOOLED unset; using DATABASE_URL for Prisma CLI."
fi

echo "Running prisma generate..."
npx prisma generate --schema="$PRISMA_SCHEMA"

if [ "${RECOVER_TEACHER_ASSIGNMENT_MIGRATION:-false}" = "true" ]; then
  echo "Recovering failed teacher assignment uniqueness migration..."
  npx prisma migrate resolve \
    --rolled-back 20260917120000_unique_teacher_per_subject_course \
    --schema="$PRISMA_SCHEMA"
fi

echo "Applying database migrations..."
npx prisma migrate deploy --schema="$PRISMA_SCHEMA"

# Seed only when explicitly enabled. Default: on in development, off in production
# (prod image has no ts-node; Neon already has migrated data).
if [ "${RUN_PRISMA_SEED:-}" = "true" ] \
  || { [ "${RUN_PRISMA_SEED:-}" = "" ] && [ "${NODE_ENV:-development}" != "production" ]; }; then
  echo "Running database seed..."
  npm run prisma:seed -w backend-zerocademy
else
  echo "Skipping database seed (production default or RUN_PRISMA_SEED=false)."
fi

if [ "$#" -eq 0 ]; then
  echo "Starting NestJS in development mode (watch)..."
  exec npm run start:dev -w backend-zerocademy
else
  echo "Starting NestJS: $*"
  exec "$@"
fi
