"""
ページネーション共通ロジック
"""
from typing import TypeVar, Generic, List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from math import ceil


T = TypeVar('T')


class PaginationParams(BaseModel):
    """ページネーションパラメータ"""
    page: int = Field(default=1, ge=1, description="ページ番号")
    limit: int = Field(default=20, ge=1, le=100, description="1ページあたりの件数")
    
    @property
    def offset(self) -> int:
        """オフセットを計算"""
        return (self.page - 1) * self.limit


class PaginatedResult(BaseModel, Generic[T]):
    """ページネーション結果"""
    items: List[T] = Field(description="項目リスト")
    total: int = Field(description="総件数")
    page: int = Field(description="現在のページ")
    limit: int = Field(description="1ページあたりの件数")
    pages: int = Field(description="総ページ数")
    has_next: bool = Field(description="次のページがあるか")
    has_previous: bool = Field(description="前のページがあるか")
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        limit: int
    ) -> 'PaginatedResult[T]':
        """ページネーション結果を作成"""
        pages = ceil(total / limit) if total > 0 else 0
        has_next = page < pages
        has_previous = page > 1
        
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=has_next,
            has_previous=has_previous
        )


class SortParams(BaseModel):
    """ソートパラメータ"""
    sort_by: str = Field(default="created_at", description="ソート項目")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="ソート順")
    
    def get_order_clause(self, table_prefix: str = "") -> str:
        """ORDER BY句を生成"""
        field = f"{table_prefix}.{self.sort_by}" if table_prefix else self.sort_by
        return f"{field} {self.sort_order.upper()}"
    
    def get_supabase_order(self, table_prefix: str = "") -> Tuple[str, Dict[str, Any]]:
        """Supabase用のorder設定を生成"""
        field = f"{table_prefix}.{self.sort_by}" if table_prefix else self.sort_by
        ascending = self.sort_order == "asc"
        return field, {"ascending": ascending}


class ScheduleSortParams(SortParams):
    """スケジュール用ソートパラメータ"""
    sort_by: str = Field(
        default="schedule_date", 
        pattern="^(schedule_date|start_time|end_time|title|created_at|updated_at)$",
        description="ソート項目"
    )


class SessionSortParams(SortParams):
    """セッション用ソートパラメータ"""
    sort_by: str = Field(
        default="start_time", 
        pattern="^(start_time|end_time|title|priority|created_at|updated_at)$",
        description="ソート項目"
    )


class PaginationHelper:
    """ページネーションヘルパークラス"""
    
    @staticmethod
    def calculate_pagination_info(
        total: int, 
        page: int, 
        limit: int
    ) -> Dict[str, Any]:
        """ページネーション情報を計算"""
        pages = ceil(total / limit) if total > 0 else 0
        has_next = page < pages
        has_previous = page > 1
        
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
            "has_next": has_next,
            "has_previous": has_previous,
            "offset": (page - 1) * limit
        }
    
    @staticmethod
    def get_supabase_range(page: int, limit: int) -> Tuple[int, int]:
        """Supabase用のrange値を計算"""
        start = (page - 1) * limit
        end = start + limit - 1
        return start, end
    
    @staticmethod
    def validate_pagination_params(page: int, limit: int) -> Tuple[int, int]:
        """ページネーションパラメータを検証・正規化"""
        page = max(1, page)
        limit = max(1, min(100, limit))
        return page, limit


class QueryBuilder:
    """SQLクエリビルダー（ページネーション対応）"""
    
    def __init__(self, base_query: str):
        self.base_query = base_query
        self.where_conditions = []
        self.join_clauses = []
        self.order_clauses = []
        self.params = {}
    
    def add_where(self, condition: str, params: Optional[Dict[str, Any]] = None) -> 'QueryBuilder':
        """WHERE条件を追加"""
        self.where_conditions.append(condition)
        if params:
            self.params.update(params)
        return self
    
    def add_join(self, join_clause: str) -> 'QueryBuilder':
        """JOIN句を追加"""
        self.join_clauses.append(join_clause)
        return self
    
    def add_order(self, order_clause: str) -> 'QueryBuilder':
        """ORDER BY句を追加"""
        self.order_clauses.append(order_clause)
        return self
    
    def build_count_query(self) -> str:
        """件数取得用クエリを構築"""
        query_parts = [f"SELECT COUNT(*) FROM ({self.base_query}) as base_table"]
        
        if self.join_clauses:
            query_parts.extend(self.join_clauses)
        
        if self.where_conditions:
            query_parts.append(f"WHERE {' AND '.join(self.where_conditions)}")
        
        return " ".join(query_parts)
    
    def build_data_query(self, offset: int, limit: int) -> str:
        """データ取得用クエリを構築"""
        query_parts = [self.base_query]
        
        if self.join_clauses:
            query_parts.extend(self.join_clauses)
        
        if self.where_conditions:
            query_parts.append(f"WHERE {' AND '.join(self.where_conditions)}")
        
        if self.order_clauses:
            query_parts.append(f"ORDER BY {', '.join(self.order_clauses)}")
        
        query_parts.append(f"LIMIT {limit} OFFSET {offset}")
        
        return " ".join(query_parts)


async def paginate_supabase_query(
    supabase_client,
    table: str,
    select_fields: str,
    filters: Dict[str, Any],
    pagination: PaginationParams,
    sort: SortParams
) -> Tuple[List[Dict[str, Any]], int]:
    """Supabaseクエリのページネーション実行"""
    
    # 件数取得
    count_query = supabase_client.table(table).select("*", count="exact")
    for field, value in filters.items():
        count_query = count_query.filter(field, value)
    
    count_result = count_query.execute()
    total = count_result.count
    
    # データ取得
    start, end = PaginationHelper.get_supabase_range(pagination.page, pagination.limit)
    data_query = supabase_client.table(table).select(select_fields)
    
    # フィルター適用
    for field, value in filters.items():
        data_query = data_query.filter(field, value)
    
    # ソート適用
    sort_field, sort_options = sort.get_supabase_order()
    data_query = data_query.order(sort_field, **sort_options)
    
    # ページネーション適用
    data_query = data_query.range(start, end)
    
    data_result = data_query.execute()
    
    return data_result.data, total