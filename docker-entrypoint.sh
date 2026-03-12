#!/bin/sh
set -e

# Compose DATABASE_URL from individual env vars injected by ECS/Secrets Manager
if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_USER" ] && [ -n "$DATABASE_PASSWORD" ]; then
  export DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:5432/${DATABASE_NAME:-em_security_council}"
fi

exec "$@"
