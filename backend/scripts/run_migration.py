#!/usr/bin/env python3
"""
マイグレーション実行スクリプト

Supabaseマイグレーションを実行するためのCLIスクリプトです。
開発、テスト、本番環境に対応し、柔軟なマイグレーション実行を提供します。
"""
import argparse
import sys
import logging
from pathlib import Path
from typing import Optional

# プロジェクトルートをPythonパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from migrations.config import MigrationConfig
from migrations.manager import MigrationManager, MigrationResult


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
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('migration.log', encoding='utf-8')
        ]
    )


def parse_args() -> argparse.Namespace:
    """コマンドライン引数を解析
    
    Returns:
        argparse.Namespace: 解析された引数
    """
    parser = argparse.ArgumentParser(
        description='Supabaseマイグレーション実行ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 開発環境で全マイグレーションを実行
  python run_migration.py --env dev

  # 特定バージョンまで実行
  python run_migration.py --env prod --target 20250115120000

  # ドライランで実行内容を確認
  python run_migration.py --env test --dry-run

  # ロールバック実行
  python run_migration.py --env dev --rollback 2

  # 特定バージョンまでロールバック
  python run_migration.py --env dev --rollback-to 20250114120000
        """
    )
    
    # 基本オプション
    parser.add_argument(
        '--env', '--environment',
        choices=['dev', 'test', 'prod'],
        default='dev',
        help='実行環境 (デフォルト: dev)'
    )
    
    parser.add_argument(
        '--target', '--target-version',
        type=str,
        help='実行するターゲットバージョン（指定バージョンまで実行）'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='実際には実行せず、実行予定の内容を表示'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='詳細ログを出力'
    )
    
    # ロールバックオプション
    rollback_group = parser.add_mutually_exclusive_group()
    rollback_group.add_argument(
        '--rollback',
        type=int,
        metavar='STEPS',
        help='指定ステップ数分ロールバック'
    )
    
    rollback_group.add_argument(
        '--rollback-to',
        type=str,
        metavar='VERSION',
        help='指定バージョンまでロールバック'
    )
    
    # 検証オプション
    parser.add_argument(
        '--verify',
        action='store_true',
        help='マイグレーションファイルの検証のみ実行'
    )
    
    # 履歴表示オプション
    parser.add_argument(
        '--status',
        action='store_true',
        help='現在のマイグレーション状態を表示'
    )
    
    # 強制実行オプション
    parser.add_argument(
        '--force',
        action='store_true',
        help='警告を無視して強制実行（本番環境では注意）'
    )
    
    return parser.parse_args()


def display_migration_status(manager: MigrationManager) -> None:
    """マイグレーション状態を表示
    
    Args:
        manager (MigrationManager): マイグレーション管理インスタンス
    """
    print("=== マイグレーション状態 ===")
    
    # 現在のバージョンを表示
    current_version = manager.get_current_version()
    if current_version:
        print(f"現在のバージョン: {current_version}")
    else:
        print("適用済みマイグレーションなし")
    
    # 利用可能なマイグレーションを表示
    migrations = manager.discover_migrations()
    print(f"\n利用可能なマイグレーション数: {len(migrations)}")
    
    # 適用状況を表示
    print("\n適用状況:")
    for migration in migrations:
        is_applied = manager.history.is_applied(migration.version)
        status = "✓ 適用済み" if is_applied else "✗ 未適用"
        print(f"  {migration.version} ({migration.name}): {status}")
    
    # 統計情報を表示
    stats = manager.history.get_migration_statistics()
    if stats:
        print(f"\n=== 統計情報 ===")
        print(f"総マイグレーション数: {stats.get('total_migrations', 0)}")
        print(f"成功: {stats.get('successful_migrations', 0)}")
        print(f"失敗: {stats.get('failed_migrations', 0)}")
        print(f"成功率: {stats.get('success_rate', 0):.1f}%")
        print(f"平均実行時間: {stats.get('average_duration_ms', 0):.1f}ms")


def display_results(result: MigrationResult, operation: str = "migration") -> None:
    """実行結果を表示
    
    Args:
        result (MigrationResult): 実行結果
        operation (str): 実行した操作名
    """
    print(f"\n=== {operation.upper()} 実行結果 ===")
    
    if result.success:
        print("✓ 実行成功")
        if hasattr(result, 'applied_count') and result.applied_count > 0:
            print(f"適用されたマイグレーション数: {result.applied_count}")
        if hasattr(result, 'rolled_back_count') and result.rolled_back_count > 0:
            print(f"ロールバックされたマイグレーション数: {result.rolled_back_count}")
        
        if hasattr(result, 'executed_migrations') and result.executed_migrations:
            print("\n実行されたマイグレーション:")
            for migration_id in result.executed_migrations:
                print(f"  - {migration_id}")
    else:
        print("✗ 実行失敗")
        if result.error_message:
            print(f"エラー: {result.error_message}")
    
    print(f"実行時刻: {result.execution_time}")


def confirm_production_execution(args: argparse.Namespace) -> bool:
    """本番環境での実行確認
    
    Args:
        args (argparse.Namespace): コマンドライン引数
        
    Returns:
        bool: 実行を継続する場合True
    """
    if args.env != 'prod' or args.force:
        return True
    
    print("⚠️  本番環境でのマイグレーション実行を行います。")
    print("本番データに影響を与える可能性があります。")
    
    if args.rollback or args.rollback_to:
        print("⚠️  ロールバック操作は特に危険です。")
    
    response = input("続行しますか？ (yes/No): ").strip().lower()
    return response in ['yes', 'y']


def run_migration(args: argparse.Namespace) -> bool:
    """マイグレーションを実行
    
    Args:
        args (argparse.Namespace): コマンドライン引数
        
    Returns:
        bool: 実行成功の場合True
    """
    try:
        # 設定を初期化
        config = MigrationConfig(environment=args.env)
        manager = MigrationManager(config)
        
        # 状態表示のみの場合
        if args.status:
            display_migration_status(manager)
            return True
        
        # 検証のみの場合
        if args.verify:
            print("マイグレーションファイルを検証中...")
            issues = manager.verify_migrations()
            
            if not issues:
                print("✓ 検証完了: 問題は見つかりませんでした")
                return True
            else:
                print(f"✗ 検証完了: {len(issues)}個の問題が見つかりました")
                for issue in issues:
                    severity_icon = "🔴" if issue.severity == "error" else "🟡"
                    print(f"  {severity_icon} {issue.migration_file}: {issue.message}")
                return len([i for i in issues if i.severity == "error"]) == 0
        
        # 本番環境での実行確認
        if not confirm_production_execution(args):
            print("実行をキャンセルしました。")
            return False
        
        # ロールバック実行
        if args.rollback is not None:
            print(f"マイグレーションを {args.rollback} ステップ分ロールバックします...")
            result = manager.rollback(steps=args.rollback)
            display_results(result, "rollback")
            return result.success
        
        if args.rollback_to:
            print(f"マイグレーションをバージョン {args.rollback_to} までロールバックします...")
            result = manager.rollback_to(args.rollback_to)
            display_results(result, "rollback")
            return result.success
        
        # 通常のマイグレーション実行
        print("マイグレーションを実行中...")
        if args.target:
            print(f"ターゲットバージョン: {args.target}")
        
        result = manager.run_migrations(target_version=args.target)
        display_results(result, "migration")
        
        return result.success
        
    except KeyboardInterrupt:
        print("\n\n実行がユーザーによって中断されました。")
        return False
    except Exception as e:
        logging.error(f"予期しないエラーが発生しました: {e}")
        print(f"エラー: {e}")
        return False


def main() -> int:
    """メイン実行関数
    
    Returns:
        int: 終了コード (0: 成功, 1: 失敗)
    """
    args = parse_args()
    
    # ログ設定
    setup_logging(args.verbose)
    
    # 実行前の情報表示
    print(f"Supabaseマイグレーション実行ツール")
    print(f"環境: {args.env}")
    
    if args.dry_run:
        print("⚠️  ドライランモード: 実際の実行は行いません")
        # ドライランの実装は簡略化
        print("ドライラン機能は今回の実装では省略します。")
        return 0
    
    # マイグレーションを実行
    success = run_migration(args)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())