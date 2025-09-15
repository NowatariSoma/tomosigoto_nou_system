#!/usr/bin/env python3
"""
Supabaseにテーブルを直接作成するスクリプト
"""

import os
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root / "backend"))

from backend.app.core.supabase import get_supabase

def create_tables_direct():
    """テーブルを直接作成する"""
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
        
        # 直接SQLを実行
        result = client.postgrest.rpc('exec_sql', {'sql': groups_sql}).execute()
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
        
        result = client.postgrest.rpc('exec_sql', {'sql': parts_sql}).execute()
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
        
        result = client.postgrest.rpc('exec_sql', {'sql': indexes_sql}).execute()
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
        
        result = client.postgrest.rpc('exec_sql', {'sql': function_sql}).execute()
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
        
        result = client.postgrest.rpc('exec_sql', {'sql': triggers_sql}).execute()
        print(f"   トリガー作成結果: {result}")

        # 6. サンプルデータ（groups）
        print("6. サンプルデータ（groups）を挿入中...")
        groups_data = [
            {'name': 'A', 'display_name': 'グループA', 'color': '#3B82F6', 'is_active': True, 'sort_order': 1},
            {'name': 'B', 'display_name': 'グループB', 'color': '#10B981', 'is_active': True, 'sort_order': 2},
            {'name': 'C', 'display_name': 'グループC', 'color': '#F59E0B', 'is_active': True, 'sort_order': 3},
            {'name': 'D', 'display_name': 'グループD', 'color': '#EF4444', 'is_active': True, 'sort_order': 4},
            {'name': 'E', 'display_name': 'グループE', 'color': '#8B5CF6', 'is_active': True, 'sort_order': 5}
        ]
        
        for group_data in groups_data:
            try:
                result = client.table('groups').insert(group_data).execute()
                print(f"   グループ {group_data['name']} を挿入: {result.data}")
            except Exception as e:
                print(f"   グループ {group_data['name']} の挿入でエラー: {e}")

        # 7. サンプルデータ（parts）
        print("7. サンプルデータ（parts）を挿入中...")
        parts_data = [
            {'name': '○○パート', 'display_name': '○○パート', 'description': 'メインのパート練習', 'is_active': True, 'sort_order': 1},
            {'name': '××パート', 'display_name': '××パート', 'description': 'サブのパート練習', 'is_active': True, 'sort_order': 2},
            {'name': '△△パート', 'display_name': '△△パート', 'description': '補助のパート練習', 'is_active': True, 'sort_order': 3},
            {'name': '集合', 'display_name': '集合・挨拶', 'description': '練習開始時の集合', 'is_active': True, 'sort_order': 4},
            {'name': '準備', 'display_name': '準備', 'description': '練習前の準備時間', 'is_active': True, 'sort_order': 5},
            {'name': '整上', 'display_name': '整上・挨拶', 'description': '練習終了時の整上', 'is_active': True, 'sort_order': 6}
        ]
        
        for part_data in parts_data:
            try:
                result = client.table('parts').insert(part_data).execute()
                print(f"   パート {part_data['name']} を挿入: {result.data}")
            except Exception as e:
                print(f"   パート {part_data['name']} の挿入でエラー: {e}")

        print("\n✅ テーブル作成が完了しました！")
        print("バックエンドサーバーを再起動してください。")

    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        print("Supabaseの設定を確認してください。")
        return False

    return True

if __name__ == "__main__":
    create_tables_direct()




