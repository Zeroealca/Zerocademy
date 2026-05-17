#!/bin/sh
# Blocks until PostgreSQL accepts connections.
# Uses Docker Compose service hostname "postgres" (not localhost).

set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-notas}"
POSTGRES_DB="${POSTGRES_DB:-notas_db}"
MAX_RETRIES="${POSTGRES_WAIT_RETRIES:-30}"
SLEEP_SECONDS="${POSTGRES_WAIT_INTERVAL:-2}"

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

retries=0
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  retries=$((retries + 1))
  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "PostgreSQL is not available after ${MAX_RETRIES} attempts."
    exit 1
  fi
  echo "  attempt ${retries}/${MAX_RETRIES} — retrying in ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

echo "PostgreSQL is ready."
