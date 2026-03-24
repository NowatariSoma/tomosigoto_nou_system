"""
MemberAssignmentRepository - データアクセス層の実装
member_assignmentsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any
from uuid import UUID

from app.core.database import Conn

logger = logging.getLogger(__name__)


class MemberAssignmentRepository:
    """
    メンバー所属データへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "member_assignments"

    def find_all(self) -> list[dict[str, Any]]:
        """
        すべてのメンバー所属を取得

        Returns:
            メンバー所属情報のリスト
        """
        rows = self.conn.execute("SELECT * FROM member_assignments").fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} member assignments in {self.table_name} table")
        return data

    def find_by_id(self, assignment_id: UUID) -> dict[str, Any] | None:
        """
        IDでメンバー所属を取得

        Args:
            assignment_id: メンバー所属ID

        Returns:
            メンバー所属情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM member_assignments WHERE id = %s",
            (str(assignment_id),),
        ).fetchone()
        if row:
            logger.info(f"Found member assignment with id: {assignment_id}")
            return dict(row)

        logger.info(f"Member assignment not found with id: {assignment_id}")
        return None

    def find_by_part_id(self, part_id: UUID) -> list[dict[str, Any]]:
        """
        パートIDでメンバー所属を取得

        Args:
            part_id: パートID

        Returns:
            メンバー所属情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM member_assignments WHERE part_id = %s ORDER BY display_order",
            (str(part_id),),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} member assignments for part: {part_id}")
        return data

    def find_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        """
        ユーザーIDでメンバー所属を取得

        Args:
            user_id: ユーザーID

        Returns:
            メンバー所属情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM member_assignments WHERE user_id = %s ORDER BY created_at",
            (str(user_id),),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} member assignments for user: {user_id}")
        return data

    def find_by_user_and_part(self, user_id: UUID, part_id: UUID) -> dict[str, Any] | None:
        """
        ユーザーIDとパートIDでメンバー所属を取得

        Args:
            user_id: ユーザーID
            part_id: パートID

        Returns:
            メンバー所属情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM member_assignments WHERE user_id = %s AND part_id = %s",
            (str(user_id), str(part_id)),
        ).fetchone()
        if row:
            logger.info(f"Found member assignment for user: {user_id}, part: {part_id}")
            return dict(row)

        logger.info(f"Member assignment not found for user: {user_id}, part: {part_id}")
        return None

    def find_with_details(
        self,
        assignment_id: UUID | None = None,
        part_id: UUID | None = None,
        user_id: UUID | None = None,
    ) -> list[dict[str, Any]]:
        """
        詳細情報付きでメンバー所属を取得

        Args:
            assignment_id: メンバー所属ID（オプション）
            part_id: パートID（オプション）
            user_id: ユーザーID（オプション）

        Returns:
            詳細情報付きメンバー所属情報のリスト
        """
        conditions = []
        params: list[Any] = []

        if assignment_id:
            conditions.append("ma.id = %s")
            params.append(str(assignment_id))
        if part_id:
            conditions.append("ma.part_id = %s")
            params.append(str(part_id))
        if user_id:
            conditions.append("ma.user_id = %s")
            params.append(str(user_id))

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        rows = self.conn.execute(
            f"""
            SELECT ma.*,
                   u.email AS user_email,
                   p.name AS part_name, p.description AS part_description,
                   s.name AS stage_name, s.description AS stage_description
            FROM member_assignments ma
            LEFT JOIN users u ON ma.user_id = u.id
            LEFT JOIN parts p ON ma.part_id = p.id
            LEFT JOIN stages s ON p.stage_id = s.id
            {where_clause}
            ORDER BY ma.display_order
            """,
            params,
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} detailed member assignments")
        return data

    def create(self, assignment_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しいメンバー所属をデータベースに作成

        Args:
            assignment_data: メンバー所属情報

        Returns:
            作成されたメンバー所属情報
        """
        columns = list(assignment_data.keys())
        values = [assignment_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO member_assignments ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(
                f"Member assignment created successfully: user_id={assignment_data.get('user_id', 'unknown')}, part_id={assignment_data.get('part_id', 'unknown')}"
            )
            return dict(row)

        logger.error(f"Failed to create member assignment: {assignment_data}")
        return {}

    def update(self, assignment_id: UUID, assignment_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        メンバー所属情報を更新

        Args:
            assignment_id: メンバー所属ID
            assignment_data: 更新するデータ

        Returns:
            更新されたメンバー所属情報、見つからない場合はNone
        """
        if not assignment_data:
            return self.find_by_id(assignment_id)
        set_clause = ", ".join([f"{k} = %s" for k in assignment_data.keys()])
        values = list(assignment_data.values()) + [str(assignment_id)]
        cur = self.conn.execute(
            f"UPDATE member_assignments SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Member assignment updated successfully: {assignment_id}")
            return dict(row)

        logger.warning(f"Member assignment not found for update: {assignment_id}")
        return None

    def delete(self, assignment_id: UUID) -> bool:
        """
        メンバー所属を削除

        Args:
            assignment_id: メンバー所属ID

        Returns:
            削除成功時True
        """
        self.conn.execute(
            "DELETE FROM member_assignments WHERE id = %s",
            (str(assignment_id),),
        )
        self.conn.commit()
        logger.info(f"Member assignment deleted successfully: {assignment_id}")
        return True

    def delete_by_user_and_part(self, user_id: UUID, part_id: UUID) -> bool:
        """
        ユーザーIDとパートIDでメンバー所属を削除

        Args:
            user_id: ユーザーID
            part_id: パートID

        Returns:
            削除成功時True
        """
        self.conn.execute(
            "DELETE FROM member_assignments WHERE user_id = %s AND part_id = %s",
            (str(user_id), str(part_id)),
        )
        self.conn.commit()
        logger.info(f"Member assignment deleted successfully: user_id={user_id}, part_id={part_id}")
        return True

    def count(self) -> int:
        """
        メンバー所属数を取得

        Returns:
            メンバー所属数
        """
        row = self.conn.execute("SELECT COUNT(*) AS cnt FROM member_assignments").fetchone()
        count = row["cnt"] if row else 0
        logger.info(f"Total member assignments count: {count}")
        return count
