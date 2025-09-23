"""
AccountSettingHistoryRepository - アカウント設定変更履歴データアクセス層の実装
account_setting_historyテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any, Dict, List, Optional

from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class AccountSettingHistoryRepository:
    """
    アカウント設定変更履歴データへのアクセスを管理するリポジトリクラス
    account_setting_historyテーブルのすべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "account_setting_history"

    @handle_supabase_errors("create_history_record")
    async def create_history_record(self, history_data: dict) -> Dict[str, Any]:
        """
        アカウント設定変更履歴を作成

        Args:
            history_data: 履歴情報

        Returns:
            作成された履歴情報
        """
        response = self.client.table(self.table_name).insert(history_data).execute()
        if response.data:
            logger.info(f"Account setting history record created for user: {history_data.get('user_id', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create account setting history record for user: {history_data.get('user_id', 'unknown')}")
        return {}

    @handle_supabase_errors("get_history_by_user_id")
    async def get_history_by_user_id(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        ユーザーIDでアカウント設定変更履歴を取得

        Args:
            user_id: ユーザーID
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
            .order("changed_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} history records for user: {user_id}")
        return data

    @handle_supabase_errors("get_history_by_field")
    async def get_history_by_field(self, user_id: str, field_name: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        特定フィールドの変更履歴を取得

        Args:
            user_id: ユーザーID
            field_name: フィールド名
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
            .eq("field_name", field_name)
            .order("changed_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} history records for field {field_name} and user: {user_id}")
        return data

    @handle_supabase_errors("get_history_by_id")
    async def get_history_by_id(self, history_id: str) -> Optional[Dict[str, Any]]:
        """
        履歴IDで変更履歴を取得

        Args:
            history_id: 履歴ID

        Returns:
            履歴情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("id", history_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found history record with id: {history_id}")
            return response.data[0]

        logger.info(f"History record not found with id: {history_id}")
        return None

    @handle_supabase_errors("update_history_record")
    async def update_history_record(self, history_id: str, history_data: dict) -> Optional[Dict[str, Any]]:
        """
        変更履歴を更新

        Args:
            history_id: 履歴ID
            history_data: 更新するデータ

        Returns:
            更新された履歴情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(history_data)
            .eq("id", history_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"History record updated successfully: {history_id}")
            return response.data[0]

        logger.warning(f"History record not found for update: {history_id}")
        return None

    @handle_supabase_errors("delete_history_record")
    async def delete_history_record(self, history_id: str) -> bool:
        """
        変更履歴を削除

        Args:
            history_id: 履歴ID

        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq("id", history_id).execute()
        logger.info(f"History record deleted successfully: {history_id}")
        return True

    @handle_supabase_errors("delete_history_by_user_id")
    async def delete_history_by_user_id(self, user_id: str) -> bool:
        """
        ユーザーのすべての変更履歴を削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq("user_id", user_id).execute()
        logger.info(f"All history records deleted for user: {user_id}")
        return True

    @handle_supabase_errors("get_history_count")
    async def get_history_count(self) -> int:
        """
        履歴数を取得

        Returns:
            履歴数
        """
        response = (
            self.client.table(self.table_name)
            .select("id", count="exact")
            .execute()
        )
        count = response.count if hasattr(response, "count") else 0
        logger.info(f"Total history records count: {count}")
        return count

    @handle_supabase_errors("get_recent_changes")
    async def get_recent_changes(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        最近の変更履歴を取得

        Args:
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .order("changed_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} recent history records")
        return data
