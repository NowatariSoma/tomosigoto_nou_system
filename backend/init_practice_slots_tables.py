#!/usr/bin/env python3
"""
練習表用のテーブルを初期化するスクリプト
Supabaseでテーブルを作成します
"""

import os
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from app.core.supabase import get_supabase

def create_tables():
    """練習表用のテーブルを作成"""
    
    # Supabaseクライアントを取得
    client = get_supabase()
    
    # テーブル作成SQL
    create_practice_slots_table = """
    CREATE TABLE IF NOT EXISTS practice_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL UNIQUE,
        title VARCHAR(255),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    create_schedule_items_table = """
    CREATE TABLE IF NOT EXISTS schedule_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        practice_slot_id UUID NOT NULL REFERENCES practice_slots(id) ON DELETE CASCADE,
        time VARCHAR(10) NOT NULL,
        duration VARCHAR(20),
        activity TEXT NOT NULL,
        columns TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    # インデックス作成SQL
    create_indexes = """
    CREATE INDEX IF NOT EXISTS idx_practice_slots_date ON practice_slots(date);
    CREATE INDEX IF NOT EXISTS idx_schedule_items_practice_slot_id ON schedule_items(practice_slot_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_items_time ON schedule_items(time);
    """
    
    # 更新日時の自動更新関数
    create_trigger_function = """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """
    
    # トリガー作成SQL
    create_triggers = """
    DROP TRIGGER IF EXISTS update_practice_slots_updated_at ON practice_slots;
    CREATE TRIGGER update_practice_slots_updated_at
        BEFORE UPDATE ON practice_slots
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_schedule_items_updated_at ON schedule_items;
    CREATE TRIGGER update_schedule_items_updated_at
        BEFORE UPDATE ON schedule_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """
    
    try:
        print("練習表用のテーブルを作成中...")
        
        # テーブル作成
        print("1. practice_slotsテーブルを作成中...")
        result1 = client.rpc('exec_sql', {'sql': create_practice_slots_table})
        print(f"  結果: {result1}")
        
        print("2. schedule_itemsテーブルを作成中...")
        result2 = client.rpc('exec_sql', {'sql': create_schedule_items_table})
        print(f"  結果: {result2}")
        
        print("3. インデックスを作成中...")
        result3 = client.rpc('exec_sql', {'sql': create_indexes})
        print(f"  結果: {result3}")
        
        print("4. トリガー関数を作成中...")
        result4 = client.rpc('exec_sql', {'sql': create_trigger_function})
        print(f"  結果: {result4}")
        
        print("5. トリガーを作成中...")
        result5 = client.rpc('exec_sql', {'sql': create_triggers})
        print(f"  結果: {result5}")
        
        print("✅ テーブル作成が完了しました！")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_tables()
    if success:
        print("\n🎉 練習表用のテーブルが正常に作成されました！")
        print("これで練習表APIが使用できるようになります。")
    else:
        print("\n💥 テーブル作成に失敗しました。")
        sys.exit(1)
