"""
DepartmentRepository - 学部データアクセス層の実装
departmentsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any

from app.core.database import Conn

logger = logging.getLogger(__name__)


class DepartmentRepository:
    """
    学部データへのアクセスを管理するリポジトリクラス
    departmentsテーブルのすべてのデータベース操作をカプセル化
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "departments"

    def get_all_departments(self) -> list[dict[str, Any]]:
        """
        すべての学部を取得

        Returns:
            学部情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM departments WHERE is_active = TRUE ORDER BY department_code"
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} active departments")
        return data

    def get_department_by_code(self, department_code: str) -> dict[str, Any] | None:
        """
        学部コードで学部を取得

        Args:
            department_code: 学部コード

        Returns:
            学部情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM departments WHERE department_code = %s AND is_active = TRUE",
            (department_code,),
        ).fetchone()
        if row:
            logger.info(f"Found department with code: {department_code}")
            return dict(row)

        logger.info(f"Department not found with code: {department_code}")
        return None

    def get_department_by_id(self, department_id: str) -> dict[str, Any] | None:
        """
        学部IDで学部を取得

        Args:
            department_id: 学部ID

        Returns:
            学部情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM departments WHERE id = %s AND is_active = TRUE",
            (str(department_id),),
        ).fetchone()
        if row:
            logger.info(f"Found department with id: {department_id}")
            return dict(row)

        logger.info(f"Department not found with id: {department_id}")
        return None

    def create_department(self, department_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しい学部を作成

        Args:
            department_data: 学部情報

        Returns:
            作成された学部情報
        """
        columns = list(department_data.keys())
        values = [department_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO departments ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Department created successfully: {department_data.get('department_code', 'unknown')}")
            return dict(row)

        logger.error(f"Failed to create department: {department_data.get('department_code', 'unknown')}")
        return {}

    def update_department(self, department_id: str, department_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        学部を更新

        Args:
            department_id: 学部ID
            department_data: 更新するデータ

        Returns:
            更新された学部情報、見つからない場合はNone
        """
        if not department_data:
            return self.get_department_by_id(department_id)
        set_clause = ", ".join([f"{k} = %s" for k in department_data.keys()])
        values = list(department_data.values()) + [str(department_id)]
        cur = self.conn.execute(
            f"UPDATE departments SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Department updated successfully: {department_id}")
            return dict(row)

        logger.warning(f"Department not found for update: {department_id}")
        return None

    def delete_department(self, department_id: str) -> bool:
        """
        学部を削除（論理削除）

        Args:
            department_id: 学部ID

        Returns:
            削除成功時True
        """
        cur = self.conn.execute(
            "UPDATE departments SET is_active = FALSE WHERE id = %s RETURNING id",
            (str(department_id),),
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Department deactivated successfully: {department_id}")
            return True

        logger.warning(f"Department not found for deactivation: {department_id}")
        return False

    def get_departments_by_campus(self, campus: str) -> list[dict[str, Any]]:
        """
        キャンパスで学部一覧を取得

        Args:
            campus: キャンパス名

        Returns:
            学部情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM departments WHERE campus = %s AND is_active = TRUE ORDER BY department_code",
            (campus,),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} departments for campus: {campus}")
        return data

    def get_department_count(self) -> int:
        """
        学部数を取得

        Returns:
            学部数
        """
        row = self.conn.execute(
            "SELECT COUNT(*) AS cnt FROM departments WHERE is_active = TRUE"
        ).fetchone()
        count = row["cnt"] if row else 0
        logger.info(f"Total active departments count: {count}")
        return count
