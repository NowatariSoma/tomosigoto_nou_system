#!/bin/sh
# 復旧テストスクリプト
# バックアップから別コンテナに復元して整合性を確認する
# 使い方: ./db/restore_test.sh [backups/tomosigoto_YYYYMMDD_HHMMSS.sql.gz]
set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  BACKUP_FILE=$(ls -t backups/*.sql.gz 2>/dev/null | head -1)
  if [ -z "$BACKUP_FILE" ]; then
    echo "Error: no backup file found. Run db/backup.sh first."
    exit 1
  fi
fi

echo "=== 復旧テスト: $BACKUP_FILE ==="
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# テスト用一時コンテナ起動（空のDB）
docker run -d --name tomosigoto-restore-test \
  -e POSTGRES_USER=tomosigoto \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=tomosigoto \
  postgres:16-alpine

echo "Waiting for test DB..."
sleep 6

# バックアップを直接復元（スキーマも含まれているので事前適用不要）
echo "Restoring..."
gunzip -c "$BACKUP_FILE" | \
  docker exec -i tomosigoto-restore-test psql -U tomosigoto tomosigoto -q 2>&1 | \
  grep -v "^$" | grep -v "^SET$" | grep "ERROR" || true

echo "Restore done."

# 整合性確認
echo ""
echo "=== テーブル件数 ==="
docker exec tomosigoto-restore-test psql -U tomosigoto tomosigoto -c "
SELECT
  (SELECT COUNT(*) FROM users)              AS users,
  (SELECT COUNT(*) FROM user_profiles)      AS user_profiles,
  (SELECT COUNT(*) FROM user_roles)         AS user_roles,
  (SELECT COUNT(*) FROM venues)             AS venues,
  (SELECT COUNT(*) FROM stages)             AS stages,
  (SELECT COUNT(*) FROM parts)              AS parts,
  (SELECT COUNT(*) FROM practice_schedules) AS practice_schedules,
  (SELECT COUNT(*) FROM sessions)           AS sessions;
"

echo ""
echo "=== bcrypt ハッシュプレフィックス確認 (移行後は \$2a\$ or \$2b\$ どちらでもOK) ==="
docker exec tomosigoto-restore-test psql -U tomosigoto tomosigoto -c "
SELECT email, LEFT(encrypted_password, 7) AS hash_prefix, is_verified
FROM users
LIMIT 5;
"

# クリーンアップ
docker stop tomosigoto-restore-test
docker rm tomosigoto-restore-test

echo ""
echo "✅ 復旧テスト完了"
