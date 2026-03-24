"""
UserProfileRepository - ユーザープロフィールデータアクセス層の実装
user_profilesテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any

from app.core.database import Conn

logger = logging.getLogger(__name__)


class UserProfileRepository:
    """
    ユーザープロフィールデータへのアクセスを管理するリポジトリクラス
    user_profilesテーブルのすべてのデータベース操作をカプセル化
    """

    def __init__(self, conn: Conn):
        """
        Args:
            conn: psycopg2接続
        """
        self.conn = conn
        self.table_name = "user_profiles"

    def get_profile_by_user_id(self, user_id: str) -> dict[str, Any] | None:
        """
        ユーザーIDでユーザープロフィールを取得

        Args:
            user_id: ユーザーID

        Returns:
            プロフィール情報、見つからない場合はNone
        """
        row = self.conn.execute(
            """
            SELECT up.*, d.department_code, d.department_name
            FROM user_profiles up
            LEFT JOIN departments d ON up.department_id = d.id
            WHERE up.user_id = %s
            ORDER BY up.created_at DESC
            LIMIT 1
            """,
            (str(user_id),),
        ).fetchone()
        if row:
            logger.info(f"Found user profile for user: {user_id}")
            profile = dict(row)
            if not profile.get("department_code"):
                profile["department_code"] = "LIT"
            if not profile.get("department_name"):
                profile["department_name"] = "文学部"
            return profile

        logger.info(f"User profile not found for user: {user_id}")
        return None

    def get_profiles_by_user_ids(self, user_ids: list[str]) -> list[dict[str, Any]]:
        """
        複数ユーザーIDのプロフィールをまとめて取得
        """
        if not user_ids:
            return []

        placeholders = ", ".join(["%s"] * len(user_ids))
        rows = self.conn.execute(
            f"SELECT user_id, first_name_kanji, last_name_kanji FROM user_profiles WHERE user_id IN ({placeholders})",
            [str(uid) for uid in user_ids],
        ).fetchall()
        return [dict(r) for r in rows]

    def get_profile_by_student_id(self, student_id: str) -> dict[str, Any] | None:
        """
        学籍番号でユーザープロフィールを取得

        Args:
            student_id: 学籍番号

        Returns:
            プロフィール情報、見つからない場合はNone
        """
        row = self.conn.execute(
            "SELECT * FROM user_profiles WHERE student_id = %s",
            (student_id,),
        ).fetchone()
        if row:
            logger.info(f"Found user profile for student_id: {student_id}")
            return dict(row)

        logger.info(f"User profile not found for student_id: {student_id}")
        return None

    def create_profile(self, profile_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しいユーザープロフィールを作成

        Args:
            profile_data: プロフィール情報

        Returns:
            作成されたプロフィール情報
        """
        columns = list(profile_data.keys())
        values = [profile_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO user_profiles ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"User profile created successfully for user: {profile_data.get('user_id', 'unknown')}")
            user_id = profile_data.get("user_id")
            if user_id:
                return self.get_profile_by_user_id(user_id)
            return dict(row)

        logger.error(f"Failed to create user profile for user: {profile_data.get('user_id', 'unknown')}")
        return {}

    def update_profile(self, user_id: str, profile_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        ユーザープロフィールを更新

        Args:
            user_id: ユーザーID
            profile_data: 更新するデータ

        Returns:
            更新されたプロフィール情報、見つからない場合はNone
        """
        # 既存のプロフィールを取得して、そのIDで更新
        existing_profile = self.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Profile not found for user: {user_id}")
            return None

        if not profile_data:
            return existing_profile
        set_clause = ", ".join([f"{k} = %s" for k in profile_data.keys()])
        values = list(profile_data.values()) + [str(existing_profile["id"])]
        cur = self.conn.execute(
            f"UPDATE user_profiles SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if row:
            logger.info(f"User profile updated successfully for user: {user_id}")
            return self.get_profile_by_user_id(user_id)

        logger.warning(f"User profile not found for update: {user_id}")
        return None

    def delete_profile(self, user_id: str) -> bool:
        """
        ユーザープロフィールを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功時True
        """
        self.conn.execute("DELETE FROM user_profiles WHERE user_id = %s", (str(user_id),))
        self.conn.commit()
        logger.info(f"User profile deleted successfully for user: {user_id}")
        return True

    def check_student_id_exists(self, student_id: str, exclude_user_id: str | None = None) -> bool:
        """
        学籍番号の重複チェック

        Args:
            student_id: 学籍番号
            exclude_user_id: 除外するユーザーID（更新時など）

        Returns:
            重複している場合True
        """
        if exclude_user_id:
            row = self.conn.execute(
                "SELECT id FROM user_profiles WHERE student_id = %s AND user_id != %s LIMIT 1",
                (student_id, str(exclude_user_id)),
            ).fetchone()
        else:
            row = self.conn.execute(
                "SELECT id FROM user_profiles WHERE student_id = %s LIMIT 1",
                (student_id,),
            ).fetchone()
        exists = row is not None
        logger.info(f"Student ID {student_id} exists: {exists}")
        return exists

    def get_profile_count(self) -> int:
        """
        プロフィール数を取得

        Returns:
            プロフィール数
        """
        row = self.conn.execute("SELECT COUNT(*) AS cnt FROM user_profiles").fetchone()
        count = row["cnt"] if row else 0
        logger.info(f"Total user profiles count: {count}")
        return count

    def get_profiles_by_department(self, department_id: str) -> list[dict[str, Any]]:
        """
        学部IDでプロフィール一覧を取得

        Args:
            department_id: 学部ID

        Returns:
            プロフィール情報のリスト
        """
        rows = self.conn.execute(
            "SELECT * FROM user_profiles WHERE department_id = %s ORDER BY created_at DESC",
            (str(department_id),),
        ).fetchall()
        data = [dict(r) for r in rows]
        logger.info(f"Found {len(data)} profiles for department: {department_id}")
        return data

    def check_email_exists(self, email: str, exclude_user_id: str | None = None) -> bool:
        """
        メールアドレスの重複チェック

        Args:
            email: チェックするメールアドレス
            exclude_user_id: 除外するユーザーID（更新時など）

        Returns:
            メールアドレスが既に存在する場合はTrue
        """
        if exclude_user_id:
            row = self.conn.execute(
                "SELECT id FROM user_profiles WHERE email = %s AND user_id != %s LIMIT 1",
                (email, str(exclude_user_id)),
            ).fetchone()
        else:
            row = self.conn.execute(
                "SELECT id FROM user_profiles WHERE email = %s LIMIT 1",
                (email,),
            ).fetchone()
        exists = row is not None
        if exists:
            logger.info(f"Email {email} exists: {exists}")
        return exists

    def get_all_profiles_basic(self) -> list[dict[str, Any]]:
        """
        account_setting_profileビューから基本情報（氏名・メール）を取得
        """
        rows = self.conn.execute(
            """
            SELECT user_id, first_name_kanji, last_name_kanji, email
            FROM account_setting_profile
            ORDER BY last_name_kanji ASC, first_name_kanji ASC
            """
        ).fetchall()
        return [dict(r) for r in rows]
