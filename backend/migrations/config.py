"""
マイグレーション設定管理モジュール

Supabaseマイグレーション実行のための設定を管理します。
環境別設定、データベース接続、マイグレーション実行オプションを提供します。
"""
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path
import logging

from dotenv import load_dotenv


@dataclass
class MigrationConfig:
    """マイグレーション設定クラス
    
    マイグレーション実行に必要な全ての設定を管理します。
    環境変数や設定ファイルから設定を読み込み、検証します。
    """
    
    environment: str = "dev"
    db_url: Optional[str] = None
    migration_dir: str = "supabase/migrations"
    history_table: str = "migration_history"
    auto_rollback: bool = True
    timeout_seconds: int = 300
    env_vars: Optional[Dict[str, Any]] = None
    
    def __post_init__(self) -> None:
        """初期化後処理
        
        設定の読み込みと検証を実行します。
        """
        self.env_vars = self.load_env_vars()
        self._load_environment_config()
        self._validate_config()
    
    def load_env_vars(self) -> Dict[str, Any]:
        """環境変数読み込み
        
        Returns:
            Dict[str, Any]: 読み込まれた環境変数
            
        Raises:
            ValueError: 必須環境変数が不足している場合
        """
        # 環境別の.envファイルを読み込み
        env_file = self._get_env_file_path()
        if env_file.exists():
            load_dotenv(env_file)
            logging.info(f"Loaded environment file: {env_file}")
        
        # 基本的な環境変数を収集
        env_vars = {
            "SUPABASE_URL": os.getenv("SUPABASE_URL"),
            "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY"),
            "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
            "DATABASE_URL": os.getenv("DATABASE_URL"),
            "MIGRATION_DIR": os.getenv("MIGRATION_DIR", self.migration_dir),
            "MIGRATION_HISTORY_TABLE": os.getenv("MIGRATION_HISTORY_TABLE", self.history_table),
            "AUTO_ROLLBACK": os.getenv("AUTO_ROLLBACK", str(self.auto_rollback)).lower() == "true",
            "MIGRATION_TIMEOUT": int(os.getenv("MIGRATION_TIMEOUT", str(self.timeout_seconds))),
        }
        
        return env_vars
    
    def get_connection_string(self) -> str:
        """データベース接続文字列取得
        
        Returns:
            str: データベース接続文字列
            
        Raises:
            ValueError: 接続情報が不足している場合
        """
        if self.db_url:
            return self.db_url
            
        # 環境変数からデータベースURLを構築
        if self.env_vars and self.env_vars.get("DATABASE_URL"):
            return self.env_vars["DATABASE_URL"]
        
        # SupabaseのURLから構築
        supabase_url = self.env_vars.get("SUPABASE_URL")
        if supabase_url:
            # SupabaseのHTTP URLをPostgreSQL URLに変換
            # https://xxx.supabase.co -> postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
            import re
            match = re.match(r'https://([^.]+)\.supabase\.co', supabase_url)
            if match:
                project_id = match.group(1)
                # 実際の環境では、パスワードは環境変数から取得する必要があります
                db_password = os.getenv("SUPABASE_DB_PASSWORD", "password")
                return f"postgresql://postgres:{db_password}@db.{project_id}.supabase.co:5432/postgres"
        
        raise ValueError("データベース接続情報が不足しています。DATABASE_URLまたはSUPABASE_URLを設定してください。")
    
    def get_migration_path(self) -> Path:
        """マイグレーションディレクトリパス取得
        
        Returns:
            Path: マイグレーションディレクトリのパス
        """
        migration_dir = self.env_vars.get("MIGRATION_DIR", self.migration_dir)
        
        # プロジェクトルートからの相対パスを解決
        if not os.path.isabs(migration_dir):
            # backendディレクトリから見たプロジェクトルート
            project_root = Path(__file__).parent.parent.parent
            return project_root / migration_dir
        
        return Path(migration_dir)
    
    def set_environment(self, env: str) -> None:
        """環境切替
        
        Args:
            env (str): 環境名 (dev, test, prod)
            
        Raises:
            ValueError: 無効な環境名の場合
        """
        valid_environments = ["dev", "test", "prod"]
        if env not in valid_environments:
            raise ValueError(f"無効な環境名です: {env}. 有効な値: {valid_environments}")
        
        self.environment = env
        self.env_vars = self.load_env_vars()
        self._load_environment_config()
        self._validate_config()
        
        logging.info(f"Environment switched to: {env}")
    
    def _get_env_file_path(self) -> Path:
        """環境ファイルパス取得
        
        Returns:
            Path: 環境ファイルのパス
        """
        # 環境別の.envファイルを探す
        config_dir = Path(__file__).parent.parent / "config" / "environments"
        env_files = [
            config_dir / f"{self.environment}.env",
            Path(f".env.{self.environment}"),
            Path(".env")
        ]
        
        for env_file in env_files:
            if env_file.exists():
                return env_file
        
        # デフォルトの.envファイル
        return Path(".env")
    
    def _load_environment_config(self) -> None:
        """環境別設定読み込み
        
        環境に応じて設定値を調整します。
        """
        if self.environment == "test":
            # テスト環境の設定
            self.history_table = "test_migration_history"
            self.auto_rollback = True
            self.timeout_seconds = 60
            
        elif self.environment == "prod":
            # 本番環境の設定
            self.auto_rollback = False  # 本番では自動ロールバックを無効
            self.timeout_seconds = 600  # より長いタイムアウト
            
        elif self.environment == "dev":
            # 開発環境の設定（デフォルト値を使用）
            pass
        
        # 環境変数による上書き
        if self.env_vars:
            self.migration_dir = self.env_vars.get("MIGRATION_DIR", self.migration_dir)
            self.history_table = self.env_vars.get("MIGRATION_HISTORY_TABLE", self.history_table)
            self.auto_rollback = self.env_vars.get("AUTO_ROLLBACK", self.auto_rollback)
            self.timeout_seconds = self.env_vars.get("MIGRATION_TIMEOUT", self.timeout_seconds)
    
    def _validate_config(self) -> bool:
        """設定値検証
        
        Returns:
            bool: 設定が有効な場合True
            
        Raises:
            ValueError: 無効な設定値がある場合
        """
        # 必須設定の検証
        if not self.history_table:
            raise ValueError("履歴テーブル名が設定されていません")
        
        if self.timeout_seconds <= 0:
            raise ValueError("タイムアウト時間は正の値である必要があります")
        
        # マイグレーションディレクトリの存在確認
        migration_path = self.get_migration_path()
        if not migration_path.exists():
            logging.warning(f"マイグレーションディレクトリが存在しません: {migration_path}")
            # ディレクトリを作成
            migration_path.mkdir(parents=True, exist_ok=True)
            logging.info(f"マイグレーションディレクトリを作成しました: {migration_path}")
        
        # データベース接続の検証（接続文字列の取得を試行）
        try:
            self.get_connection_string()
        except ValueError as e:
            logging.error(f"データベース接続設定エラー: {e}")
            if self.environment == "prod":
                raise  # 本番環境では例外を再発生
            else:
                logging.warning("開発/テスト環境のため、データベース接続エラーを無視します")
        
        logging.info(f"Migration configuration validated for environment: {self.environment}")
        return True
    
    def get_supabase_client_config(self) -> Dict[str, str]:
        """Supabaseクライアント設定取得
        
        Returns:
            Dict[str, str]: Supabaseクライアント用の設定
            
        Raises:
            ValueError: Supabase設定が不足している場合
        """
        if not self.env_vars:
            raise ValueError("環境変数が読み込まれていません")
        
        supabase_url = self.env_vars.get("SUPABASE_URL")
        supabase_key = self.env_vars.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが必要です")
        
        return {
            "url": supabase_url,
            "key": supabase_key
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """設定を辞書形式で取得
        
        Returns:
            Dict[str, Any]: 設定の辞書表現
        """
        return {
            "environment": self.environment,
            "db_url": self.db_url,
            "migration_dir": self.migration_dir,
            "history_table": self.history_table,
            "auto_rollback": self.auto_rollback,
            "timeout_seconds": self.timeout_seconds,
            "migration_path": str(self.get_migration_path()),
        }
    
    def __str__(self) -> str:
        """文字列表現
        
        Returns:
            str: 設定の文字列表現
        """
        return f"MigrationConfig(env={self.environment}, table={self.history_table})"


# 環境別のデフォルト設定ファクトリ関数
def create_dev_config() -> MigrationConfig:
    """開発環境用設定作成
    
    Returns:
        MigrationConfig: 開発環境用設定
    """
    return MigrationConfig(environment="dev")


def create_test_config() -> MigrationConfig:
    """テスト環境用設定作成
    
    Returns:
        MigrationConfig: テスト環境用設定
    """
    return MigrationConfig(environment="test")


def create_prod_config() -> MigrationConfig:
    """本番環境用設定作成
    
    Returns:
        MigrationConfig: 本番環境用設定
    """
    return MigrationConfig(environment="prod")