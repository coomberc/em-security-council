#!/usr/bin/env bash
# Start a local Postgres container for development.
set -euo pipefail

CONTAINER_NAME="em-security-council-db"
VOLUME_NAME="em-security-council-pgdata"
POSTGRES_USER="security_council"
POSTGRES_PASSWORD="security_council"
POSTGRES_DB="em_security_council"
PORT="5433"

# Detect container runtime
if docker info &>/dev/null 2>&1; then
  RUNTIME="docker"
elif podman info &>/dev/null 2>&1; then
  RUNTIME="podman"
elif podman-remote-static-linux_amd64 info &>/dev/null 2>&1; then
  RUNTIME="podman-remote-static-linux_amd64"
elif command -v wsl.exe &>/dev/null && wsl.exe -d podman-machine-default -- podman info &>/dev/null 2>&1; then
  RUNTIME="wsl.exe -d podman-machine-default -- podman"
else
  echo "Error: No working container runtime found. Install docker or podman." >&2
  exit 1
fi

echo "Using runtime: $RUNTIME"

# Check if already running
if $RUNTIME ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  echo "Container '$CONTAINER_NAME' is already running."
  exit 0
fi

# Check if stopped container exists, restart it
if $RUNTIME ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  echo "Restarting stopped container '$CONTAINER_NAME'..."
  $RUNTIME start "$CONTAINER_NAME" >/dev/null
else
  echo "Starting new Postgres container..."
  $RUNTIME run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "${PORT}:5432" \
    -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
    --restart unless-stopped \
    postgres:16-alpine
fi

echo "Waiting for Postgres to be ready..."
for i in $(seq 1 30); do
  if $RUNTIME exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &>/dev/null; then
    echo "Postgres is ready on port $PORT."
    exit 0
  fi
  sleep 1
done

echo "Error: Postgres did not become ready in time." >&2
exit 1
