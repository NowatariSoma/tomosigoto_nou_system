"""
StageRepository - データアクセス層の実装
Supabaseのstagesテーブルに対する基本的な操作を提供
"""

import logging
from typing import Any
from uuid import UUID

from app.core.exceptions import handle_supabase_errors

from supabase import Client

logger = logging.getLogger(__name__)


class StageRepository:
    """
    ステージデータへのアクセスを管理するリポジトリクラス
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "stages"

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, stage_id: UUID) -> dict[str, Any] | None:
        """
        IDでステージを取得

        Args:
            stage_id: ステージID

        Returns:
            ステージ情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name).select("*").eq("id", str(stage_id)).execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found stage with id: {stage_id}")
            return response.data[0]

        logger.info(f"Stage not found with id: {stage_id}")
        return None

    @handle_supabase_errors("find_all")
    async def find_all(self) -> list[dict[str, Any]]:
        """
        すべてのステージを取得（作成日時の降順）

        Returns:
            ステージ情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} stages")
        return data

    @handle_supabase_errors("create")
    async def create(self, stage_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しいステージを作成

        Args:
            stage_data: ステージ情報

        Returns:
            作成されたステージ情報
        """
        response = self.client.table(self.table_name).insert(stage_data).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Stage created successfully: {response.data[0].get('id', 'unknown')}")
            return response.data[0]

        logger.error("Failed to create stage")
        return {}

    @handle_supabase_errors("update")
    async def update(self, stage_id: UUID, stage_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        ステージ情報を更新

        Args:
            stage_id: ステージID
            stage_data: 更新するデータ

        Returns:
            更新されたステージ情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(stage_data)
            .eq("id", str(stage_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Stage updated successfully: {stage_id}")
            return response.data[0]

        logger.warning(f"Stage not found for update: {stage_id}")
        return None

    @handle_supabase_errors("delete")
    async def delete(self, stage_id: UUID) -> bool:
        """
        ステージを削除

        Args:
            stage_id: ステージID

        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq("id", str(stage_id)).execute()
        logger.info(f"Stage deleted successfully: {stage_id}")
        return True

    @handle_supabase_errors("find_by_status")
    async def find_by_status(self, status: str) -> list[dict[str, Any]]:
        """
        ステータスでステージを絞り込み取得

        Args:
            status: ステータス (active/inactive)

        Returns:
            ステージ情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("status", status)
            .order("created_at", desc=True)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} stages with status: {status}")
        return data

    @handle_supabase_errors("exists")
    async def exists(self, stage_id: UUID) -> bool:
        """
        ステージの存在確認

        Args:
            stage_id: ステージID

        Returns:
            存在する場合True
        """
        response = (
            self.client.table(self.table_name)
            .select("id")
            .eq("id", str(stage_id))
            .limit(1)
            .execute()
        )
        exists = response.data and len(response.data) > 0
        logger.info(f"Stage {stage_id} exists: {exists}")
        return exists
