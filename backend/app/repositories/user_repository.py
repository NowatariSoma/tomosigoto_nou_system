import logging
from typing import Any

from app.core.database import Conn

logger = logging.getLogger(__name__)


class UserRepository:
    """
    ユーザー関連のデータアクセスを処理するリポジトリクラス
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "users"

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        """
        ユーザーIDでユーザーを取得

        Args:
            user_id: ユーザーID

        Returns:
            ユーザー情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM users WHERE id = %s LIMIT 1",
            (str(user_id),),
        ).fetchone()
        if row:
            logger.info(f"Found user: {user_id}")
            return dict(row)

        logger.info(f"User not found: {user_id}")
        return None

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        """
        メールアドレスでユーザーを取得

        Args:
            email: メールアドレス

        Returns:
            ユーザー情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM users WHERE email = %s LIMIT 1",
            (email,),
        ).fetchone()
        if row:
            logger.info(f"Found user by email: {email}")
            return dict(row)

        logger.info(f"User not found by email: {email}")
        return None

    def create_user(self, user_data: dict[str, Any]) -> dict[str, Any]:
        """
        ユーザーを作成

        Args:
            user_data: ユーザー情報

        Returns:
            作成されたユーザー情報
        """
        columns = list(user_data.keys())
        values = [user_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO users ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"User created successfully: {user_data.get('id', 'unknown')}")
            return dict(row)

        logger.error(f"Failed to create user: {user_data.get('id', 'unknown')}")
        return {}

    def update_user(self, user_id: str, user_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        ユーザーを更新

        Args:
            user_id: ユーザーID
            user_data: 更新するデータ

        Returns:
            更新されたユーザー情報、見つからない場合はNone
        """
        if not user_data:
            return self.get_user_by_id(user_id)
        set_clause = ", ".join([f"{k} = %s" for k in user_data.keys()])
        values = list(user_data.values()) + [str(user_id)]
        cur = self.conn.execute(
            f"UPDATE users SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"User updated successfully: {user_id}")
            return dict(row)

        logger.error(f"Failed to update user: {user_id}")
        return None

    def delete_user(self, user_id: str) -> bool:
        """
        ユーザーを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功の場合はTrue
        """
        self.conn.execute("DELETE FROM users WHERE id = %s", (str(user_id),))
        self.conn.commit()
        logger.info(f"User deleted successfully: {user_id}")
        return True

    def get_all_users(self) -> list[dict[str, Any]]:
        """
        すべてのユーザーを取得

        Returns:
            ユーザー情報のリスト
        """
        rows = self.conn.execute("SELECT * FROM users").fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} total users")
        return data

    def get_user_count(self) -> int:
        """
        ユーザー数を取得

        Returns:
            ユーザー数
        """
        row = self.conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()
        count = row["cnt"] if row else 0
        return count
