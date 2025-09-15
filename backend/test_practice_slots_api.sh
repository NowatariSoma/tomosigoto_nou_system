#!/bin/bash

# practice_slots APIのテストスクリプト

echo "🧪 Testing Practice Slots API..."
echo "================================"

# 環境変数を読み込み
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

source .env

# APIの基本情報を確認
echo -e "\n1. API基本情報の確認"
curl -s http://localhost:8000/ | jq . || echo "jqがインストールされていません。生データ: $(curl -s http://localhost:8000/)"

# practice_slotsの一覧取得
echo -e "\n2. Practice Slots一覧の取得"
curl -s http://localhost:8000/api/v1/practice-slots/ | jq . || echo "生データ: $(curl -s http://localhost:8000/api/v1/practice-slots/)"

# 特定の日付のpractice_slotを取得
echo -e "\n3. 特定日付のPractice Slot取得 (2024-05-26)"
curl -s http://localhost:8000/api/v1/practice-slots/date/2024-05-26 | jq . || echo "生データ: $(curl -s http://localhost:8000/api/v1/practice-slots/date/2024-05-26)"

# サンプルデータでpractice_slotを作成
echo -e "\n4. サンプルデータでPractice Slot作成"
curl -X POST "http://localhost:8000/api/v1/practice-slots/with-sample-data?target_date=2024-05-29" | jq . || echo "生データ: $(curl -X POST "http://localhost:8000/api/v1/practice-slots/with-sample-data?target_date=2024-05-29")"

# 作成後の一覧を再確認
echo -e "\n5. 作成後のPractice Slots一覧"
curl -s http://localhost:8000/api/v1/practice-slots/ | jq . || echo "生データ: $(curl -s http://localhost:8000/api/v1/practice-slots/)"

echo -e "\n================================"
echo "✅ Practice Slots APIテスト完了"

