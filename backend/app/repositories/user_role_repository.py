import logging
from typing import Any

from app.core.database import Conn

logger = logging.getLogger(__name__)


class UserRoleRepository:
    """
    ユーザーロール関連のデータアクセスを処理するリポジトリクラス
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "user_roles"

    def get_role_by_user_id(self, user_id: str) -> dict[str, Any] | None:
        """
        ユーザーIDでユーザーロールを取得（user_roleテーブルからrole_typeを取得）

        Args:
            user_id: ユーザーID

        Returns:
            ロール情報（role_type: basic/admin/viewer/general）、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM user_roles WHERE user_id = %s LIMIT 1",
            (str(user_id),),
        ).fetchone()
        if row:
            logger.info(f"Found user role for user: {user_id}")
            return dict(row)

        logger.info(f"User role not found for user: {user_id}")
        return None

    def get_role_by_user_and_type(self, user_id: str, role_type: str) -> dict[str, Any] | None:
        """
        ユーザーIDとロール種別でロールを取得（user_roleテーブルから）
        """
        row = self.conn.execute(
            "SELECT * FROM user_roles WHERE user_id = %s AND role_type = %s LIMIT 1",
            (str(user_id), role_type),
        ).fetchone()
        if row:
            logger.info(f"Found {role_type} role for user: {user_id}")
            return dict(row)
        logger.info(f"{role_type} role not found for user: {user_id}")
        return None

    def create_role(self, role_data: dict[str, Any]) -> dict[str, Any]:
        """
        ユーザーロールを作成（user_roleテーブルに）

        Args:
            role_data: ロール情報（role_type: basic/admin/viewer/generalを含む）

        Returns:
            作成されたロール情報
        """
        columns = list(role_data.keys())
        values = [role_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO user_roles ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"User role created successfully for user: {role_data.get('user_id', 'unknown')}")
            return dict(row)

        logger.error(f"Failed to create user role for user: {role_data.get('user_id', 'unknown')}")
        return {}

    def update_role(self, user_id: str, role_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        ユーザーロールを更新（user_roleテーブルで）

        Args:
            user_id: ユーザーID
            role_data: 更新するデータ（role_typeを含む）

        Returns:
            更新されたロール情報、見つからない場合はNone
        """
        # 既存のロールを取得して、そのIDで更新
        existing_role = self.get_role_by_user_id(user_id)
        if not existing_role:
            logger.warning(f"Role not found for user: {user_id}")
            return None

        if not role_data:
            return existing_role
        set_clause = ", ".join([f"{k} = %s" for k in role_data.keys()])
        values = list(role_data.values()) + [str(existing_role["id"])]
        cur = self.conn.execute(
            f"UPDATE user_roles SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"User role updated successfully for user: {user_id}")
            return dict(row)

        logger.error(f"Failed to update user role for user: {user_id}")
        return None

    def delete_role(self, user_id: str) -> bool:
        """
        ユーザーロールを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功の場合はTrue
        """
        self.conn.execute("DELETE FROM user_roles WHERE user_id = %s", (str(user_id),))
        self.conn.commit()
        logger.info(f"User role deleted successfully for user: {user_id}")
        return True

    def delete_role_by_type(self, user_id: str, role_type: str) -> bool:
        """
        指定したロールのみ削除
        """
        self.conn.execute(
            "DELETE FROM user_roles WHERE user_id = %s AND role_type = %s",
            (str(user_id), role_type),
        )
        self.conn.commit()
        logger.info(f"{role_type} role deleted for user: {user_id}")
        return True

    def get_roles_by_type(self, role_type: str, include_hidden: bool = False) -> list[dict[str, Any]]:
        """
        ロールタイプでユーザーロールを取得（user_roleテーブルから）

        Args:
            role_type: ロールタイプ（basic/admin/viewer/general）
            include_hidden: 非表示ロールも含めるか（user_roleテーブルでは未使用）

        Returns:
            ロール情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM user_roles WHERE role_type = %s",
            (role_type,),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} roles for type: {role_type}")
        return data

    def get_all_roles(self, include_hidden: bool = False) -> list[dict[str, Any]]:
        """
        すべてのユーザーロールを取得（user_roleテーブルから）

        Args:
            include_hidden: 非表示ロールも含めるか（user_roleテーブルでは未使用）

        Returns:
            ロール情報のリスト
        """
        rows = self.conn.execute("SELECT * FROM user_roles").fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} total roles")
        return data

    def get_user_roles_with_instructor(self) -> list[dict[str, Any]]:
        """
        user_rolesテーブルからis_instructorフラグを含むロール情報を取得

        Returns:
            is_instructorフラグを含むロール情報のリスト
        """
        rows = self.conn.execute("SELECT * FROM user_roles").fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} user roles with instructor flag")
        return data

    def update_instructor_flag(self, user_id: str, is_instructor: bool) -> dict[str, Any] | None:
        """
        user_rolesテーブルのis_instructorフラグを更新

        Args:
            user_id: ユーザーID
            is_instructor: 指導者フラグ

        Returns:
            更新されたロール情報、見つからない場合はNone
        """
        # 既存のレコードを確認
        existing = self.conn.execute(
            "SELECT * FROM user_roles WHERE user_id = %s LIMIT 1",
            (str(user_id),),
        ).fetchone()

        if existing:
            cur = self.conn.execute(
                "UPDATE user_roles SET is_instructor = %s WHERE user_id = %s RETURNING *",
                (is_instructor, str(user_id)),
            )
        else:
            cur = self.conn.execute(
                "INSERT INTO user_roles (user_id, is_instructor, role_type) VALUES (%s, %s, %s) RETURNING *",
                (str(user_id), is_instructor, "basic"),
            )

        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"Instructor flag updated for user: {user_id}, is_instructor: {is_instructor}")
            return dict(row)

        logger.error(f"Failed to update instructor flag for user: {user_id}")
        return None

    def get_instructor_flag(self, user_id: str) -> bool:
        """
        user_rolesテーブルからis_instructorフラグを取得

        Args:
            user_id: ユーザーID

        Returns:
            is_instructorフラグ（デフォルトはFalse）
        """
        row = self.conn.execute(
            "SELECT is_instructor FROM user_roles WHERE user_id = %s LIMIT 1",
            (str(user_id),),
        ).fetchone()

        if row:
            return dict(row).get("is_instructor", False)

        return False
