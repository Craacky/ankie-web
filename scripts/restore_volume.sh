#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/restore_volume.sh <backup_file.tar.gz> [volume_name]" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="${1}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  if [[ -f "${ROOT_DIR}/${BACKUP_FILE}" ]]; then
    BACKUP_FILE="${ROOT_DIR}/${BACKUP_FILE}"
  else
    echo "Backup file not found: ${1}" >&2
    exit 1
  fi
fi

VOLUME_NAME="${2:-}"
if [[ -z "${VOLUME_NAME}" ]]; then
  VOLUME_NAME="$(docker volume ls --format '{{.Name}}' | grep 'ankie_data$' | head -n 1 || true)"
fi

if [[ -z "${VOLUME_NAME}" ]]; then
  echo "Could not determine Docker volume name for ankie_data." >&2
  echo "Pass it explicitly: ./scripts/restore_volume.sh <backup_file.tar.gz> <volume_name>" >&2
  exit 1
fi

read -r -p "This will overwrite data in volume '${VOLUME_NAME}'. Continue? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring '${BACKUP_FILE}' into volume '${VOLUME_NAME}'"
docker run --rm \
  -v "${VOLUME_NAME}:/volume" \
  -v "$(dirname "${BACKUP_FILE}"):/backup" \
  alpine:3.21 \
  sh -c "rm -rf /volume/* && tar -xzf /backup/$(basename "${BACKUP_FILE}") -C /volume"

echo "Restore completed."
