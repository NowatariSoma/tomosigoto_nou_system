#!/usr/bin/env python3
"""
Supabaseにテーブルを作成するスクリプト
"""

import os
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root / "backend"))

from backend.app.core.supabase import get_supabase

def create_tables():
    """テーブルを作成する"""
    try:
        # Supabaseクライアントを取得
        client = get_supabase()
        print("Supabaseクライアントに接続しました")

        # 1. groups テーブル
        print("1. groupsテーブルを作成中...")
        groups_sql = """
        CREATE TABLE IF NOT EXISTS groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            color VARCHAR(7) DEFAULT '#3B82F6',
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        result = client.rpc('exec_sql', {'sql': groups_sql})
        print(f"   groupsテーブル作成結果: {result}")

        # 2. parts テーブル
        print("2. partsテーブルを作成中...")
        parts_sql = """
        CREATE TABLE IF NOT EXISTS parts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(150) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        result = client.rpc('exec_sql', {'sql': parts_sql})
        print(f"   partsテーブル作成結果: {result}")

        # 3. インデックス
        print("3. インデックスを作成中...")
        indexes_sql = """
        CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
        CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
        CREATE INDEX IF NOT EXISTS idx_groups_sort_order ON groups(sort_order);
        CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name);
        CREATE INDEX IF NOT EXISTS idx_parts_is_active ON parts(is_active);
        CREATE INDEX IF NOT EXISTS idx_parts_sort_order ON parts(sort_order);
        """
        
        result = client.rpc('exec_sql', {'sql': indexes_sql})
        print(f"   インデックス作成結果: {result}")

        # 4. 更新日時の自動更新関数
        print("4. 更新日時関数を作成中...")
        function_sql = """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """
        
        result = client.rpc('exec_sql', {'sql': function_sql})
        print(f"   関数作成結果: {result}")

        # 5. トリガー
        print("5. トリガーを作成中...")
        triggers_sql = """
        DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
        CREATE TRIGGER update_groups_updated_at
            BEFORE UPDATE ON groups
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
        CREATE TRIGGER update_parts_updated_at
            BEFORE UPDATE ON parts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """
        
        result = client.rpc('exec_sql', {'sql': triggers_sql})
        print(f"   トリガー作成結果: {result}")

        # 6. サンプルデータ（groups）
        print("6. サンプルデータ（groups）を挿入中...")
        groups_data_sql = """
        INSERT INTO groups (name, display_name, color, is_active, sort_order) VALUES
        ('A', 'グループA', '#3B82F6', true, 1),
        ('B', 'グループB', '#10B981', true, 2),
        ('C', 'グループC', '#F59E0B', true, 3),
        ('D', 'グループD', '#EF4444', true, 4),
        ('E', 'グループE', '#8B5CF6', true, 5)
        ON CONFLICT (name) DO NOTHING;
        """
        
        result = client.rpc('exec_sql', {'sql': groups_data_sql})
        print(f"   groupsサンプルデータ挿入結果: {result}")

        # 7. サンプルデータ（parts）
        print("7. サンプルデータ（parts）を挿入中...")
        parts_data_sql = """
        INSERT INTO parts (name, display_name, description, is_active, sort_order) VALUES
        ('○○パート', '○○パート', 'メインのパート練習', true, 1),
        ('××パート', '××パート', 'サブのパート練習', true, 2),
        ('△△パート', '△△パート', '補助のパート練習', true, 3),
        ('集合', '集合・挨拶', '練習開始時の集合', true, 4),
        ('準備', '準備', '練習前の準備時間', true, 5),
        ('整上', '整上・挨拶', '練習終了時の整上', true, 6)
        ON CONFLICT (name) DO NOTHING;
        """
        
        result = client.rpc('exec_sql', {'sql': parts_data_sql})
        print(f"   partsサンプルデータ挿入結果: {result}")

        print("\n✅ テーブル作成が完了しました！")
        print("バックエンドサーバーを再起動してください。")

    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        print("Supabaseの設定を確認してください。")
        return False

    return True

if __name__ == "__main__":
    create_tables()




