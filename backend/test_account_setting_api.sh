#!/bin/bash

# Account Setting API テストスクリプト
# このスクリプトはaccount-setting APIの動作確認を行います

BASE_URL="http://localhost:8000/api/v1/account-setting"

echo "=== Account Setting API テスト開始 ==="

# 1. ヘルスチェック
echo "1. ヘルスチェック"
curl -X GET "${BASE_URL}/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 2. 学部一覧取得
echo "2. 学部一覧取得"
curl -X GET "${BASE_URL}/faculties" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 3. 特定学部取得
echo "3. 特定学部取得（文学部）"
curl -X GET "${BASE_URL}/faculties/文" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 注意: 以下のテストは認証が必要です
# 実際のテストでは有効なJWTトークンが必要です

echo "=== 認証が必要なエンドポイントのテスト ==="
echo "以下のエンドポイントは認証が必要です："
echo "- GET ${BASE_URL}/profile (現在のユーザープロフィール取得)"
echo "- POST ${BASE_URL}/profile (プロフィール作成)"
echo "- PUT ${BASE_URL}/profile (プロフィール更新)"
echo "- DELETE ${BASE_URL}/profile (プロフィール削除)"
echo "- GET ${BASE_URL}/profile/history (変更履歴取得)"
echo "- POST ${BASE_URL}/validate (バリデーション)"

echo ""
echo "=== テスト用のサンプルリクエスト ==="

# プロフィール作成のサンプル
echo "プロフィール作成のサンプル："
cat << 'EOF'
curl -X POST "${BASE_URL}/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "student_id": "1234567890",
    "first_name_kanji": "太郎",
    "first_name_katakana": "タロウ",
    "last_name_kanji": "田中",
    "last_name_katakana": "タナカ",
    "year": 3,
    "faculty": "文",
    "email": "tanaka@mail.doshisha.ac.jp"
  }'
EOF

echo ""
echo "プロフィール更新のサンプル："
cat << 'EOF'
curl -X PUT "${BASE_URL}/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "year": 4,
    "faculty": "法",
    "change_reason": "学部変更"
  }'
EOF

echo ""
echo "=== Account Setting API テスト完了 ==="
