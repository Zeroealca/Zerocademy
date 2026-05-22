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

/app/docker/scripts/wait-for-postgres.sh

PRISMA_SCHEMA="BackendZerocademy/prisma/schema.prisma"

echo "Running prisma generate..."
npx prisma generate --schema="$PRISMA_SCHEMA"

echo "Applying database migrations..."
npx prisma migrate deploy --schema="$PRISMA_SCHEMA"

if [ "${RUN_PRISMA_SEED:-true}" != "false" ]; then
  echo "Running database seed..."
  npm run prisma:seed -w backend-zerocademy
else
  echo "Skipping database seed (RUN_PRISMA_SEED=false)."
fi

if [ "$#" -eq 0 ]; then
  echo "Starting NestJS in development mode (watch)..."
  exec npm run start:dev -w backend-zerocademy
else
  echo "Starting NestJS: $*"
  exec "$@"
fi
