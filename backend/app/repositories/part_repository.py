"""
PartRepository - データアクセス層の実装
partsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any
from uuid import UUID

from app.core.database import Conn

logger = logging.getLogger(__name__)


class PartRepository:
    """
    パートデータへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.parts_table = "parts"
        self.member_assignments_table = "member_assignments"

    def find_all(self) -> list[dict[str, Any]]:
        """
        すべてのパートを取得

        Returns:
            パート情報のリスト
        """
        rows = self.conn.execute("SELECT * FROM parts").fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} parts in {self.parts_table} table")
        return data

    def find_by_id(self, part_id: UUID) -> dict[str, Any] | None:
        """
        IDでパートを取得

        Args:
            part_id: パートID

        Returns:
            パート情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM parts WHERE id = %s",
            (str(part_id),),
        ).fetchone()
        if row:
            logger.info(f"Found part with id: {part_id}")
            return dict(row)

        logger.info(f"Part not found with id: {part_id}")
        return None

    def find_by_name(self, part_name: str) -> dict[str, Any] | None:
        """
        パート名でパートを取得

        Args:
            part_name: パート名

        Returns:
            パート情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM parts WHERE name = %s",
            (part_name,),
        ).fetchone()
        if row:
            logger.info(f"Found part with name: {part_name}")
            return dict(row)

        logger.info(f"Part not found with name: {part_name}")
        return None

    def create(self, part_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しいパートをデータベースに作成

        Args:
            part_data: パート情報

        Returns:
            作成されたパート情報
        """
        columns = list(part_data.keys())
        values = [part_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO parts ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Part created successfully: {part_data.get('name', 'unknown')}")
            return dict(row)

        logger.error(f"Failed to create part: {part_data.get('name', 'unknown')}")
        return {}

    def update(self, part_id: UUID, part_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        パート情報を更新

        Args:
            part_id: パートID
            part_data: 更新するデータ

        Returns:
            更新されたパート情報、見つからない場合はNone
        """
        if not part_data:
            return self.find_by_id(part_id)
        set_clause = ", ".join([f"{k} = %s" for k in part_data.keys()])
        values = list(part_data.values()) + [str(part_id)]
        cur = self.conn.execute(
            f"UPDATE parts SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Part updated successfully: {part_id}")
            return dict(row)

        logger.warning(f"Part not found for update: {part_id}")
        return None

    def delete(self, part_id: UUID) -> bool:
        """
        パートを削除

        Args:
            part_id: パートID

        Returns:
            削除成功時True
        """
        self.conn.execute("DELETE FROM parts WHERE id = %s", (str(part_id),))
        self.conn.commit()
        logger.info(f"Part deleted successfully: {part_id}")
        return True

    def count(self) -> int:
        """
        パート数を取得

        Returns:
            パート数
        """
        row = self.conn.execute("SELECT COUNT(*) AS cnt FROM parts").fetchone()
        count = row["cnt"] if row else 0
        logger.info(f"Total parts count: {count}")
        return count

    def find_active(self) -> list[dict[str, Any]]:
        """
        アクティブなパートのみを取得

        Returns:
            アクティブなパート情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM parts WHERE status = %s",
            ("active",),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} active parts in {self.parts_table} table")
        return data

    def find_by_stage_id(self, stage_id: str) -> list[dict[str, Any]]:
        """
        指定されたstage_idに紐づくパートを取得

        Args:
            stage_id: 舞台ID

        Returns:
            指定された舞台に紐づくパート情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM parts WHERE stage_id = %s ORDER BY created_at ASC",
            (str(stage_id),),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} parts for stage_id: {stage_id}")
        return data
