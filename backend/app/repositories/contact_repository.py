from typing import Any

from app.core.database import Conn


class ContactRepository:
    """お問い合わせリポジトリ"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "contacts"

    def find_all(self, user_id: str | None = None) -> list[dict[str, Any]]:
        """全お問い合わせを取得（user_idが指定された場合はそのユーザーのみ）"""
        if user_id:
            rows = self.conn.execute(
                "SELECT * FROM contacts WHERE user_id = %s",
                (str(user_id),),
            ).fetchall()
        else:
            rows = self.conn.execute("SELECT * FROM contacts").fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, contact_id: str) -> dict[str, Any] | None:
        """IDでお問い合わせを取得"""
        row = self.conn.execute(
            "SELECT * FROM contacts WHERE id = %s",
            (str(contact_id),),
        ).fetchone()
        return dict(row) if row else None

    def create(self, contact_data: dict[str, Any]) -> dict[str, Any]:
        """お問い合わせを作成"""
        columns = list(contact_data.keys())
        values = [contact_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO contacts ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(self, contact_id: str, contact_data: dict[str, Any]) -> dict[str, Any] | None:
        """お問い合わせを更新"""
        if not contact_data:
            return self.find_by_id(contact_id)
        set_clause = ", ".join([f"{k} = %s" for k in contact_data.keys()])
        values = list(contact_data.values()) + [str(contact_id)]
        cur = self.conn.execute(
            f"UPDATE contacts SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, contact_id: str) -> bool:
        """お問い合わせを削除"""
        self.conn.execute("DELETE FROM contacts WHERE id = %s", (str(contact_id),))
        self.conn.commit()
        return True
