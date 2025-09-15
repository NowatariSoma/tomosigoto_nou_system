#!/bin/bash

# Supabaseテーブル作成スクリプト
# practice_slotsテーブルとschedule_assignmentsテーブルを作成

echo "🗄️  Creating Supabase tables..."
echo "================================"

# 環境変数を読み込み
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

source .env

# SupabaseのURLとキーを確認
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "Supabase URL: $SUPABASE_URL"

# practice_slotsテーブルを作成
echo -e "\n1. Creating practice_slots table..."

PRACTICE_SLOTS_SQL='
CREATE TABLE IF NOT EXISTS practice_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_slots_date ON practice_slots(date);
CREATE INDEX IF NOT EXISTS idx_practice_slots_is_active ON practice_slots(is_active);

COMMENT ON TABLE practice_slots IS "練習日（日付）を管理するテーブル";
COMMENT ON COLUMN practice_slots.date IS "練習日（日付）";
COMMENT ON COLUMN practice_slots.title IS "練習表のタイトル";
COMMENT ON COLUMN practice_slots.description IS "説明";
COMMENT ON COLUMN practice_slots.is_active IS "アクティブフラグ";
'

# SQLを実行（curlを使用）
echo "Executing SQL for practice_slots table..."

# 注意: この方法はSupabaseの制限により動作しない可能性があります
# 代わりにSupabaseダッシュボードのSQLエディタを使用してください

echo "⚠️  Direct SQL execution is not supported via API."
echo "Please execute the following SQL in Supabase Dashboard > SQL Editor:"
echo ""
echo "$PRACTICE_SLOTS_SQL"
echo ""
echo "After creating the table, run: ./test_api.sh"

echo -e "\n================================"
echo "✅ Table creation script completed"
echo "Please create the table manually in Supabase Dashboard"

