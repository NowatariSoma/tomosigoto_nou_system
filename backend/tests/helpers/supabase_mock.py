"""
Supabase クライアントのモックビルダー

チェイン可能な Supabase 操作をモックするためのユーティリティ。
テストで Supabase クライアントの代わりに使用する。

使い方:
    # 単純なモック（全テーブル共通レスポンス）
    mock_client = SupabaseMockBuilder().with_response(data=[{"id": "1"}], count=1).build()

    # テーブルごとに異なるレスポンスを設定
    mock_client = (
        SupabaseMockBuilder()
        .for_table("users").with_response(data=[{"id": "1", "name": "テスト"}])
        .for_table("venues").with_response(data=[{"id": "2", "name": "会場A"}])
        .build()
    )
"""

from __future__ import annotations

from typing import Any
from unittest.mock import Mock


class _MockResponse:
    """モックレスポンスオブジェクト（.data と .count 属性を持つ）"""

    def __init__(self, data: list[dict[str, Any]] | None = None, count: int | None = None) -> None:
        self.data = data if data is not None else []
        self.count = count


def _create_chainable_mock(response: _MockResponse) -> Mock:
    """
    チェイン可能なモックを作成する。

    .select(), .eq(), .insert(), .update(), .delete(), .limit(), .order(),
    .range(), .in_(), .neq(), .gte(), .lte(), .or_(), .contains()
    などのメソッド呼び出しがすべて自身を返し、
    .execute() で設定済みのレスポンスを返す。
    """
    mock = Mock()

    chainable_methods = [
        "select",
        "insert",
        "update",
        "upsert",
        "delete",
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "like",
        "ilike",
        "is_",
        "in_",
        "contains",
        "contained_by",
        "or_",
        "not_",
        "filter",
        "match",
        "limit",
        "offset",
        "order",
        "range",
        "single",
        "maybe_single",
        "csv",
        "on_conflict",
    ]
    for method_name in chainable_methods:
        getattr(mock, method_name).return_value = mock

    # execute() はレスポンスを返す
    mock.execute.return_value = response

    return mock


class SupabaseMockBuilder:
    """
    Supabase クライアントモックのビルダー。

    .with_response() で全テーブル共通のデフォルトレスポンスを設定し、
    .for_table("name").with_response() でテーブル固有のレスポンスを設定できる。
    """

    def __init__(self) -> None:
        self._default_data: list[dict[str, Any]] = []
        self._default_count: int | None = None
        self._table_configs: dict[str, dict[str, Any]] = {}
        self._current_table: str | None = None

    def with_response(
        self,
        data: list[dict[str, Any]] | None = None,
        count: int | None = None,
    ) -> SupabaseMockBuilder:
        """
        レスポンスデータを設定する。

        for_table() の直後に呼ぶとそのテーブル固有の設定になり、
        for_table() なしで呼ぶとデフォルトレスポンスの設定になる。
        """
        if self._current_table is not None:
            self._table_configs[self._current_table] = {
                "data": data if data is not None else [],
                "count": count,
            }
            self._current_table = None
        else:
            self._default_data = data if data is not None else []
            self._default_count = count
        return self

    def for_table(self, table_name: str) -> SupabaseMockBuilder:
        """次の with_response() 呼び出しの対象テーブルを指定する。"""
        self._current_table = table_name
        return self

    def build(self) -> Mock:
        """モック化された Supabase クライアントを生成して返す。"""
        mock_client = Mock()

        # デフォルトレスポンス
        default_response = _MockResponse(
            data=self._default_data,
            count=self._default_count,
        )

        # テーブルごとのチェイン可能モックを作成
        table_mocks: dict[str, Mock] = {}
        for table_name, config in self._table_configs.items():
            response = _MockResponse(
                data=config["data"],
                count=config["count"],
            )
            table_mocks[table_name] = _create_chainable_mock(response)

        # デフォルトのチェイン可能モック
        default_chainable = _create_chainable_mock(default_response)

        def table_side_effect(name: str) -> Mock:
            return table_mocks.get(name, default_chainable)

        mock_client.table = Mock(side_effect=table_side_effect)

        # auth 関連のモック
        mock_client.auth = Mock()
        mock_client.auth.admin = Mock()
        mock_client.auth.get_user = Mock()

        return mock_client
