#!/usr/bin/env bash
# Stop the local Postgres container.
set -euo pipefail

CONTAINER_NAME="em-security-council-db"
VOLUME_NAME="em-security-council-pgdata"

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
  echo "Error: No working container runtime found." >&2
  exit 1
fi

DESTROY="${1:-}"

if $RUNTIME ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping container '$CONTAINER_NAME'..."
  $RUNTIME stop "$CONTAINER_NAME" >/dev/null 2>&1 || true

  if [ "$DESTROY" = "--destroy" ]; then
    echo "Removing container and data..."
    $RUNTIME rm -v "$CONTAINER_NAME" >/dev/null
    $RUNTIME volume rm "$VOLUME_NAME" >/dev/null 2>&1 || true
  fi

  echo "Done."
else
  echo "Container '$CONTAINER_NAME' is not running."
fi
