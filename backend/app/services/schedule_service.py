"""
スケジュール管理サービス実装
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime, timedelta
from uuid import UUID
from calendar import monthrange
from collections import defaultdict

from app.repositories.schedule_repository import ScheduleRepository
from app.models.schedule import PracticeSchedule, Session
from app.schemas.schedule import (
    ScheduleResponseSchema, SessionResponseSchema, VenueSchema, 
    PaginatedResponse, MonthlyScheduleResponse, WeeklyScheduleResponse,
    CalendarDataSchema, ScheduleQueryParams
)
from app.core.pagination import PaginationParams, PaginatedResult


logger = logging.getLogger(__name__)


class ScheduleService:
    """スケジュール管理サービス"""
    
    def __init__(self, schedule_repository: ScheduleRepository, venue_service=None):
        """
        コンストラクタ
        
        Args:
            schedule_repository: スケジュールリポジトリ
            venue_service: 会場サービス（オプション）
        """
        self._schedule_repository = schedule_repository
        self._venue_service = venue_service
        self._logger = logger
    
    async def get_schedule_details(self, schedule_id: UUID) -> Optional[ScheduleResponseSchema]:
        """
        スケジュール詳細を取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            スケジュール詳細情報、存在しない場合はNone
        """
        try:
            # スケジュール基本情報取得
            schedule = await self._schedule_repository.get_schedule_by_id(schedule_id)
            if not schedule:
                return None
            
            # セッション情報取得
            sessions = await self._schedule_repository.get_sessions_by_schedule_id(schedule_id)
            
            # レスポンス形式に変換
            sessions_map = {schedule.id: sessions}
            formatted_schedules = await self._format_response_data([schedule], sessions_map)
            
            return formatted_schedules[0] if formatted_schedules else None
            
        except Exception as e:
            self._logger.error(f"Error getting schedule details for {schedule_id}: {str(e)}")
            raise
    
    async def get_schedules_by_date_range(
        self, 
        start_date: date, 
        end_date: date, 
        part_id: Optional[UUID] = None,
        pagination: Optional[PaginationParams] = None
    ) -> PaginatedResult[ScheduleResponseSchema]:
        """
        日付範囲でスケジュールを取得
        
        Args:
            start_date: 開始日
            end_date: 終了日
            part_id: パートID（オプション）
            pagination: ページネーションパラメータ
            
        Returns:
            ページネーション付きスケジュール情報
        """
        try:
            # スケジュール取得
            schedules, total = await self._schedule_repository.get_schedules_by_date_range(
                start_date, end_date, part_id, pagination
            )
            
            # セッション情報を取得
            sessions_map = await self._get_sessions_for_schedules(schedules)
            
            # レスポンス形式に変換
            formatted_schedules = await self._format_response_data(schedules, sessions_map)
            
            # ページネーション結果を作成
            return PaginatedResult.create(
                items=formatted_schedules,
                total=total,
                page=pagination.page if pagination else 1,
                limit=pagination.limit if pagination else len(formatted_schedules)
            )
            
        except Exception as e:
            self._logger.error(f"Error getting schedules by date range: {str(e)}")
            raise
    
    async def get_schedules_by_part_id(
        self, 
        part_id: UUID, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        pagination: Optional[PaginationParams] = None
    ) -> PaginatedResult[ScheduleResponseSchema]:
        """
        パートIDでスケジュールを取得
        
        Args:
            part_id: パートID
            start_date: 開始日（オプション）
            end_date: 終了日（オプション）
            pagination: ページネーションパラメータ
            
        Returns:
            ページネーション付きスケジュール情報
        """
        try:
            schedules, total = await self._schedule_repository.get_schedules_by_part_id(
                part_id, start_date, end_date, pagination
            )
            
            sessions_map = await self._get_sessions_for_schedules(schedules)
            formatted_schedules = await self._format_response_data(schedules, sessions_map)
            
            return PaginatedResult.create(
                items=formatted_schedules,
                total=total,
                page=pagination.page if pagination else 1,
                limit=pagination.limit if pagination else len(formatted_schedules)
            )
            
        except Exception as e:
            self._logger.error(f"Error getting schedules by part ID {part_id}: {str(e)}")
            raise
    
    async def get_schedules_with_filters(
        self, 
        filters: Dict[str, Any], 
        pagination: Optional[PaginationParams] = None
    ) -> PaginatedResult[ScheduleResponseSchema]:
        """
        複合フィルター条件でスケジュールを取得
        
        Args:
            filters: フィルター条件辞書
            pagination: ページネーションパラメータ
            
        Returns:
            ページネーション付きスケジュール情報
        """
        try:
            schedules, total = await self._schedule_repository.get_schedules_with_filters(
                filters, pagination
            )
            
            sessions_map = await self._get_sessions_for_schedules(schedules)
            formatted_schedules = await self._format_response_data(schedules, sessions_map)
            
            return PaginatedResult.create(
                items=formatted_schedules,
                total=total,
                page=pagination.page if pagination else 1,
                limit=pagination.limit if pagination else len(formatted_schedules)
            )
            
        except Exception as e:
            self._logger.error(f"Error getting schedules with filters: {str(e)}")
            raise
    
    async def get_monthly_schedules(
        self, 
        year: int, 
        month: int, 
        part_id: Optional[UUID] = None
    ) -> MonthlyScheduleResponse:
        """
        月別スケジュールを取得
        
        Args:
            year: 年
            month: 月
            part_id: パートID（オプション）
            
        Returns:
            月別スケジュール情報
        """
        try:
            schedules = await self._schedule_repository.get_monthly_schedules(
                year, month, part_id
            )
            
            # カレンダー表示用データに変換
            calendar_data = self._optimize_for_calendar(schedules, year, month)
            
            # 統計情報計算
            schedule_types = self._calculate_schedule_type_counts(schedules)
            
            return MonthlyScheduleResponse(
                year=year,
                month=month,
                calendar_data=calendar_data,
                total_schedules=len(schedules),
                schedule_types=schedule_types
            )
            
        except Exception as e:
            self._logger.error(f"Error getting monthly schedules for {year}-{month}: {str(e)}")
            raise
    
    async def get_weekly_schedules(
        self, 
        year: int, 
        week_number: int, 
        part_id: Optional[UUID] = None
    ) -> WeeklyScheduleResponse:
        """
        週別スケジュールを取得
        
        Args:
            year: 年
            week_number: 週番号
            part_id: パートID（オプション）
            
        Returns:
            週別スケジュール情報
        """
        try:
            schedules = await self._schedule_repository.get_weekly_schedules(
                year, week_number, part_id
            )
            
            # 週の開始日・終了日を計算
            jan_4 = date(year, 1, 4)
            week_start = jan_4 + timedelta(weeks=week_number-1, days=-jan_4.weekday())
            week_end = week_start + timedelta(days=6)
            
            # カレンダー表示用データに変換
            calendar_data = self._optimize_for_calendar_week(schedules, week_start, week_end)
            
            return WeeklyScheduleResponse(
                year=year,
                week_number=week_number,
                start_date=week_start,
                end_date=week_end,
                calendar_data=calendar_data,
                total_schedules=len(schedules)
            )
            
        except Exception as e:
            self._logger.error(f"Error getting weekly schedules for {year}-W{week_number}: {str(e)}")
            raise
    
    async def _get_sessions_for_schedules(
        self, 
        schedules: List[PracticeSchedule]
    ) -> Dict[UUID, List[Session]]:
        """
        スケジュールリストのセッション情報を取得（N+1問題対策）
        
        Args:
            schedules: スケジュールリスト
            
        Returns:
            スケジュールID: セッションリストの辞書
        """
        if not schedules:
            return {}
        
        # 全スケジュールIDを一度で取得してN+1問題を回避
        schedule_ids = [schedule.id for schedule in schedules]
        all_sessions = await self._schedule_repository.get_sessions_by_schedule_ids(schedule_ids)
        
        # スケジュールIDごとにセッションをグループ化
        sessions_map = {}
        for schedule_id in schedule_ids:
            sessions_map[schedule_id] = []
        
        for session in all_sessions:
            if session.schedule_id in sessions_map:
                sessions_map[session.schedule_id].append(session)
        
        return sessions_map
    
    async def _format_response_data(
        self, 
        schedules: List[PracticeSchedule],
        sessions_map: Dict[UUID, List[Session]]
    ) -> List[ScheduleResponseSchema]:
        """
        スケジュールデータをレスポンス形式に変換
        
        Args:
            schedules: スケジュールリスト
            sessions_map: セッション情報マップ
            
        Returns:
            レスポンス形式のスケジュールリスト
        """
        formatted_schedules = []
        
        for schedule in schedules:
            # 会場情報取得
            venue_data = await self._schedule_repository.get_venue_by_id(schedule.venue_id)
            venue = VenueSchema(
                id=schedule.venue_id,
                name=venue_data.get("name", "Unknown") if venue_data else "Unknown",
                capacity=venue_data.get("capacity") if venue_data else None,
                address=venue_data.get("address") if venue_data else None
            )
            
            # セッション情報
            sessions = sessions_map.get(schedule.id, [])
            session_responses = [
                SessionResponseSchema(
                    id=session.id,
                    schedule_id=session.schedule_id,
                    start_time=session.start_time,
                    end_time=session.end_time,
                    title=session.title,
                    description=session.description,
                    session_type=session.session_type,
                    priority=session.priority,
                    resources=session.resources,
                    location_in_venue=session.location_in_venue,
                    status=session.status,
                    created_at=session.created_at,
                    duration_minutes=session.duration_minutes(),
                    instructors=[],  # TODO: 担当者情報取得実装
                    parts=[]  # TODO: パート割り当て情報取得実装
                )
                for session in sessions
            ]
            
            # スケジュールレスポンス作成
            schedule_response = ScheduleResponseSchema(
                id=schedule.id,
                venue=venue,
                schedule_date=schedule.schedule_date,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                title=schedule.title,
                description=schedule.description,
                schedule_type=schedule.schedule_type,
                status=schedule.status,
                metadata=schedule.metadata,
                created_at=schedule.created_at,
                created_by=schedule.created_by,
                duration_minutes=schedule.duration_minutes(),
                sessions_count=len(sessions),
                sessions=session_responses
            )
            
            formatted_schedules.append(schedule_response)
        
        return formatted_schedules
    
    def _optimize_for_calendar(
        self, 
        schedules: List[PracticeSchedule], 
        year: int, 
        month: int
    ) -> List[CalendarDataSchema]:
        """
        カレンダー表示用にデータを最適化
        
        Args:
            schedules: スケジュールリスト
            year: 年
            month: 月
            
        Returns:
            カレンダー表示用データリスト
        """
        # 日付別にスケジュールをグループ化
        schedules_by_date = defaultdict(list)
        for schedule in schedules:
            schedules_by_date[schedule.schedule_date].append(schedule)
        
        calendar_data = []
        
        # 月のすべての日付について処理
        last_day = monthrange(year, month)[1]
        for day in range(1, last_day + 1):
            current_date = date(year, month, day)
            day_schedules = schedules_by_date.get(current_date, [])
            
            # 時間重複チェック
            has_conflicts = self._check_time_conflicts(day_schedules)
            
            # TODO: スケジュールをレスポンス形式に変換
            # 簡略化のため、基本情報のみ使用
            schedule_responses = []  # 実際の実装では_format_response_dataを使用
            
            calendar_data.append(CalendarDataSchema(
                date=current_date,
                schedules=schedule_responses,
                total_schedules=len(day_schedules),
                has_conflicts=has_conflicts
            ))
        
        return calendar_data
    
    def _optimize_for_calendar_week(
        self, 
        schedules: List[PracticeSchedule], 
        start_date: date, 
        end_date: date
    ) -> List[CalendarDataSchema]:
        """
        週別カレンダー表示用にデータを最適化
        
        Args:
            schedules: スケジュールリスト
            start_date: 週の開始日
            end_date: 週の終了日
            
        Returns:
            カレンダー表示用データリスト
        """
        schedules_by_date = defaultdict(list)
        for schedule in schedules:
            schedules_by_date[schedule.schedule_date].append(schedule)
        
        calendar_data = []
        current_date = start_date
        
        while current_date <= end_date:
            day_schedules = schedules_by_date.get(current_date, [])
            has_conflicts = self._check_time_conflicts(day_schedules)
            
            calendar_data.append(CalendarDataSchema(
                date=current_date,
                schedules=[],  # TODO: 実装
                total_schedules=len(day_schedules),
                has_conflicts=has_conflicts
            ))
            
            current_date += timedelta(days=1)
        
        return calendar_data
    
    def _check_time_conflicts(self, schedules: List[PracticeSchedule]) -> bool:
        """
        同日のスケジュール間で時間重複があるかチェック
        
        Args:
            schedules: 同日のスケジュールリスト
            
        Returns:
            重複がある場合True
        """
        if len(schedules) <= 1:
            return False
        
        for i, schedule1 in enumerate(schedules):
            for schedule2 in schedules[i+1:]:
                # 時間重複チェック
                if not (schedule1.end_time <= schedule2.start_time or 
                       schedule1.start_time >= schedule2.end_time):
                    return True
        
        return False
    
    def _calculate_schedule_type_counts(
        self, 
        schedules: List[PracticeSchedule]
    ) -> Dict[str, int]:
        """
        スケジュール種別の件数を計算
        
        Args:
            schedules: スケジュールリスト
            
        Returns:
            種別: 件数の辞書
        """
        type_counts = defaultdict(int)
        for schedule in schedules:
            type_counts[schedule.schedule_type] += 1
        
        return dict(type_counts)