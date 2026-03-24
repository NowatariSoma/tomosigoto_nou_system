"""
StageRepository - データアクセス層の実装
stagesテーブルに対する基本的な操作を提供
"""

import logging
from typing import Any
from uuid import UUID

from app.core.database import Conn

logger = logging.getLogger(__name__)


class StageRepository:
    """
    ステージデータへのアクセスを管理するリポジトリクラス
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "stages"

    def find_by_id(self, stage_id: UUID) -> dict[str, Any] | None:
        """
        IDでステージを取得

        Args:
            stage_id: ステージID

        Returns:
            ステージ情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM stages WHERE id = %s",
            (str(stage_id),),
        ).fetchone()
        if row:
            logger.info(f"Found stage with id: {stage_id}")
            return dict(row)

        logger.info(f"Stage not found with id: {stage_id}")
        return None

    def find_all(self) -> list[dict[str, Any]]:
        """
        すべてのステージを取得（作成日時の降順）

        Returns:
            ステージ情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM stages ORDER BY created_at DESC"
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} stages")
        return data

    def create(self, stage_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しいステージを作成

        Args:
            stage_data: ステージ情報

        Returns:
            作成されたステージ情報
        """
        columns = list(stage_data.keys())
        values = [stage_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO stages ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Stage created successfully: {dict(row).get('id', 'unknown')}")
            return dict(row)

        logger.error("Failed to create stage")
        return {}

    def update(self, stage_id: UUID, stage_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        ステージ情報を更新

        Args:
            stage_id: ステージID
            stage_data: 更新するデータ

        Returns:
            更新されたステージ情報、見つからない場合はNone
        """
        if not stage_data:
            return self.find_by_id(stage_id)
        set_clause = ", ".join([f"{k} = %s" for k in stage_data.keys()])
        values = list(stage_data.values()) + [str(stage_id)]
        cur = self.conn.execute(
            f"UPDATE stages SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Stage updated successfully: {stage_id}")
            return dict(row)

        logger.warning(f"Stage not found for update: {stage_id}")
        return None

    def delete(self, stage_id: UUID) -> bool:
        """
        ステージを削除

        Args:
            stage_id: ステージID

        Returns:
            削除成功時True
        """
        self.conn.execute("DELETE FROM stages WHERE id = %s", (str(stage_id),))
        self.conn.commit()
        logger.info(f"Stage deleted successfully: {stage_id}")
        return True

    def find_by_status(self, status: str) -> list[dict[str, Any]]:
        """
        ステータスでステージを絞り込み取得

        Args:
            status: ステータス (active/inactive)

        Returns:
            ステージ情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM stages WHERE status = %s ORDER BY created_at DESC",
            (status,),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} stages with status: {status}")
        return data

    def exists(self, stage_id: UUID) -> bool:
        """
        ステージの存在確認

        Args:
            stage_id: ステージID

        Returns:
            存在する場合True
        """
        row = self.conn.execute(
            "SELECT id FROM stages WHERE id = %s LIMIT 1",
            (str(stage_id),),
        ).fetchone()
        exists = row is not None
        logger.info(f"Stage {stage_id} exists: {exists}")
        return exists
