#!/usr/bin/env python3
"""
マイグレーションファイル作成スクリプト

新しいSupabaseマイグレーションファイルを作成するためのCLIスクリプトです。
テンプレートベースでのファイル生成と命名規則の自動適用を提供します。
"""
import argparse
import sys
import logging
import re
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

# プロジェクトルートをPythonパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from migrations.config import MigrationConfig
from migrations.manager import MigrationManager, MigrationFile
from migrations.version import VersionUtil


# 利用可能なテンプレート
TEMPLATES = {
    "table": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- テーブル作成マイグレーション
CREATE TABLE IF NOT EXISTS {table_name} (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（必要に応じて）
-- CREATE INDEX IF NOT EXISTS idx_{table_name}_created_at ON {table_name}(created_at);

-- ROLLBACK:
-- DROP TABLE IF EXISTS {table_name};
""",
    
    "column": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- カラム追加マイグレーション
ALTER TABLE {table_name}
ADD COLUMN IF NOT EXISTS {column_name} {column_type};

-- インデックス作成（必要に応じて）
-- CREATE INDEX IF NOT EXISTS idx_{table_name}_{column_name} ON {table_name}({column_name});

-- ROLLBACK:
-- ALTER TABLE {table_name} DROP COLUMN IF EXISTS {column_name};
""",
    
    "index": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- インデックス作成マイグレーション
CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({columns});

-- ROLLBACK:
-- DROP INDEX IF EXISTS {index_name};
""",
    
    "function": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- 関数作成マイグレーション
CREATE OR REPLACE FUNCTION {function_name}()
RETURNS {return_type}
LANGUAGE plpgsql
AS $$
BEGIN
    -- 関数の実装をここに記載
    -- TODO: 実装内容を記載してください
    RETURN NULL;
END;
$$;

-- ROLLBACK:
-- DROP FUNCTION IF EXISTS {function_name}();
""",
    
    "trigger": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- トリガー作成マイグレーション
CREATE OR REPLACE FUNCTION {trigger_function_name}()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- トリガー処理の実装をここに記載
    -- TODO: 実装内容を記載してください
    RETURN NEW;
END;
$$;

CREATE TRIGGER {trigger_name}
    BEFORE INSERT OR UPDATE ON {table_name}
    FOR EACH ROW
    EXECUTE FUNCTION {trigger_function_name}();

-- ROLLBACK:
-- DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};
-- DROP FUNCTION IF EXISTS {trigger_function_name}();
""",
    
    "view": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- ビュー作成マイグレーション
CREATE OR REPLACE VIEW {view_name} AS
SELECT 
    -- TODO: カラムを指定してください
    *
FROM {base_table}
-- WHERE 条件がある場合はここに記載
;

-- ROLLBACK:
-- DROP VIEW IF EXISTS {view_name};
""",
    
    "data": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- データ操作マイグレーション
-- INSERT、UPDATE、DELETE文をここに記載

-- 例: 初期データ挿入
-- INSERT INTO {table_name} (column1, column2) VALUES
--     ('value1', 'value2'),
--     ('value3', 'value4');

-- TODO: 実際のデータ操作SQLを記載してください

-- ROLLBACK:
-- TODO: データ操作のロールバックSQLを記載してください
-- 例: DELETE FROM {table_name} WHERE condition;
""",
    
    "custom": """-- Migration: {name}
-- Description: {description}
-- Author: {author}
-- Created: {created_at}

-- カスタムマイグレーション
-- TODO: 実際のSQL文をここに記載してください


-- ROLLBACK:
-- TODO: ロールバック用SQLを記載してください（オプション）
"""
}


def setup_logging(verbose: bool = False) -> None:
    """ログ設定を初期化
    
    Args:
        verbose (bool): 詳細ログを有効にする場合True
    """
    level = logging.DEBUG if verbose else logging.INFO
    format_str = '%(asctime)s - %(levelname)s - %(message)s'
    
    logging.basicConfig(
        level=level,
        format=format_str,
        handlers=[logging.StreamHandler(sys.stdout)]
    )


def parse_args() -> argparse.Namespace:
    """コマンドライン引数を解析
    
    Returns:
        argparse.Namespace: 解析された引数
    """
    parser = argparse.ArgumentParser(
        description='Supabaseマイグレーションファイル作成ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
利用可能なテンプレート:
{', '.join(TEMPLATES.keys())}

使用例:
  # 基本的なテーブル作成マイグレーション
  python create_migration.py create_users --template table --table-name users

  # カラム追加マイグレーション
  python create_migration.py add_email_column --template column --table-name users --column-name email --column-type "VARCHAR(255)"

  # インデックス作成マイグレーション
  python create_migration.py add_user_email_index --template index --table-name users --index-name idx_users_email --columns email

  # カスタムマイグレーション
  python create_migration.py custom_operation --template custom --description "カスタム操作の説明"

  # 対話モードで作成
  python create_migration.py --interactive
        """
    )
    
    # 基本引数
    parser.add_argument(
        'name',
        nargs='?',
        help='マイグレーション名（スネークケース推奨）'
    )
    
    parser.add_argument(
        '--env', '--environment',
        choices=['dev', 'test', 'prod'],
        default='dev',
        help='実行環境 (デフォルト: dev)'
    )
    
    parser.add_argument(
        '--template', '-t',
        choices=list(TEMPLATES.keys()),
        default='custom',
        help='使用するテンプレート (デフォルト: custom)'
    )
    
    parser.add_argument(
        '--description', '-d',
        type=str,
        help='マイグレーションの説明'
    )
    
    parser.add_argument(
        '--author', '-a',
        type=str,
        default='system',
        help='作成者名 (デフォルト: system)'
    )
    
    # テンプレート固有のオプション
    parser.add_argument(
        '--table-name',
        type=str,
        help='テーブル名 (table, column, index, trigger テンプレート用)'
    )
    
    parser.add_argument(
        '--column-name',
        type=str,
        help='カラム名 (column テンプレート用)'
    )
    
    parser.add_argument(
        '--column-type',
        type=str,
        default='VARCHAR(255)',
        help='カラム型 (column テンプレート用, デフォルト: VARCHAR(255))'
    )
    
    parser.add_argument(
        '--index-name',
        type=str,
        help='インデックス名 (index テンプレート用)'
    )
    
    parser.add_argument(
        '--columns',
        type=str,
        help='カラム名リスト (index テンプレート用, カンマ区切り)'
    )
    
    parser.add_argument(
        '--function-name',
        type=str,
        help='関数名 (function テンプレート用)'
    )
    
    parser.add_argument(
        '--return-type',
        type=str,
        default='VOID',
        help='関数の戻り値型 (function テンプレート用, デフォルト: VOID)'
    )
    
    parser.add_argument(
        '--trigger-name',
        type=str,
        help='トリガー名 (trigger テンプレート用)'
    )
    
    parser.add_argument(
        '--trigger-function-name',
        type=str,
        help='トリガー関数名 (trigger テンプレート用)'
    )
    
    parser.add_argument(
        '--view-name',
        type=str,
        help='ビュー名 (view テンプレート用)'
    )
    
    parser.add_argument(
        '--base-table',
        type=str,
        help='ベーステーブル名 (view テンプレート用)'
    )
    
    # その他のオプション
    parser.add_argument(
        '--interactive', '-i',
        action='store_true',
        help='対話モードで作成'
    )
    
    parser.add_argument(
        '--list-templates',
        action='store_true',
        help='利用可能なテンプレート一覧を表示'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='詳細ログを出力'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='実際には作成せず、生成される内容を表示'
    )
    
    return parser.parse_args()


def list_templates() -> None:
    """利用可能なテンプレート一覧を表示"""
    print("利用可能なテンプレート:")
    for name, template in TEMPLATES.items():
        # テンプレートの最初のコメント行を説明として表示
        first_line = template.strip().split('\n')[0]
        if 'Migration:' in first_line:
            description = "汎用マイグレーション"
        else:
            description = first_line.replace('--', '').strip()
        
        print(f"  {name:12} - {description}")


def validate_migration_name(name: str) -> bool:
    """マイグレーション名の妥当性をチェック
    
    Args:
        name (str): チェック対象の名前
        
    Returns:
        bool: 有効な場合True
    """
    if not name:
        return False
    
    # スネークケースの形式をチェック
    if not re.match(r'^[a-z][a-z0-9_]*[a-z0-9]$', name):
        return False
    
    # 予約語をチェック
    reserved_words = ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter']
    if name.lower() in reserved_words:
        return False
    
    return True


def interactive_mode() -> Dict[str, Any]:
    """対話モードでマイグレーション情報を収集
    
    Returns:
        Dict[str, Any]: 収集された情報
    """
    print("=== 対話モードでマイグレーション作成 ===")
    
    # マイグレーション名
    while True:
        name = input("マイグレーション名を入力してください (スネークケース): ").strip()
        if validate_migration_name(name):
            break
        print("無効な名前です。スネークケース形式で入力してください (例: create_users, add_email_column)")
    
    # テンプレート選択
    print(f"\n利用可能なテンプレート: {', '.join(TEMPLATES.keys())}")
    while True:
        template = input("テンプレートを選択してください [custom]: ").strip() or 'custom'
        if template in TEMPLATES:
            break
        print(f"無効なテンプレートです。次から選択してください: {', '.join(TEMPLATES.keys())}")
    
    # 説明
    description = input("マイグレーションの説明を入力してください [オプション]: ").strip()
    
    # 作成者
    author = input("作成者名を入力してください [system]: ").strip() or 'system'
    
    result = {
        'name': name,
        'template': template,
        'description': description,
        'author': author
    }
    
    # テンプレート固有の情報を収集
    if template == 'table':
        result['table_name'] = input("テーブル名を入力してください: ").strip()
    elif template == 'column':
        result['table_name'] = input("テーブル名を入力してください: ").strip()
        result['column_name'] = input("カラム名を入力してください: ").strip()
        result['column_type'] = input("カラム型を入力してください [VARCHAR(255)]: ").strip() or 'VARCHAR(255)'
    elif template == 'index':
        result['table_name'] = input("テーブル名を入力してください: ").strip()
        result['index_name'] = input("インデックス名を入力してください: ").strip()
        result['columns'] = input("カラム名を入力してください (カンマ区切り): ").strip()
    elif template == 'function':
        result['function_name'] = input("関数名を入力してください: ").strip()
        result['return_type'] = input("戻り値型を入力してください [VOID]: ").strip() or 'VOID'
    elif template == 'trigger':
        result['table_name'] = input("テーブル名を入力してください: ").strip()
        result['trigger_name'] = input("トリガー名を入力してください: ").strip()
        result['trigger_function_name'] = input("トリガー関数名を入力してください: ").strip()
    elif template == 'view':
        result['view_name'] = input("ビュー名を入力してください: ").strip()
        result['base_table'] = input("ベーステーブル名を入力してください: ").strip()
    
    return result


def generate_migration_content(name: str, template: str, args: argparse.Namespace) -> str:
    """マイグレーション内容を生成
    
    Args:
        name (str): マイグレーション名
        template (str): テンプレート名
        args (argparse.Namespace): コマンドライン引数
        
    Returns:
        str: 生成されたマイグレーション内容
    """
    template_content = TEMPLATES[template]
    
    # テンプレート変数を準備
    variables = {
        'name': name,
        'description': args.description or f"{name}の説明",
        'author': args.author,
        'created_at': datetime.now().isoformat(),
        'table_name': getattr(args, 'table_name', 'table_name'),
        'column_name': getattr(args, 'column_name', 'column_name'),
        'column_type': getattr(args, 'column_type', 'VARCHAR(255)'),
        'index_name': getattr(args, 'index_name', 'index_name'),
        'columns': getattr(args, 'columns', 'column1, column2'),
        'function_name': getattr(args, 'function_name', 'function_name'),
        'return_type': getattr(args, 'return_type', 'VOID'),
        'trigger_name': getattr(args, 'trigger_name', 'trigger_name'),
        'trigger_function_name': getattr(args, 'trigger_function_name', 'trigger_function_name'),
        'view_name': getattr(args, 'view_name', 'view_name'),
        'base_table': getattr(args, 'base_table', 'base_table'),
    }
    
    # テンプレートに変数を適用
    try:
        return template_content.format(**variables)
    except KeyError as e:
        logging.warning(f"Template variable not found: {e}")
        return template_content


def create_migration_file(name: str, template: str, args: argparse.Namespace) -> Optional[MigrationFile]:
    """マイグレーションファイルを作成
    
    Args:
        name (str): マイグレーション名
        template (str): テンプレート名
        args (argparse.Namespace): コマンドライン引数
        
    Returns:
        Optional[MigrationFile]: 作成されたマイグレーションファイル、失敗時はNone
    """
    try:
        # 設定を初期化
        config = MigrationConfig(environment=args.env)
        manager = MigrationManager(config)
        
        # マイグレーション内容を生成
        content = generate_migration_content(name, template, args)
        
        # ドライランの場合は内容を表示して終了
        if args.dry_run:
            print("=== 生成されるマイグレーションファイル内容 ===")
            print(content)
            return None
        
        # マイグレーションファイルを作成
        migration_file = manager.create_migration(name, content)
        
        return migration_file
        
    except Exception as e:
        logging.error(f"Failed to create migration file: {e}")
        return None


def main() -> int:
    """メイン実行関数
    
    Returns:
        int: 終了コード (0: 成功, 1: 失敗)
    """
    args = parse_args()
    
    # ログ設定
    setup_logging(args.verbose)
    
    # テンプレート一覧表示
    if args.list_templates:
        list_templates()
        return 0
    
    print("Supabaseマイグレーションファイル作成ツール")
    
    try:
        # 対話モード
        if args.interactive:
            interactive_data = interactive_mode()
            # 対話モードのデータをargsに設定
            for key, value in interactive_data.items():
                setattr(args, key, value)
            args.name = interactive_data['name']
        
        # マイグレーション名の検証
        if not args.name:
            print("エラー: マイグレーション名が指定されていません。")
            print("使用方法: python create_migration.py <migration_name> または --interactive を使用してください。")
            return 1
        
        if not validate_migration_name(args.name):
            print(f"エラー: 無効なマイグレーション名です: {args.name}")
            print("マイグレーション名はスネークケース形式で指定してください (例: create_users, add_email_column)")
            return 1
        
        # マイグレーションファイルを作成
        migration_file = create_migration_file(args.name, args.template, args)
        
        if args.dry_run:
            return 0
        
        if migration_file:
            print(f"✓ マイグレーションファイルを作成しました: {migration_file.filename}")
            print(f"  パス: {migration_file._file_path}")
            print(f"  バージョン: {migration_file.version}")
            print(f"  テンプレート: {args.template}")
            
            if args.verbose:
                print(f"\n作成された内容:")
                print(migration_file.content)
            
            return 0
        else:
            print("✗ マイグレーションファイルの作成に失敗しました。")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n作成がユーザーによって中断されました。")
        return 1
    except Exception as e:
        logging.error(f"予期しないエラーが発生しました: {e}")
        print(f"エラー: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())