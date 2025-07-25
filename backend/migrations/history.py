"""
マイグレーション履歴管理モジュール

マイグレーション実行履歴の記録、取得、管理機能を提供します。
履歴テーブルの作成と管理も含みます。
"""
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import hashlib
import json

from supabase import create_client, Client

from .config import MigrationConfig


class MigrationRecord:
    """マイグレーション履歴レコードクラス
    
    単一のマイグレーション実行記録を表現します。
    """
    
    def __init__(self, data: Dict[str, Any]) -> None:
        """マイグレーションレコードを初期化
        
        Args:
            data (Dict[str, Any]): レコードデータ
        """
        self.migration_id: str = data.get("migration_id", "")
        self.version: str = data.get("version", "")
        self.name: str = data.get("name", "")
        self.success: bool = data.get("success", False)
        self.applied_at: datetime = data.get("applied_at", datetime.now())
        self.checksum: str = data.get("checksum", "")
        self.applied_by: str = data.get("applied_by", "system")
        self.duration_ms: int = data.get("duration_ms", 0)
        self.error_message: Optional[str] = data.get("error_message")
        self.rollback_info: Optional[str] = data.get("rollback_info")
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換
        
        Returns:
            Dict[str, Any]: レコードの辞書表現
        """
        return {
            "migration_id": self.migration_id,
            "version": self.version,
            "name": self.name,
            "success": self.success,
            "applied_at": self.applied_at.isoformat() if isinstance(self.applied_at, datetime) else self.applied_at,
            "checksum": self.checksum,
            "applied_by": self.applied_by,
            "duration_ms": self.duration_ms,
            "error_message": self.error_message,
            "rollback_info": self.rollback_info
        }
    
    def __str__(self) -> str:
        """文字列表現
        
        Returns:
            str: レコードの文字列表現
        """
        status = "SUCCESS" if self.success else "FAILED"
        return f"[{status}] {self.migration_id} ({self.name}) - {self.duration_ms}ms"


class HistoryManager:
    """マイグレーション履歴管理クラス
    
    マイグレーション実行履歴の記録と取得を管理します。
    Supabaseデータベースに履歴情報を保存します。
    """
    
    def __init__(self, config: MigrationConfig) -> None:
        """履歴管理を初期化
        
        Args:
            config (MigrationConfig): マイグレーション設定
        """
        self.config = config
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
            logging.info("Supabase connection initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize Supabase connection: {e}")
            raise
    
    def initialize_history_table(self) -> bool:
        """履歴テーブルを初期化
        
        Returns:
            bool: 初期化成功の場合True
        """
        try:
            # 履歴テーブル作成SQL
            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {self.config.history_table} (
                id SERIAL PRIMARY KEY,
                migration_id VARCHAR(255) NOT NULL UNIQUE,
                version VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                success BOOLEAN NOT NULL DEFAULT FALSE,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                checksum VARCHAR(64) NOT NULL,
                applied_by VARCHAR(100) DEFAULT 'system',
                duration_ms INTEGER DEFAULT 0,
                error_message TEXT,
                rollback_info TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- インデックス作成
            CREATE INDEX IF NOT EXISTS idx_{self.config.history_table}_migration_id 
                ON {self.config.history_table}(migration_id);
            CREATE INDEX IF NOT EXISTS idx_{self.config.history_table}_applied_at 
                ON {self.config.history_table}(applied_at);
            CREATE INDEX IF NOT EXISTS idx_{self.config.history_table}_success 
                ON {self.config.history_table}(success);
            """
            
            # RPC経由でSQLを実行
            result = self.connection.rpc('exec_sql', {'sql': create_table_sql}).execute()
            
            logging.info(f"History table '{self.config.history_table}' initialized successfully")
            return True
            
        except Exception as e:
            logging.error(f"Failed to initialize history table: {e}")
            raise
    
    def record_migration(self, migration_file: 'MigrationFile', success: bool, 
                        duration_ms: int = 0, error_message: Optional[str] = None) -> bool:
        """マイグレーション実行を記録
        
        Args:
            migration_file (MigrationFile): マイグレーションファイル
            success (bool): 実行成功フラグ
            duration_ms (int): 実行時間（ミリ秒）
            error_message (Optional[str]): エラーメッセージ
            
        Returns:
            bool: 記録成功の場合True
        """
        try:
            record_data = {
                "migration_id": migration_file.version,
                "version": migration_file.version,
                "name": migration_file.name,
                "success": success,
                "applied_at": datetime.now().isoformat(),
                "checksum": migration_file.get_checksum(),
                "applied_by": "migration_system",
                "duration_ms": duration_ms,
                "error_message": error_message
            }
            
            # レコードを挿入（重複の場合は更新）
            result = self.connection.table(self.config.history_table).upsert(
                record_data,
                on_conflict="migration_id"
            ).execute()
            
            logging.info(f"Migration record saved: {migration_file.version} (success: {success})")
            return True
            
        except Exception as e:
            logging.error(f"Failed to record migration: {e}")
            return False
    
    def get_migration_history(self, limit: Optional[int] = None) -> List[MigrationRecord]:
        """マイグレーション履歴を取得
        
        Args:
            limit (Optional[int]): 取得件数制限
            
        Returns:
            List[MigrationRecord]: マイグレーション履歴リスト
        """
        try:
            query = self.connection.table(self.config.history_table).select("*").order("applied_at", desc=True)
            
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            
            # レコードをMigrationRecordオブジェクトに変換
            records = []
            for row in result.data:
                # applied_atが文字列の場合は日時に変換
                if isinstance(row.get("applied_at"), str):
                    row["applied_at"] = datetime.fromisoformat(row["applied_at"].replace('Z', '+00:00'))
                
                records.append(self._format_record(row))
            
            logging.info(f"Retrieved {len(records)} migration history records")
            return records
            
        except Exception as e:
            logging.error(f"Failed to get migration history: {e}")
            return []
    
    def get_last_applied_migration(self) -> Optional[MigrationRecord]:
        """最後に適用されたマイグレーションを取得
        
        Returns:
            Optional[MigrationRecord]: 最新のマイグレーションレコード、なければNone
        """
        try:
            result = self.connection.table(self.config.history_table).select("*").eq(
                "success", True
            ).order("applied_at", desc=True).limit(1).execute()
            
            if result.data:
                row = result.data[0]
                # applied_atが文字列の場合は日時に変換
                if isinstance(row.get("applied_at"), str):
                    row["applied_at"] = datetime.fromisoformat(row["applied_at"].replace('Z', '+00:00'))
                
                return self._format_record(row)
            
            return None
            
        except Exception as e:
            logging.error(f"Failed to get last applied migration: {e}")
            return None
    
    def is_applied(self, migration_id: str) -> bool:
        """マイグレーションが適用済みかチェック
        
        Args:
            migration_id (str): マイグレーションID
            
        Returns:
            bool: 適用済みの場合True
        """
        try:
            result = self.connection.table(self.config.history_table).select(
                "id", count="exact"
            ).eq("migration_id", migration_id).eq("success", True).execute()
            
            return result.count > 0
            
        except Exception as e:
            logging.error(f"Failed to check if migration is applied: {e}")
            return False
    
    def clear_history(self) -> bool:
        """履歴をクリア
        
        Returns:
            bool: クリア成功の場合True
        """
        try:
            result = self.connection.table(self.config.history_table).delete().neq("id", 0).execute()
            
            logging.info("Migration history cleared successfully")
            return True
            
        except Exception as e:
            logging.error(f"Failed to clear migration history: {e}")
            return False
    
    def get_failed_migrations(self) -> List[MigrationRecord]:
        """失敗したマイグレーションを取得
        
        Returns:
            List[MigrationRecord]: 失敗マイグレーションリスト
        """
        try:
            result = self.connection.table(self.config.history_table).select("*").eq(
                "success", False
            ).order("applied_at", desc=True).execute()
            
            records = []
            for row in result.data:
                if isinstance(row.get("applied_at"), str):
                    row["applied_at"] = datetime.fromisoformat(row["applied_at"].replace('Z', '+00:00'))
                records.append(self._format_record(row))
            
            return records
            
        except Exception as e:
            logging.error(f"Failed to get failed migrations: {e}")
            return []
    
    def get_migration_statistics(self) -> Dict[str, Any]:
        """マイグレーション統計情報を取得
        
        Returns:
            Dict[str, Any]: 統計情報
        """
        try:
            # 成功・失敗・合計件数を取得
            total_result = self.connection.table(self.config.history_table).select(
                "id", count="exact"
            ).execute()
            
            success_result = self.connection.table(self.config.history_table).select(
                "id", count="exact"
            ).eq("success", True).execute()
            
            failed_result = self.connection.table(self.config.history_table).select(
                "id", count="exact"
            ).eq("success", False).execute()
            
            # 平均実行時間を計算
            avg_duration_result = self.connection.table(self.config.history_table).select(
                "duration_ms"
            ).eq("success", True).execute()
            
            avg_duration = 0
            if avg_duration_result.data:
                durations = [row["duration_ms"] for row in avg_duration_result.data if row["duration_ms"]]
                avg_duration = sum(durations) / len(durations) if durations else 0
            
            return {
                "total_migrations": total_result.count,
                "successful_migrations": success_result.count,
                "failed_migrations": failed_result.count,
                "success_rate": (success_result.count / total_result.count * 100) if total_result.count > 0 else 0,
                "average_duration_ms": round(avg_duration, 2)
            }
            
        except Exception as e:
            logging.error(f"Failed to get migration statistics: {e}")
            return {}
    
    def _format_record(self, record: Dict[str, Any]) -> MigrationRecord:
        """データベースレコードをMigrationRecordオブジェクトに変換
        
        Args:
            record (Dict[str, Any]): データベースレコード
            
        Returns:
            MigrationRecord: フォーマットされたレコード
        """
        return MigrationRecord(record)
    
    def export_history(self, format: str = "json") -> str:
        """履歴をエクスポート
        
        Args:
            format (str): エクスポート形式 ("json", "csv")
            
        Returns:
            str: エクスポートされたデータ
        """
        history = self.get_migration_history()
        
        if format.lower() == "json":
            return json.dumps([record.to_dict() for record in history], 
                            indent=2, ensure_ascii=False, default=str)
        elif format.lower() == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if history:
                fieldnames = history[0].to_dict().keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                for record in history:
                    writer.writerow(record.to_dict())
            
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported export format: {format}")


# 便利なヘルパー関数
def create_migration_record(migration_id: str, version: str, name: str, 
                          success: bool, duration_ms: int = 0, 
                          error_message: Optional[str] = None) -> MigrationRecord:
    """マイグレーションレコードを作成
    
    Args:
        migration_id (str): マイグレーションID
        version (str): バージョン
        name (str): マイグレーション名
        success (bool): 成功フラグ
        duration_ms (int): 実行時間
        error_message (Optional[str]): エラーメッセージ
        
    Returns:
        MigrationRecord: 作成されたレコード
    """
    data = {
        "migration_id": migration_id,
        "version": version,
        "name": name,
        "success": success,
        "applied_at": datetime.now(),
        "checksum": hashlib.md5(f"{migration_id}{name}".encode()).hexdigest(),
        "applied_by": "system",
        "duration_ms": duration_ms,
        "error_message": error_message
    }
    
    return MigrationRecord(data)