"""
AccountSettingHistoryRepository - アカウント設定変更履歴データアクセス層の実装
account_setting_historyテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any

from app.core.database import Conn

logger = logging.getLogger(__name__)


class AccountSettingHistoryRepository:
    """
    アカウント設定変更履歴データへのアクセスを管理するリポジトリクラス
    account_setting_historyテーブルのすべてのデータベース操作をカプセル化
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "account_setting_history"

    def create_history_record(self, history_data: dict[str, Any]) -> dict[str, Any]:
        """
        アカウント設定変更履歴を作成

        Args:
            history_data: 履歴情報

        Returns:
            作成された履歴情報
        """
        columns = list(history_data.keys())
        values = [history_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO account_setting_history ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Account setting history record created for user: {history_data.get('user_id', 'unknown')}")
            return dict(row)

        logger.error(f"Failed to create account setting history record for user: {history_data.get('user_id', 'unknown')}")
        return {}

    def get_history_by_user_id(self, user_id: str, limit: int = 50) -> list[dict[str, Any]]:
        """
        ユーザーIDでアカウント設定変更履歴を取得

        Args:
            user_id: ユーザーID
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM account_setting_history WHERE user_id = %s ORDER BY changed_at DESC LIMIT %s",
            (str(user_id), limit),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} history records for user: {user_id}")
        return data

    def get_history_by_field(self, user_id: str, field_name: str, limit: int = 20) -> list[dict[str, Any]]:
        """
        特定フィールドの変更履歴を取得

        Args:
            user_id: ユーザーID
            field_name: フィールド名
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM account_setting_history WHERE user_id = %s AND field_name = %s ORDER BY changed_at DESC LIMIT %s",
            (str(user_id), field_name, limit),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} history records for field {field_name} and user: {user_id}")
        return data

    def get_history_by_id(self, history_id: str) -> dict[str, Any] | None:
        """
        履歴IDで変更履歴を取得

        Args:
            history_id: 履歴ID

        Returns:
            履歴情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM account_setting_history WHERE id = %s",
            (str(history_id),),
        ).fetchone()
        if row:
            logger.info(f"Found history record with id: {history_id}")
            return dict(row)

        logger.info(f"History record not found with id: {history_id}")
        return None

    def update_history_record(self, history_id: str, history_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        変更履歴を更新

        Args:
            history_id: 履歴ID
            history_data: 更新するデータ

        Returns:
            更新された履歴情報、見つからない場合はNone
        """
        if not history_data:
            return self.get_history_by_id(history_id)
        set_clause = ", ".join([f"{k} = %s" for k in history_data.keys()])
        values = list(history_data.values()) + [str(history_id)]
        cur = self.conn.execute(
            f"UPDATE account_setting_history SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"History record updated successfully: {history_id}")
            return dict(row)

        logger.warning(f"History record not found for update: {history_id}")
        return None

    def delete_history_record(self, history_id: str) -> bool:
        """
        変更履歴を削除

        Args:
            history_id: 履歴ID

        Returns:
            削除成功時True
        """
        self.conn.execute(
            "DELETE FROM account_setting_history WHERE id = %s",
            (str(history_id),),
        )
        self.conn.commit()
        logger.info(f"History record deleted successfully: {history_id}")
        return True

    def delete_history_by_user_id(self, user_id: str) -> bool:
        """
        ユーザーのすべての変更履歴を削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功時True
        """
        self.conn.execute(
            "DELETE FROM account_setting_history WHERE user_id = %s",
            (str(user_id),),
        )
        self.conn.commit()
        logger.info(f"All history records deleted for user: {user_id}")
        return True

    def get_history_count(self) -> int:
        """
        履歴数を取得

        Returns:
            履歴数
        """
        row = self.conn.execute("SELECT COUNT(*) AS cnt FROM account_setting_history").fetchone()
        count = row["cnt"] if row else 0
        logger.info(f"Total history records count: {count}")
        return count

    def get_recent_changes(self, limit: int = 100) -> list[dict[str, Any]]:
        """
        最近の変更履歴を取得

        Args:
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM account_setting_history ORDER BY changed_at DESC LIMIT %s",
            (limit,),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} recent history records")
        return data
