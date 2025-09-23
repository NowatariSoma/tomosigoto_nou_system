"""
StageRepository - データアクセス層の実装
Supabaseのstagesテーブルに対する基本的な操作を提供
"""

import logging
from typing import Any, Dict, Optional
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
    async def find_by_id(self, stage_id: UUID) -> Optional[Dict[str, Any]]:
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
