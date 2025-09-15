#!/usr/bin/env python3
"""
practice_slotsテーブルを作成するスクリプト
"""

import os
import sys
from supabase import create_client, Client

# 環境変数を読み込み
from dotenv import load_dotenv
load_dotenv()

def create_practice_slots_table():
    """practice_slotsテーブルを作成"""
    
    # Supabaseクライアントを作成
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        sys.exit(1)
    
    supabase: Client = create_client(url, key)
    
    # practice_slotsテーブルを作成するSQL
    create_table_sql = """
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
    
    COMMENT ON TABLE practice_slots IS '練習日（日付）を管理するテーブル';
    COMMENT ON COLUMN practice_slots.date IS '練習日（日付）';
    COMMENT ON COLUMN practice_slots.title IS '練習表のタイトル';
    COMMENT ON COLUMN practice_slots.description IS '説明';
    COMMENT ON COLUMN practice_slots.is_active IS 'アクティブフラグ';
    """
    
    try:
        # SQLを実行
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("✅ practice_slotsテーブルが正常に作成されました")
        print(f"Result: {result}")
        
        # テーブルが作成されたか確認
        test_query = supabase.table('practice_slots').select('*').limit(1).execute()
        print(f"✅ テーブル確認: {len(test_query.data)} 件のレコードが見つかりました")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_practice_slots_table()

