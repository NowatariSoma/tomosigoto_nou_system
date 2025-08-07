#!/bin/bash

# API動作確認スクリプト

echo "🧪 Testing Tomosigoto API..."
echo "=========================="

# APIの基本情報を確認
echo -e "\n1. API基本情報の確認"
curl -s http://localhost:8000/ | jq . || echo "jqがインストールされていません。生データ: $(curl -s http://localhost:8000/)"

# OpenAPI仕様書の確認
echo -e "\n2. OpenAPI仕様書の確認"
echo "ブラウザで以下のURLを開いてください："
echo "- Swagger UI: http://localhost:8000/docs"
echo "- ReDoc: http://localhost:8000/redoc"

# ヘルスチェック（もしあれば）
echo -e "\n3. API v1エンドポイントの確認"
curl -s http://localhost:8000/api/v1 | jq . 2>/dev/null || echo "API v1エンドポイントが存在しません"

# 認証なしでのユーザー一覧取得（401エラーが期待される）
echo -e "\n4. 認証なしでユーザー一覧を取得（401エラーが期待される）"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:8000/api/v1/users/)
echo "$response" | head -n -1 | jq . 2>/dev/null || echo "$response" | head -n -1
echo "HTTPステータス: $(echo "$response" | tail -n 1 | cut -d: -f2)"

# テスト用のトークンを使った認証（実際のトークンが必要）
echo -e "\n5. 認証付きリクエストのテスト"
echo "実際のJWTトークンが必要です。Supabaseダッシュボードからトークンを取得してください。"
echo "例: curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:8000/api/v1/users/"

echo -e "\n=========================="
echo "✅ API動作確認完了"