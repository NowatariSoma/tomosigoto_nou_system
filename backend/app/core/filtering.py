"""
共通フィルタリングロジック
"""
from typing import Dict, Any, Optional, List
from datetime import date, time
from uuid import UUID


class FilterBuilder:
    """フィルタリング条件構築クラス"""
    
    def __init__(self):
        self.filters = {}
        self.joins = []
    
    def add_date_range_filter(
        self, 
        field_name: str, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> 'FilterBuilder':
        """日付範囲フィルターを追加"""
        if start_date:
            self.filters[f"{field_name}_gte"] = start_date
        if end_date:
            self.filters[f"{field_name}_lte"] = end_date
        return self
    
    def add_time_range_filter(
        self, 
        start_field: str, 
        end_field: str, 
        target_start: Optional[time] = None, 
        target_end: Optional[time] = None
    ) -> 'FilterBuilder':
        """時間範囲フィルターを追加"""
        if target_start:
            self.filters[f"{end_field}_gte"] = target_start
        if target_end:
            self.filters[f"{start_field}_lte"] = target_end
        return self
    
    def add_equal_filter(self, field_name: str, value: Any) -> 'FilterBuilder':
        """等価条件フィルターを追加"""
        if value is not None:
            self.filters[f"{field_name}_eq"] = value
        return self
    
    def add_in_filter(self, field_name: str, values: List[Any]) -> 'FilterBuilder':
        """IN条件フィルターを追加"""
        if values:
            self.filters[f"{field_name}_in"] = values
        return self
    
    def add_like_filter(self, field_name: str, pattern: str) -> 'FilterBuilder':
        """LIKE条件フィルターを追加"""
        if pattern:
            self.filters[f"{field_name}_like"] = f"%{pattern}%"
        return self
    
    def add_join(self, table: str, condition: str) -> 'FilterBuilder':
        """JOIN条件を追加"""
        self.joins.append(f"JOIN {table} ON {condition}")
        return self
    
    def add_left_join(self, table: str, condition: str) -> 'FilterBuilder':
        """LEFT JOIN条件を追加"""
        self.joins.append(f"LEFT JOIN {table} ON {condition}")
        return self
    
    def build_where_clause(self) -> str:
        """WHERE句を構築"""
        conditions = []
        
        for key, value in self.filters.items():
            field, operator = key.rsplit('_', 1)
            
            if operator == 'eq':
                conditions.append(f"{field} = '{value}'")
            elif operator == 'gte':
                conditions.append(f"{field} >= '{value}'")
            elif operator == 'lte':
                conditions.append(f"{field} <= '{value}'")
            elif operator == 'in':
                value_list = "', '".join(map(str, value))
                conditions.append(f"{field} IN ('{value_list}')")
            elif operator == 'like':
                conditions.append(f"{field} ILIKE '{value}'")
        
        return " AND ".join(conditions) if conditions else "1=1"
    
    def build_join_clause(self) -> str:
        """JOIN句を構築"""
        return " ".join(self.joins)
    
    def build_supabase_filter(self) -> Dict[str, Any]:
        """Supabase用のフィルター辞書を構築"""
        supabase_filters = {}
        
        for key, value in self.filters.items():
            field, operator = key.rsplit('_', 1)
            
            if operator == 'eq':
                supabase_filters[field] = f"eq.{value}"
            elif operator == 'gte':
                supabase_filters[field] = f"gte.{value}"
            elif operator == 'lte':
                supabase_filters[field] = f"lte.{value}"
            elif operator == 'in':
                value_list = ",".join(map(str, value))
                supabase_filters[field] = f"in.({value_list})"
            elif operator == 'like':
                supabase_filters[field] = f"ilike.{value}"
        
        return supabase_filters


class ScheduleFilterBuilder(FilterBuilder):
    """スケジュール専用フィルタービルダー"""
    
    def filter_by_date_range(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> 'ScheduleFilterBuilder':
        """日付範囲でフィルター"""
        return self.add_date_range_filter("schedule_date", start_date, end_date)
    
    def filter_by_venue(self, venue_id: Optional[UUID] = None) -> 'ScheduleFilterBuilder':
        """会場でフィルター"""
        return self.add_equal_filter("venue_id", venue_id)
    
    def filter_by_schedule_type(self, schedule_type: Optional[str] = None) -> 'ScheduleFilterBuilder':
        """練習種別でフィルター"""
        return self.add_equal_filter("schedule_type", schedule_type)
    
    def filter_by_status(self, status: Optional[str] = None) -> 'ScheduleFilterBuilder':
        """ステータスでフィルター"""
        return self.add_equal_filter("status", status)
    
    def filter_by_part(self, part_id: Optional[UUID] = None) -> 'ScheduleFilterBuilder':
        """パートでフィルター（セッション経由）"""
        if part_id:
            self.add_join(
                "sessions s", 
                "s.schedule_id = practice_schedules.id"
            )
            self.add_join(
                "part_session_assignments psa", 
                "psa.session_id = s.id"
            )
            self.add_equal_filter("psa.part_id", part_id)
        return self
    
    def filter_by_time_range(
        self, 
        start_time: Optional[time] = None, 
        end_time: Optional[time] = None
    ) -> 'ScheduleFilterBuilder':
        """時間範囲でフィルター"""
        return self.add_time_range_filter("start_time", "end_time", start_time, end_time)


class SessionFilterBuilder(FilterBuilder):
    """セッション専用フィルタービルダー"""
    
    def filter_by_schedule(self, schedule_id: Optional[UUID] = None) -> 'SessionFilterBuilder':
        """スケジュールでフィルター"""
        return self.add_equal_filter("schedule_id", schedule_id)
    
    def filter_by_session_type(self, session_type: Optional[str] = None) -> 'SessionFilterBuilder':
        """セッション種別でフィルター"""
        return self.add_equal_filter("session_type", session_type)
    
    def filter_by_part(self, part_id: Optional[UUID] = None) -> 'SessionFilterBuilder':
        """パートでフィルター"""
        if part_id:
            self.add_join(
                "part_session_assignments psa", 
                "psa.session_id = sessions.id"
            )
            self.add_equal_filter("psa.part_id", part_id)
        return self
    
    def filter_by_instructor(self, user_id: Optional[UUID] = None) -> 'SessionFilterBuilder':
        """担当者でフィルター"""
        if user_id:
            self.add_join(
                "session_instructors si", 
                "si.session_id = sessions.id"
            )
            self.add_equal_filter("si.user_id", user_id)
        return self
    
    def filter_by_priority_range(
        self, 
        min_priority: Optional[int] = None, 
        max_priority: Optional[int] = None
    ) -> 'SessionFilterBuilder':
        """優先度範囲でフィルター"""
        if min_priority:
            self.filters["priority_gte"] = min_priority
        if max_priority:
            self.filters["priority_lte"] = max_priority
        return self


def create_schedule_filter() -> ScheduleFilterBuilder:
    """スケジュールフィルタービルダーを作成"""
    return ScheduleFilterBuilder()


def create_session_filter() -> SessionFilterBuilder:
    """セッションフィルタービルダーを作成"""
    return SessionFilterBuilder()


def apply_schedule_filters(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    part_id: Optional[UUID] = None,
    venue_id: Optional[UUID] = None,
    schedule_type: Optional[str] = None,
    status: Optional[str] = None
) -> ScheduleFilterBuilder:
    """スケジュール用の基本フィルターを適用"""
    return (create_schedule_filter()
            .filter_by_date_range(start_date, end_date)
            .filter_by_venue(venue_id)
            .filter_by_schedule_type(schedule_type)
            .filter_by_status(status)
            .filter_by_part(part_id))


def apply_session_filters(
    schedule_id: Optional[UUID] = None,
    part_id: Optional[UUID] = None,
    session_type: Optional[str] = None,
    instructor_id: Optional[UUID] = None
) -> SessionFilterBuilder:
    """セッション用の基本フィルターを適用"""
    return (create_session_filter()
            .filter_by_schedule(schedule_id)
            .filter_by_part(part_id)
            .filter_by_session_type(session_type)
            .filter_by_instructor(instructor_id))