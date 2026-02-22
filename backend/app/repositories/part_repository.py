"""
PartRepository - データアクセス層の実装
Supabaseのpartsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any
from uuid import UUID

from app.core.exceptions import handle_supabase_errors

from supabase import Client

logger = logging.getLogger(__name__)


class PartRepository:
    """
    パートデータへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.parts_table = "parts"
        self.member_assignments_table = "member_assignments"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> list[dict[str, Any]]:
        """
        すべてのパートを取得

        Returns:
            パート情報のリスト
        """
        response = self.client.table(self.parts_table).select("*").execute()
        data = response.data or []
        logger.info(f"Found {len(data)} parts in {self.parts_table} table")
        return data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, part_id: UUID) -> dict[str, Any] | None:
        """
        IDでパートを取得

        Args:
            part_id: パートID

        Returns:
            パート情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.parts_table).select("*").eq("id", str(part_id)).execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found part with id: {part_id}")
            return response.data[0]

        logger.info(f"Part not found with id: {part_id}")
        return None

    @handle_supabase_errors("find_by_name")
    async def find_by_name(self, part_name: str) -> dict[str, Any] | None:
        """
        パート名でパートを取得

        Args:
            part_name: パート名

        Returns:
            パート情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.parts_table).select("*").eq("name", part_name).execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found part with name: {part_name}")
            return response.data[0]

        logger.info(f"Part not found with name: {part_name}")
        return None

    @handle_supabase_errors("create")
    async def create(self, part_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しいパートをデータベースに作成

        Args:
            part_data: パート情報

        Returns:
            作成されたパート情報
        """
        response = self.client.table(self.parts_table).insert(part_data).execute()
        if response.data:
            logger.info(
                f"Part created successfully: {part_data.get('name', 'unknown')}"
            )
            return response.data[0]

        logger.error(f"Failed to create part: {part_data.get('name', 'unknown')}")
        return {}

    @handle_supabase_errors("update")
    async def update(self, part_id: UUID, part_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        パート情報を更新

        Args:
            part_id: パートID
            part_data: 更新するデータ

        Returns:
            更新されたパート情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.parts_table)
            .update(part_data)
            .eq("id", str(part_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Part updated successfully: {part_id}")
            return response.data[0]

        logger.warning(f"Part not found for update: {part_id}")
        return None

    @handle_supabase_errors("delete")
    async def delete(self, part_id: UUID) -> bool:
        """
        パートを削除

        Args:
            part_id: パートID

        Returns:
            削除成功時True
        """
        self.client.table(self.parts_table).delete().eq("id", str(part_id)).execute()
        logger.info(f"Part deleted successfully: {part_id}")
        return True

    @handle_supabase_errors("count")
    async def count(self) -> int:
        """
        パート数を取得

        Returns:
            パート数
        """
        response = (
            self.client.table(self.parts_table).select("id", count="exact").execute()
        )
        count = response.count if hasattr(response, "count") else 0
        logger.info(f"Total parts count: {count}")
        return count

    @handle_supabase_errors("find_active")
    async def find_active(self) -> list[dict[str, Any]]:
        """
        アクティブなパートのみを取得

        Returns:
            アクティブなパート情報のリスト
        """
        response = (
            self.client.table(self.parts_table)
            .select("*")
            .eq("status", "active")
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} active parts in {self.parts_table} table")
        return data

    @handle_supabase_errors("find_by_stage_id")
    async def find_by_stage_id(self, stage_id: str) -> list[dict[str, Any]]:
        """
        指定されたstage_idに紐づくパートを取得

        Args:
            stage_id: 舞台ID

        Returns:
            指定された舞台に紐づくパート情報のリスト
        """
        response = (
            self.client.table(self.parts_table)
            .select("*")
            .eq("stage_id", stage_id)
            .order("created_at", desc=False)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} parts for stage_id: {stage_id}")
        return data
