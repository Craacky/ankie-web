#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

VOLUME_NAME="${1:-}"
if [[ -z "${VOLUME_NAME}" ]]; then
  VOLUME_NAME="$(docker volume ls --format '{{.Name}}' | grep 'ankie_data$' | head -n 1 || true)"
fi

if [[ -z "${VOLUME_NAME}" ]]; then
  echo "Could not determine Docker volume name for ankie_data." >&2
  echo "Pass it explicitly: ./scripts/backup_volume.sh <volume_name>" >&2
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
ARCHIVE="ankie_data_${TS}.tar.gz"

echo "Backing up volume '${VOLUME_NAME}' to ${BACKUP_DIR}/${ARCHIVE}"
docker run --rm \
  -v "${VOLUME_NAME}:/volume:ro" \
  -v "${BACKUP_DIR}:/backup" \
  alpine:3.21 \
  sh -c "cd /volume && tar -czf /backup/${ARCHIVE} ."

echo "Backup completed: ${BACKUP_DIR}/${ARCHIVE}"
