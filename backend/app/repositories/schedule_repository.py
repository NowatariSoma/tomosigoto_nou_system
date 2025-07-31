"""
スケジュールデータアクセス層実装
"""
import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import date, time, datetime
from uuid import UUID
from calendar import monthrange
from datetime import timedelta

from app.models.schedule import PracticeSchedule, Session, Venue, PartDefinition
from app.core.pagination import PaginationParams, PaginationHelper
from app.core.filtering import apply_schedule_filters, create_schedule_filter


logger = logging.getLogger(__name__)


class ScheduleRepository:
    """スケジュールデータアクセスリポジトリ"""
    
    def __init__(self, supabase_client):
        """
        コンストラクタ
        
        Args:
            supabase_client: Supabaseクライアント
        """
        self._client = supabase_client
        self._logger = logger
    
    async def get_schedule_by_id(self, schedule_id: UUID) -> Optional[PracticeSchedule]:
        """
        スケジュールIDでスケジュールを取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            スケジュール情報、存在しない場合はNone
        """
        try:
            response = (
                self._client
                .table("practice_schedules")
                .select("*")
                .eq("id", str(schedule_id))
                .execute()
            )
            
            if not response.data:
                return None
            
            schedule_data = response.data[0]
            return self._convert_to_practice_schedule(schedule_data)
            
        except Exception as e:
            self._logger.error(f"Error fetching schedule by ID {schedule_id}: {str(e)}")
            raise
    
    async def get_schedules_by_date_range(
        self, 
        start_date: date, 
        end_date: date, 
        part_id: Optional[UUID] = None,
        pagination: Optional[PaginationParams] = None
    ) -> Tuple[List[PracticeSchedule], int]:
        """
        日付範囲でスケジュールを取得
        
        Args:
            start_date: 開始日
            end_date: 終了日
            part_id: パートID（オプション）
            pagination: ページネーションパラメータ
            
        Returns:
            (スケジュールリスト, 総件数)
        """
        try:
            # 基本クエリ
            if part_id:
                # パート指定がある場合はJOINクエリを使用
                query = (
                    self._client
                    .table("practice_schedules")
                    .select("""
                        *,
                        sessions!inner(
                            id,
                            part_session_assignments!inner(
                                part_id
                            )
                        )
                    """)
                    .gte("schedule_date", start_date.isoformat())
                    .lte("schedule_date", end_date.isoformat())
                    .eq("sessions.part_session_assignments.part_id", str(part_id))
                )
            else:
                query = (
                    self._client
                    .table("practice_schedules")
                    .select("*")
                    .gte("schedule_date", start_date.isoformat())
                    .lte("schedule_date", end_date.isoformat())
                )
            
            # 件数取得
            count_response = query.execute()
            total = len(count_response.data) if count_response.data else 0
            
            # ページネーション適用
            if pagination:
                start_range, end_range = PaginationHelper.get_supabase_range(
                    pagination.page, pagination.limit
                )
                query = query.order("schedule_date", desc=False).range(start_range, end_range)
            else:
                query = query.order("schedule_date", desc=False)
            
            response = query.execute()
            
            schedules = [
                self._convert_to_practice_schedule(data) 
                for data in response.data
            ] if response.data else []
            
            return schedules, total
            
        except Exception as e:
            self._logger.error(f"Error fetching schedules by date range: {str(e)}")
            raise
    
    async def get_schedules_by_part_id(
        self, 
        part_id: UUID, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        pagination: Optional[PaginationParams] = None
    ) -> Tuple[List[PracticeSchedule], int]:
        """
        パートIDでスケジュールを取得
        
        Args:
            part_id: パートID
            start_date: 開始日（オプション）
            end_date: 終了日（オプション）
            pagination: ページネーションパラメータ
            
        Returns:
            (スケジュールリスト, 総件数)
        """
        try:
            query = (
                self._client
                .table("practice_schedules")
                .select("""
                    *,
                    sessions!inner(
                        id,
                        part_session_assignments!inner(
                            part_id
                        )
                    )
                """)
                .eq("sessions.part_session_assignments.part_id", str(part_id))
            )
            
            # 日付フィルター追加
            if start_date:
                query = query.gte("schedule_date", start_date.isoformat())
            if end_date:
                query = query.lte("schedule_date", end_date.isoformat())
            
            # 件数取得
            count_response = query.execute()
            total = len(count_response.data) if count_response.data else 0
            
            # ページネーション適用
            if pagination:
                start_range, end_range = PaginationHelper.get_supabase_range(
                    pagination.page, pagination.limit
                )
                query = query.order("schedule_date", desc=False).range(start_range, end_range)
            else:
                query = query.order("schedule_date", desc=False)
            
            response = query.execute()
            
            schedules = [
                self._convert_to_practice_schedule(data) 
                for data in response.data
            ] if response.data else []
            
            return schedules, total
            
        except Exception as e:
            self._logger.error(f"Error fetching schedules by part ID {part_id}: {str(e)}")
            raise
    
    async def get_schedules_with_filters(
        self, 
        filters: Dict[str, Any], 
        pagination: Optional[PaginationParams] = None
    ) -> Tuple[List[PracticeSchedule], int]:
        """
        複合フィルター条件でスケジュールを取得
        
        Args:
            filters: フィルター条件辞書
            pagination: ページネーションパラメータ
            
        Returns:
            (スケジュールリスト, 総件数)
        """
        try:
            query = self._client.table("practice_schedules").select("*")
            
            # フィルター適用
            if "start_date" in filters:
                query = query.gte("schedule_date", filters["start_date"].isoformat())
            if "end_date" in filters:
                query = query.lte("schedule_date", filters["end_date"].isoformat())
            if "venue_id" in filters:
                query = query.eq("venue_id", str(filters["venue_id"]))
            if "schedule_type" in filters:
                query = query.eq("schedule_type", filters["schedule_type"])
            if "status" in filters:
                query = query.eq("status", filters["status"])
            
            # パートフィルターは別処理
            if "part_id" in filters:
                query = (
                    self._client
                    .table("practice_schedules")
                    .select("""
                        *,
                        sessions!inner(
                            id,
                            part_session_assignments!inner(
                                part_id
                            )
                        )
                    """)
                    .eq("sessions.part_session_assignments.part_id", str(filters["part_id"]))
                )
                
                # 他のフィルターを再適用
                if "start_date" in filters:
                    query = query.gte("schedule_date", filters["start_date"].isoformat())
                if "end_date" in filters:
                    query = query.lte("schedule_date", filters["end_date"].isoformat())
                if "venue_id" in filters:
                    query = query.eq("venue_id", str(filters["venue_id"]))
                if "schedule_type" in filters:
                    query = query.eq("schedule_type", filters["schedule_type"])
                if "status" in filters:
                    query = query.eq("status", filters["status"])
            
            # 件数取得
            count_response = query.execute()
            total = len(count_response.data) if count_response.data else 0
            
            # ソート・ページネーション適用
            sort_field = filters.get("sort_by", "schedule_date")
            sort_order = filters.get("sort_order", "asc")
            ascending = sort_order == "asc"
            
            query = query.order(sort_field, desc=not ascending)
            
            if pagination:
                start_range, end_range = PaginationHelper.get_supabase_range(
                    pagination.page, pagination.limit
                )
                query = query.range(start_range, end_range)
            
            response = query.execute()
            
            schedules = [
                self._convert_to_practice_schedule(data) 
                for data in response.data
            ] if response.data else []
            
            return schedules, total
            
        except Exception as e:
            self._logger.error(f"Error fetching schedules with filters: {str(e)}")
            raise
    
    async def get_monthly_schedules(
        self, 
        year: int, 
        month: int, 
        part_id: Optional[UUID] = None
    ) -> List[PracticeSchedule]:
        """
        月別スケジュールを取得
        
        Args:
            year: 年
            month: 月
            part_id: パートID（オプション）
            
        Returns:
            スケジュールリスト
        """
        try:
            # 月の開始日と終了日を計算
            start_date = date(year, month, 1)
            last_day = monthrange(year, month)[1]
            end_date = date(year, month, last_day)
            
            schedules, _ = await self.get_schedules_by_date_range(
                start_date, end_date, part_id
            )
            
            return schedules
            
        except Exception as e:
            self._logger.error(f"Error fetching monthly schedules for {year}-{month}: {str(e)}")
            raise
    
    async def get_weekly_schedules(
        self, 
        year: int, 
        week_number: int, 
        part_id: Optional[UUID] = None
    ) -> List[PracticeSchedule]:
        """
        週別スケジュールを取得
        
        Args:
            year: 年
            week_number: 週番号
            part_id: パートID（オプション）
            
        Returns:
            スケジュールリスト
        """
        try:
            # 週の開始日と終了日を計算（ISO週番号使用）
            jan_4 = date(year, 1, 4)
            week_start = jan_4 + timedelta(weeks=week_number-1, days=-jan_4.weekday())
            week_end = week_start + timedelta(days=6)
            
            schedules, _ = await self.get_schedules_by_date_range(
                week_start, week_end, part_id
            )
            
            return schedules
            
        except Exception as e:
            self._logger.error(f"Error fetching weekly schedules for {year}-W{week_number}: {str(e)}")
            raise
    
    async def get_sessions_by_schedule_id(self, schedule_id: UUID) -> List[Session]:
        """
        スケジュール別セッションを取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            セッションリスト
        """
        try:
            response = (
                self._client
                .table("sessions")
                .select("*")
                .eq("schedule_id", str(schedule_id))
                .order("start_time", desc=False)
                .execute()
            )
            
            sessions = [
                self._convert_to_session(data) 
                for data in response.data
            ] if response.data else []
            
            return sessions
            
        except Exception as e:
            self._logger.error(f"Error fetching sessions for schedule {schedule_id}: {str(e)}")
            raise
    
    async def get_sessions_by_schedule_ids(self, schedule_ids: List[UUID]) -> List[Session]:
        """
        複数スケジュールのセッションを一括取得（N+1問題対策）
        
        Args:
            schedule_ids: スケジュールIDリスト
            
        Returns:
            セッションリスト
        """
        try:
            if not schedule_ids:
                return []
            
            # UUIDを文字列に変換
            str_schedule_ids = [str(schedule_id) for schedule_id in schedule_ids]
            
            response = (
                self._client
                .table("sessions")
                .select("*")
                .in_("schedule_id", str_schedule_ids)
                .order("schedule_id", desc=False)
                .order("start_time", desc=False)
                .execute()
            )
            
            sessions = [
                self._convert_to_session(data) 
                for data in response.data
            ] if response.data else []
            
            return sessions
            
        except Exception as e:
            self._logger.error(f"Error fetching sessions for schedules {schedule_ids}: {str(e)}")
            raise
    
    async def count_schedules_by_filters(self, filters: Dict[str, Any]) -> int:
        """
        フィルター条件でのスケジュール件数を取得
        
        Args:
            filters: フィルター条件辞書
            
        Returns:
            スケジュール件数
        """
        try:
            query = self._client.table("practice_schedules").select("*", count="exact")
            
            # フィルター適用
            for key, value in filters.items():
                if key == "status":
                    query = query.eq("status", value)
                elif key == "schedule_type":
                    query = query.eq("schedule_type", value)
                elif key == "venue_id":
                    query = query.eq("venue_id", str(value))
            
            response = query.execute()
            return response.count or 0
            
        except Exception as e:
            self._logger.error(f"Error counting schedules: {str(e)}")
            raise
    
    async def get_venue_by_id(self, venue_id: UUID) -> Optional[Dict[str, Any]]:
        """
        会場情報を取得
        
        Args:
            venue_id: 会場ID
            
        Returns:
            会場情報辞書
        """
        try:
            response = (
                self._client
                .table("venues")
                .select("*")
                .eq("id", str(venue_id))
                .execute()
            )
            
            return response.data[0] if response.data else None
            
        except Exception as e:
            self._logger.error(f"Error fetching venue {venue_id}: {str(e)}")
            raise
    
    def _convert_to_practice_schedule(self, data: Dict[str, Any]) -> PracticeSchedule:
        """
        辞書データをPracticeScheduleモデルに変換
        
        Args:
            data: データベースからの生データ
            
        Returns:
            PracticeScheduleモデル
        """
        return PracticeSchedule(
            id=UUID(data["id"]),
            venue_id=UUID(data["venue_id"]),
            schedule_date=datetime.fromisoformat(data["schedule_date"]).date(),
            start_time=datetime.fromisoformat(data["start_time"]).time(),
            end_time=datetime.fromisoformat(data["end_time"]).time(),
            title=data["title"],
            description=data.get("description"),
            schedule_type=data["schedule_type"],
            status=data["status"],
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")),
            created_by=UUID(data["created_by"])
        )
    
    def _convert_to_session(self, data: Dict[str, Any]) -> Session:
        """
        辞書データをSessionモデルに変換
        
        Args:
            data: データベースからの生データ
            
        Returns:
            Sessionモデル
        """
        return Session(
            id=UUID(data["id"]),
            schedule_id=UUID(data["schedule_id"]),
            start_time=datetime.fromisoformat(data["start_time"]).time(),
            end_time=datetime.fromisoformat(data["end_time"]).time(),
            title=data["title"],
            description=data.get("description"),
            session_type=data["session_type"],
            priority=data["priority"],
            resources=data.get("resources", {}),
            location_in_venue=data.get("location_in_venue"),
            status=data["status"],
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
        )