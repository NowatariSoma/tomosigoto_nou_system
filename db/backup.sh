#!/bin/sh
# 手動バックアップスクリプト (本番 VPS で実行)
# 使い方: ./db/backup.sh
set -e

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

FILENAME="$BACKUP_DIR/tomosigoto_$(date +%Y%m%d_%H%M%S).sql.gz"

docker exec tomosigoto-postgres-prod \
  pg_dump -U "${POSTGRES_USER:-tomosigoto}" "${POSTGRES_DB:-tomosigoto}" \
  | gzip > "$FILENAME"

echo "Backup created: $FILENAME ($(du -h "$FILENAME" | cut -f1))"

# 7日より古いバックアップを削除
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "Old backups cleaned."
