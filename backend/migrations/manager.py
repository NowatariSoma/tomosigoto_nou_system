"""
マイグレーション実行管理モジュール

マイグレーションファイルの検出、実行、ロールバックなどの
メイン処理を管理します。
"""
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import hashlib
import time
import re

from supabase import create_client, Client

from .config import MigrationConfig
from .history import HistoryManager, MigrationRecord
from .version import VersionUtil


class MigrationFile:
    """マイグレーションファイルクラス
    
    単一のマイグレーションファイルを表現し、
    ファイルの読み込み、解析、検証機能を提供します。
    """
    
    def __init__(self, filename: str, migration_path: Optional[Path] = None) -> None:
        """マイグレーションファイルを初期化
        
        Args:
            filename (str): マイグレーションファイル名
            migration_path (Optional[Path]): マイグレーションディレクトリパス
        """
        self.filename = filename
        self.migration_path = migration_path or Path(".")
        self.version = VersionUtil.parse_version(filename) or ""
        self.name = self._extract_name_from_filename(filename)
        self.content: Optional[str] = None
        self.created_at = datetime.now()
        self.is_applied = False
        self._file_path = self.migration_path / filename
    
    def _extract_name_from_filename(self, filename: str) -> str:
        """ファイル名からマイグレーション名を抽出
        
        Args:
            filename (str): ファイル名
            
        Returns:
            str: マイグレーション名
        """
        # バージョン部分を除去してマイグレーション名を抽出
        # 例: "20250101000000_create_users.sql" -> "create_users"
        patterns = [
            r'^\d{14}_(.+)\.sql$',  # タイムスタンプ形式
            r'^v?\d+\.\d+\.\d+_(.+)\.sql$',  # セマンティックバージョン
            r'^\d{3,}_(.+)\.sql$',  # 連番形式
        ]
        
        for pattern in patterns:
            match = re.match(pattern, filename)
            if match:
                return match.group(1)
        
        # パターンに一致しない場合は拡張子を除去
        return os.path.splitext(filename)[0]
    
    def load_content(self) -> str:
        """ファイル内容を読み込み
        
        Returns:
            str: ファイル内容
            
        Raises:
            FileNotFoundError: ファイルが存在しない場合
            IOError: ファイル読み込みエラーの場合
        """
        try:
            with open(self._file_path, 'r', encoding='utf-8') as f:
                self.content = f.read()
            return self.content
        except FileNotFoundError:
            logging.error(f"Migration file not found: {self._file_path}")
            raise
        except IOError as e:
            logging.error(f"Failed to read migration file {self._file_path}: {e}")
            raise
    
    def parse_metadata(self) -> Dict[str, Any]:
        """マイグレーションメタデータを解析
        
        Returns:
            Dict[str, Any]: メタデータ辞書
        """
        if not self.content:
            self.load_content()
        
        metadata = {
            "version": self.version,
            "name": self.name,
            "filename": self.filename,
            "dependencies": self.get_dependencies(),
            "has_rollback": self.has_rollback(),
            "checksum": self.get_checksum()
        }
        
        # SQLコメントからメタデータを抽出
        if self.content:
            # -- Description: の形式でコメントを探す
            description_match = re.search(r'-- Description:\s*(.+)', self.content)
            if description_match:
                metadata["description"] = description_match.group(1).strip()
            
            # -- Author: の形式でコメントを探す
            author_match = re.search(r'-- Author:\s*(.+)', self.content)
            if author_match:
                metadata["author"] = author_match.group(1).strip()
        
        return metadata
    
    def get_checksum(self) -> str:
        """ファイル内容のチェックサムを計算
        
        Returns:
            str: MD5チェックサム
        """
        if not self.content:
            self.load_content()
        
        return hashlib.md5(self.content.encode('utf-8')).hexdigest()
    
    def get_dependencies(self) -> List[str]:
        """マイグレーションの依存関係を取得
        
        Returns:
            List[str]: 依存するマイグレーションIDのリスト
        """
        if not self.content:
            self.load_content()
        
        dependencies = []
        if self.content:
            # -- Depends: migration_id1, migration_id2 の形式で依存関係を記述
            depends_match = re.search(r'-- Depends:\s*(.+)', self.content)
            if depends_match:
                deps = depends_match.group(1).strip().split(',')
                dependencies = [dep.strip() for dep in deps if dep.strip()]
        
        return dependencies
    
    def has_rollback(self) -> bool:
        """ロールバック用SQLが含まれているかチェック
        
        Returns:
            bool: ロールバック用SQLがある場合True
        """
        if not self.content:
            self.load_content()
        
        if self.content:
            # -- ROLLBACK: または /* ROLLBACK セクションを探す
            return bool(re.search(r'-- ROLLBACK:|/\* ROLLBACK', self.content, re.IGNORECASE))
        
        return False
    
    def get_rollback_sql(self) -> Optional[str]:
        """ロールバック用SQLを取得
        
        Returns:
            Optional[str]: ロールバック用SQL、なければNone
        """
        if not self.content or not self.has_rollback():
            return None
        
        # -- ROLLBACK: 以降の内容を抽出
        rollback_match = re.search(r'-- ROLLBACK:\s*\n(.*)', self.content, re.DOTALL)
        if rollback_match:
            return rollback_match.group(1).strip()
        
        # /* ROLLBACK ... */ の内容を抽出
        rollback_match = re.search(r'/\* ROLLBACK\s+(.*?)\s+\*/', self.content, re.DOTALL | re.IGNORECASE)
        if rollback_match:
            return rollback_match.group(1).strip()
        
        return None
    
    def __str__(self) -> str:
        """文字列表現
        
        Returns:
            str: ファイルの文字列表現
        """
        return f"MigrationFile({self.filename}, version={self.version})"


class MigrationResult:
    """マイグレーション実行結果クラス"""
    
    def __init__(self, success: bool = True, applied_count: int = 0, 
                 rolled_back_count: int = 0, error_message: Optional[str] = None,
                 executed_migrations: Optional[List[str]] = None) -> None:
        """マイグレーション結果を初期化
        
        Args:
            success (bool): 実行成功フラグ
            applied_count (int): 適用されたマイグレーション数
            rolled_back_count (int): ロールバックされたマイグレーション数
            error_message (Optional[str]): エラーメッセージ
            executed_migrations (Optional[List[str]]): 実行されたマイグレーションのリスト
        """
        self.success = success
        self.applied_count = applied_count
        self.rolled_back_count = rolled_back_count
        self.error_message = error_message
        self.executed_migrations = executed_migrations or []
        self.execution_time = datetime.now()


class MigrationIssue:
    """マイグレーション問題クラス"""
    
    def __init__(self, migration_file: str, issue_type: str, message: str, 
                 severity: str = "error") -> None:
        """マイグレーション問題を初期化
        
        Args:
            migration_file (str): 問題のあるファイル名
            issue_type (str): 問題の種類
            message (str): 問題の詳細メッセージ
            severity (str): 重要度 (error, warning, info)
        """
        self.migration_file = migration_file
        self.issue_type = issue_type
        self.message = message
        self.severity = severity


class MigrationManager:
    """マイグレーション管理クラス
    
    マイグレーションファイルの検出、実行、ロールバック、
    検証などのメイン処理を管理します。
    """
    
    def __init__(self, config: MigrationConfig) -> None:
        """マイグレーション管理を初期化
        
        Args:
            config (MigrationConfig): マイグレーション設定
        """
        self.config = config
        self.history = HistoryManager(config)
        self.connection: Optional[Client] = None
        self._initialize_connection()
    
    def _initialize_connection(self) -> None:
        """Supabase接続を初期化"""
        try:
            supabase_config = self.config.get_supabase_client_config()
            self.connection = create_client(
                supabase_config["url"],
                supabase_config["key"]
            )
            logging.info("Migration manager connection initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize migration manager connection: {e}")
            raise
    
    def discover_migrations(self) -> List[MigrationFile]:
        """マイグレーションファイルを検出
        
        Returns:
            List[MigrationFile]: 検出されたマイグレーションファイルのリスト
        """
        migration_path = self.config.get_migration_path()
        
        if not migration_path.exists():
            logging.warning(f"Migration directory does not exist: {migration_path}")
            return []
        
        migrations = []
        for file_path in migration_path.glob("*.sql"):
            filename = file_path.name
            
            # バージョンが解析できるファイルのみを対象とする
            if VersionUtil.parse_version(filename):
                migration_file = MigrationFile(filename, migration_path)
                migrations.append(migration_file)
                logging.debug(f"Discovered migration: {filename}")
        
        # バージョン順にソート
        migrations.sort(key=lambda m: m.version)
        
        logging.info(f"Discovered {len(migrations)} migration files")
        return migrations
    
    def run_migrations(self, target_version: Optional[str] = None) -> MigrationResult:
        """マイグレーションを実行
        
        Args:
            target_version (Optional[str]): 実行するターゲットバージョン
            
        Returns:
            MigrationResult: 実行結果
        """
        try:
            # 履歴テーブルを初期化
            self.history.initialize_history_table()
            
            # マイグレーションファイルを検出
            migrations = self.discover_migrations()
            if not migrations:
                return MigrationResult(success=True, applied_count=0)
            
            executed_migrations = []
            applied_count = 0
            
            for migration in migrations:
                # ターゲットバージョンが指定されている場合、それを超えたら停止
                if target_version and VersionUtil.compare_versions(migration.version, target_version) > 0:
                    break
                
                # 既に適用済みの場合はスキップ
                if self.history.is_applied(migration.version):
                    logging.info(f"Migration {migration.version} already applied, skipping")
                    continue
                
                # 依存関係をチェック
                if not self._check_dependencies(migration):
                    error_msg = f"Dependencies not satisfied for migration {migration.version}"
                    logging.error(error_msg)
                    return MigrationResult(success=False, applied_count=applied_count, error_message=error_msg)
                
                # マイグレーションを実行
                if self._execute_migration(migration):
                    executed_migrations.append(migration.version)
                    applied_count += 1
                    logging.info(f"Successfully applied migration: {migration.version}")
                else:
                    error_msg = f"Failed to apply migration: {migration.version}"
                    logging.error(error_msg)
                    return MigrationResult(
                        success=False, 
                        applied_count=applied_count, 
                        error_message=error_msg,
                        executed_migrations=executed_migrations
                    )
            
            return MigrationResult(
                success=True, 
                applied_count=applied_count,
                executed_migrations=executed_migrations
            )
            
        except Exception as e:
            error_msg = f"Migration execution failed: {str(e)}"
            logging.error(error_msg)
            return MigrationResult(success=False, error_message=error_msg)
    
    def verify_migrations(self) -> List[MigrationIssue]:
        """マイグレーションファイルを検証
        
        Returns:
            List[MigrationIssue]: 検出された問題のリスト
        """
        issues = []
        migrations = self.discover_migrations()
        
        for migration in migrations:
            try:
                # ファイル内容を読み込み
                migration.load_content()
                
                # 基本的な検証
                if not migration.content.strip():
                    issues.append(MigrationIssue(
                        migration.filename, 
                        "empty_file", 
                        "Migration file is empty"
                    ))
                
                # SQL構文の基本チェック
                if not self._validate_sql_syntax(migration.content):
                    issues.append(MigrationIssue(
                        migration.filename,
                        "syntax_error",
                        "SQL syntax appears to be invalid"
                    ))
                
                # 依存関係の検証
                dependencies = migration.get_dependencies()
                for dep in dependencies:
                    if not self._migration_exists(dep, migrations):
                        issues.append(MigrationIssue(
                            migration.filename,
                            "missing_dependency",
                            f"Dependency '{dep}' not found",
                            severity="warning"
                        ))
                
            except Exception as e:
                issues.append(MigrationIssue(
                    migration.filename,
                    "file_error",
                    f"Failed to process file: {str(e)}"
                ))
        
        # バージョンの重複チェック
        versions = [m.version for m in migrations]
        duplicate_versions = set([v for v in versions if versions.count(v) > 1])
        for version in duplicate_versions:
            issues.append(MigrationIssue(
                "multiple_files",
                "duplicate_version",
                f"Version '{version}' is used by multiple files"
            ))
        
        logging.info(f"Migration verification completed: {len(issues)} issues found")
        return issues
    
    def rollback(self, steps: int = 1) -> MigrationResult:
        """指定ステップ数分ロールバック
        
        Args:
            steps (int): ロールバックするステップ数
            
        Returns:
            MigrationResult: ロールバック結果
        """
        try:
            # 適用済みマイグレーション履歴を取得（新しい順）
            history = self.history.get_migration_history()
            successful_migrations = [r for r in history if r.success]
            
            if not successful_migrations:
                return MigrationResult(success=True, rolled_back_count=0)
            
            rolled_back_count = 0
            rollback_limit = min(steps, len(successful_migrations))
            
            for i in range(rollback_limit):
                migration_record = successful_migrations[i]
                
                if self._execute_rollback(migration_record):
                    rolled_back_count += 1
                    logging.info(f"Successfully rolled back migration: {migration_record.migration_id}")
                else:
                    error_msg = f"Failed to rollback migration: {migration_record.migration_id}"
                    logging.error(error_msg)
                    return MigrationResult(
                        success=False, 
                        rolled_back_count=rolled_back_count, 
                        error_message=error_msg
                    )
            
            return MigrationResult(success=True, rolled_back_count=rolled_back_count)
            
        except Exception as e:
            error_msg = f"Rollback failed: {str(e)}"
            logging.error(error_msg)
            return MigrationResult(success=False, error_message=error_msg)
    
    def rollback_to(self, version: str) -> MigrationResult:
        """指定バージョンまでロールバック
        
        Args:
            version (str): ロールバック先のバージョン
            
        Returns:
            MigrationResult: ロールバック結果
        """
        try:
            # 適用済みマイグレーション履歴を取得
            history = self.history.get_migration_history()
            successful_migrations = [r for r in history if r.success]
            
            # ターゲットバージョンより新しいマイグレーションを特定
            to_rollback = []
            for record in successful_migrations:
                if VersionUtil.compare_versions(record.version, version) > 0:
                    to_rollback.append(record)
            
            if not to_rollback:
                return MigrationResult(success=True, rolled_back_count=0)
            
            rolled_back_count = 0
            
            for migration_record in to_rollback:
                if self._execute_rollback(migration_record):
                    rolled_back_count += 1
                    logging.info(f"Successfully rolled back migration: {migration_record.migration_id}")
                else:
                    error_msg = f"Failed to rollback migration: {migration_record.migration_id}"
                    logging.error(error_msg)
                    return MigrationResult(
                        success=False, 
                        rolled_back_count=rolled_back_count, 
                        error_message=error_msg
                    )
            
            return MigrationResult(success=True, rolled_back_count=rolled_back_count)
            
        except Exception as e:
            error_msg = f"Rollback to version {version} failed: {str(e)}"
            logging.error(error_msg)
            return MigrationResult(success=False, error_message=error_msg)
    
    def get_current_version(self) -> Optional[str]:
        """現在のマイグレーションバージョンを取得
        
        Returns:
            Optional[str]: 現在のバージョン、なければNone
        """
        last_migration = self.history.get_last_applied_migration()
        return last_migration.version if last_migration else None
    
    def create_migration(self, name: str, template: Optional[str] = None) -> MigrationFile:
        """新しいマイグレーションファイルを作成
        
        Args:
            name (str): マイグレーション名
            template (Optional[str]): テンプレート内容
            
        Returns:
            MigrationFile: 作成されたマイグレーションファイル
        """
        # バージョンを生成
        version = VersionUtil.generate_version()
        filename = f"{version}_{name}.sql"
        
        # ファイルパスを構成
        migration_path = self.config.get_migration_path()
        file_path = migration_path / filename
        
        # テンプレート内容を準備
        if not template:
            template = self._get_default_template(name)
        
        # ファイルを作成
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(template)
        
        migration_file = MigrationFile(filename, migration_path)
        migration_file.content = template
        
        logging.info(f"Created new migration file: {filename}")
        return migration_file
    
    def _execute_migration(self, migration: MigrationFile) -> bool:
        """マイグレーションを実行
        
        Args:
            migration (MigrationFile): 実行するマイグレーション
            
        Returns:
            bool: 実行成功の場合True
        """
        start_time = time.time()
        
        try:
            # ファイル内容を読み込み
            migration.load_content()
            
            # SQLを実行（Supabase RPC経由）
            result = self.connection.rpc('exec_sql', {'sql': migration.content}).execute()
            
            # 実行時間を計算
            duration_ms = int((time.time() - start_time) * 1000)
            
            # 履歴に記録
            self.history.record_migration(migration, success=True, duration_ms=duration_ms)
            
            return True
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            error_message = str(e)
            
            # エラーを履歴に記録
            self.history.record_migration(migration, success=False, 
                                        duration_ms=duration_ms, error_message=error_message)
            
            # エラー処理
            self._handle_migration_error(e, migration)
            
            return False
    
    def _execute_rollback(self, migration_record: MigrationRecord) -> bool:
        """ロールバックを実行
        
        Args:
            migration_record (MigrationRecord): ロールバック対象のマイグレーションレコード
            
        Returns:
            bool: ロールバック成功の場合True
        """
        try:
            # マイグレーションファイルを見つけてロールバックSQLを取得
            migrations = self.discover_migrations()
            migration_file = None
            
            for m in migrations:
                if m.version == migration_record.version:
                    migration_file = m
                    break
            
            if not migration_file:
                logging.error(f"Migration file not found for rollback: {migration_record.version}")
                return False
            
            # ロールバックSQLを取得
            rollback_sql = migration_file.get_rollback_sql()
            if not rollback_sql:
                logging.warning(f"No rollback SQL found for migration: {migration_record.version}")
                # ロールバックSQLがない場合は履歴から削除のみ行う
                return self._remove_from_history(migration_record.migration_id)
            
            # ロールバックSQLを実行
            result = self.connection.rpc('exec_sql', {'sql': rollback_sql}).execute()
            
            # 履歴から削除
            return self._remove_from_history(migration_record.migration_id)
            
        except Exception as e:
            logging.error(f"Rollback execution failed for {migration_record.migration_id}: {e}")
            return False
    
    def _remove_from_history(self, migration_id: str) -> bool:
        """履歴からマイグレーションレコードを削除
        
        Args:
            migration_id (str): 削除するマイグレーションID
            
        Returns:
            bool: 削除成功の場合True
        """
        try:
            result = self.connection.table(self.config.history_table).delete().eq(
                "migration_id", migration_id
            ).execute()
            
            return True
            
        except Exception as e:
            logging.error(f"Failed to remove migration from history: {e}")
            return False
    
    def _handle_migration_error(self, error: Exception, migration: MigrationFile) -> None:
        """マイグレーションエラーを処理
        
        Args:
            error (Exception): 発生したエラー
            migration (MigrationFile): エラーが発生したマイグレーション
        """
        logging.error(f"Migration error in {migration.filename}: {str(error)}")
        
        # 自動ロールバックが有効な場合
        if self.config.auto_rollback:
            logging.info("Attempting automatic rollback...")
            # 実装は簡略化（実際にはより詳細なロールバック処理が必要）
    
    def _check_dependencies(self, migration: MigrationFile) -> bool:
        """マイグレーションの依存関係をチェック
        
        Args:
            migration (MigrationFile): チェック対象のマイグレーション
            
        Returns:
            bool: 依存関係が満たされている場合True
        """
        dependencies = migration.get_dependencies()
        
        # 依存関係がない場合は常にTrue
        if not dependencies:
            return True
        
        # 各依存関係が適用済みかチェック
        for dep in dependencies:
            if not self.history.is_applied(dep):
                logging.error(f"Dependency '{dep}' is not applied for migration {migration.version}")
                return False
        
        return True
    
    def _validate_sql_syntax(self, sql: str) -> bool:
        """SQL構文の基本検証
        
        Args:
            sql (str): 検証対象のSQL
            
        Returns:
            bool: 構文が有効と思われる場合True
        """
        if not sql.strip():
            return False
        
        # 基本的なSQLキーワードの存在チェック
        sql_upper = sql.upper()
        sql_keywords = ['CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'SELECT']
        
        return any(keyword in sql_upper for keyword in sql_keywords)
    
    def _migration_exists(self, migration_id: str, migrations: List[MigrationFile]) -> bool:
        """指定されたマイグレーションが存在するかチェック
        
        Args:
            migration_id (str): チェック対象のマイグレーションID
            migrations (List[MigrationFile]): マイグレーションリスト
            
        Returns:
            bool: 存在する場合True
        """
        return any(m.version == migration_id for m in migrations)
    
    def _get_default_template(self, name: str) -> str:
        """デフォルトのマイグレーションテンプレートを取得
        
        Args:
            name (str): マイグレーション名
            
        Returns:
            str: テンプレート内容
        """
        return f"""-- Migration: {name}
-- Description: {name}の説明をここに記載
-- Author: system
-- Created: {datetime.now().isoformat()}

-- マイグレーション実行SQL
-- TODO: ここに実際のSQLを記載してください


-- ROLLBACK:
-- TODO: ロールバック用SQLを記載してください（オプション）
"""