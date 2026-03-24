#!/bin/sh
# バックアップ + オフサイト転送スクリプト
# VPS の cron に登録: 0 3 * * * /opt/tomosigoto/db/backup.sh >> /var/log/tomosigoto-backup.log 2>&1
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"

# ── バックアップ作成 ──────────────────────────────────
FILENAME="$BACKUP_DIR/tomosigoto_$(date +%Y%m%d_%H%M%S).sql.gz"

docker exec tomosigoto-postgres-prod \
  pg_dump -U "${POSTGRES_USER:-tomosigoto}" "${POSTGRES_DB:-tomosigoto}" \
  | gzip > "$FILENAME"

echo "[$(date)] Backup created: $FILENAME ($(du -h "$FILENAME" | cut -f1))"

# 7日より古いローカルバックアップを削除
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

# ── 拠点への転送 ──────────────────────────────────────
# /opt/tomosigoto/.backup_remotes に転送先を記載する
# 書式: user@host:/path/to/backup/dir  (1行1拠点)
# 例:
#   nas@192.168.1.10:/volume1/tomosigoto-backups
#   backup@10.0.0.5:/home/backup/tomosigoto

REMOTES_FILE="$SCRIPT_DIR/../.backup_remotes"

if [ ! -f "$REMOTES_FILE" ]; then
  echo "[$(date)] .backup_remotes not found, skipping remote sync"
  exit 0
fi

SSH_KEY="${HOME}/.ssh/backup_key"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

while IFS= read -r remote || [ -n "$remote" ]; do
  # 空行・コメント行をスキップ
  case "$remote" in
    ''|\#*) continue ;;
  esac

  echo "[$(date)] Syncing to $remote ..."
  if rsync -az --delete \
    -e "ssh $SSH_OPTS" \
    "$BACKUP_DIR/" \
    "$remote/"; then
    echo "[$(date)] ✅ Sync OK: $remote"
  else
    echo "[$(date)] ⚠️  Sync FAILED: $remote (continuing)"
  fi
done < "$REMOTES_FILE"

echo "[$(date)] Done."
