from typing import Any

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class ContactRepository:
    """お問い合わせリポジトリ"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "contacts"

    @handle_supabase_errors("find_all")
    async def find_all(self, user_id: str | None = None) -> list[dict[str, Any]]:
        """全お問い合わせを取得（user_idが指定された場合はそのユーザーのみ）"""
        query = self.client.table(self.table_name).select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        response = query.execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, contact_id: str) -> dict[str, Any]:
        """IDでお問い合わせを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("id", contact_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("create")
    async def create(self, contact_data: dict[str, Any]) -> dict[str, Any]:
        """お問い合わせを作成"""
        response = self.client.table(self.table_name).insert(contact_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(
        self, contact_id: str, contact_data: dict[str, Any]
    ) -> dict[str, Any]:
        """お問い合わせを更新"""
        response = (
            self.client.table(self.table_name)
            .update(contact_data)
            .eq("id", contact_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, contact_id: str) -> bool:
        """お問い合わせを削除"""
        self.client.table(self.table_name).delete().eq("id", contact_id).execute()
        return True

