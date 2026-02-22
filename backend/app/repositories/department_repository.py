"""
DepartmentRepository - 学部データアクセス層の実装
departmentsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any

from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class DepartmentRepository:
    """
    学部データへのアクセスを管理するリポジトリクラス
    departmentsテーブルのすべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "departments"

    @handle_supabase_errors("get_all_departments")
    async def get_all_departments(self) -> list[dict[str, Any]]:
        """
        すべての学部を取得

        Returns:
            学部情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("is_active", True)
            .order("department_code")
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} active departments")
        return data

    @handle_supabase_errors("get_department_by_code")
    async def get_department_by_code(self, department_code: str) -> dict[str, Any] | None:
        """
        学部コードで学部を取得

        Args:
            department_code: 学部コード

        Returns:
            学部情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("department_code", department_code)
            .eq("is_active", True)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found department with code: {department_code}")
            return response.data[0]

        logger.info(f"Department not found with code: {department_code}")
        return None

    @handle_supabase_errors("get_department_by_id")
    async def get_department_by_id(self, department_id: str) -> dict[str, Any] | None:
        """
        学部IDで学部を取得

        Args:
            department_id: 学部ID

        Returns:
            学部情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("id", department_id)
            .eq("is_active", True)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found department with id: {department_id}")
            return response.data[0]

        logger.info(f"Department not found with id: {department_id}")
        return None

    @handle_supabase_errors("create_department")
    async def create_department(self, department_data: dict[str, Any]) -> dict[str, Any]:
        """
        新しい学部を作成

        Args:
            department_data: 学部情報

        Returns:
            作成された学部情報
        """
        response = self.client.table(self.table_name).insert(department_data).execute()
        if response.data:
            logger.info(f"Department created successfully: {department_data.get('department_code', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create department: {department_data.get('department_code', 'unknown')}")
        return {}

    @handle_supabase_errors("update_department")
    async def update_department(self, department_id: str, department_data: dict[str, Any]) -> dict[str, Any] | None:
        """
        学部を更新

        Args:
            department_id: 学部ID
            department_data: 更新するデータ

        Returns:
            更新された学部情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(department_data)
            .eq("id", department_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Department updated successfully: {department_id}")
            return response.data[0]

        logger.warning(f"Department not found for update: {department_id}")
        return None

    @handle_supabase_errors("delete_department")
    async def delete_department(self, department_id: str) -> bool:
        """
        学部を削除（論理削除）

        Args:
            department_id: 学部ID

        Returns:
            削除成功時True
        """
        response = (
            self.client.table(self.table_name)
            .update({"is_active": False})
            .eq("id", department_id)
            .execute()
        )
        if response.data:
            logger.info(f"Department deactivated successfully: {department_id}")
            return True

        logger.warning(f"Department not found for deactivation: {department_id}")
        return False

    @handle_supabase_errors("get_departments_by_campus")
    async def get_departments_by_campus(self, campus: str) -> list[dict[str, Any]]:
        """
        キャンパスで学部一覧を取得

        Args:
            campus: キャンパス名

        Returns:
            学部情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("campus", campus)
            .eq("is_active", True)
            .order("department_code")
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} departments for campus: {campus}")
        return data

    @handle_supabase_errors("get_department_count")
    async def get_department_count(self) -> int:
        """
        学部数を取得

        Returns:
            学部数
        """
        response = (
            self.client.table(self.table_name)
            .select("id", count="exact")
            .eq("is_active", True)
            .execute()
        )
        count = response.count if hasattr(response, "count") else 0
        logger.info(f"Total active departments count: {count}")
        return count
