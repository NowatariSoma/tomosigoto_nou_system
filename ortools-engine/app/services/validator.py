"""
制約検証サービス

スケジュール最適化の制約条件を検証
"""

from typing import List, Dict, Any, Optional
import structlog

from ..models.schedule import Member, Venue, Constraints
from ..models.optimization import OptimizationRequest

logger = structlog.get_logger(__name__)


class ConstraintValidator:
    """制約条件検証クラス"""
    
    def __init__(self):
        """初期化"""
        self.validation_errors = []
    
    def validate_request(self, request: OptimizationRequest) -> bool:
        """
        最適化リクエストの制約検証
        
        Args:
            request: 最適化リクエスト
            
        Returns:
            bool: 検証結果
        """
        self.validation_errors = []
        
        # 基本データ検証
        if not self._validate_basic_data(request):
            return False
        
        # メンバー制約検証
        if not self._validate_member_constraints(request):
            return False
        
        # 会場制約検証
        if not self._validate_venue_constraints(request):
            return False
        
        # スケジュール制約検証
        if not self._validate_schedule_constraints(request):
            return False
        
        # カスタム制約検証
        if request.constraints and not self._validate_custom_constraints(request):
            return False
        
        return len(self.validation_errors) == 0
    
    def _validate_basic_data(self, request: OptimizationRequest) -> bool:
        """基本データの検証"""
        if not request.schedule_data:
            self.validation_errors.append("スケジュールデータが指定されていません")
            return False
        
        if not request.schedule_data.start_date:
            self.validation_errors.append("開始日が指定されていません")
            return False
        
        if not request.schedule_data.end_date:
            self.validation_errors.append("終了日が指定されていません")
            return False
        
        if not request.schedule_data.practice_days:
            self.validation_errors.append("練習日が指定されていません")
            return False
        
        return True
    
    def _validate_member_constraints(self, request: OptimizationRequest) -> bool:
        """メンバー制約の検証"""
        if not request.members:
            self.validation_errors.append("メンバーが指定されていません")
            return False
        
        # メンバーIDの重複チェック
        member_ids = [member.id for member in request.members]
        if len(member_ids) != len(set(member_ids)):
            self.validation_errors.append("メンバーIDに重複があります")
            return False
        
        # メンバー名の重複チェック
        member_names = [member.name for member in request.members]
        if len(member_names) != len(set(member_names)):
            self.validation_errors.append("メンバー名に重複があります")
            return False
        
        # 各メンバーの必須フィールドチェック
        for member in request.members:
            if not member.id:
                self.validation_errors.append(f"メンバーIDが空です: {member.name}")
                return False
            
            if not member.name:
                self.validation_errors.append(f"メンバー名が空です: {member.id}")
                return False
            
            if not member.part:
                self.validation_errors.append(f"パートが指定されていません: {member.name}")
                return False
            
            if not member.availability:
                self.validation_errors.append(f"利用可能日が指定されていません: {member.name}")
                return False
        
        return True
    
    def _validate_venue_constraints(self, request: OptimizationRequest) -> bool:
        """会場制約の検証"""
        if not request.venues:
            self.validation_errors.append("会場が指定されていません")
            return False
        
        # 会場IDの重複チェック
        venue_ids = [venue.id for venue in request.venues]
        if len(venue_ids) != len(set(venue_ids)):
            self.validation_errors.append("会場IDに重複があります")
            return False
        
        # 会場名の重複チェック
        venue_names = [venue.name for venue in request.venues]
        if len(venue_names) != len(set(venue_names)):
            self.validation_errors.append("会場名に重複があります")
            return False
        
        # 各会場の必須フィールドチェック
        for venue in request.venues:
            if not venue.id:
                self.validation_errors.append(f"会場IDが空です: {venue.name}")
                return False
            
            if not venue.name:
                self.validation_errors.append(f"会場名が空です: {venue.id}")
                return False
            
            if venue.capacity <= 0:
                self.validation_errors.append(f"会場容量が無効です: {venue.name} (容量: {venue.capacity})")
                return False
            
            if not venue.available_times:
                self.validation_errors.append(f"利用可能時間が指定されていません: {venue.name}")
                return False
        
        # 総容量チェック
        total_capacity = sum(venue.capacity for venue in request.venues)
        member_count = len(request.members)
        
        if total_capacity < member_count:
            self.validation_errors.append(
                f"会場の総容量が不足しています (総容量: {total_capacity}, メンバー数: {member_count})"
            )
            return False
        
        return True
    
    def _validate_schedule_constraints(self, request: OptimizationRequest) -> bool:
        """スケジュール制約の検証"""
        # 日付形式の検証（簡易版）
        try:
            from datetime import datetime
            start_date = datetime.strptime(request.schedule_data.start_date, "%Y-%m-%d")
            end_date = datetime.strptime(request.schedule_data.end_date, "%Y-%m-%d")
            
            if start_date >= end_date:
                self.validation_errors.append("開始日は終了日より前である必要があります")
                return False
            
        except ValueError:
            self.validation_errors.append("日付形式が無効です (YYYY-MM-DD形式で指定してください)")
            return False
        
        # 練習日の検証
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        for day in request.schedule_data.practice_days:
            if day.lower() not in valid_days:
                self.validation_errors.append(f"無効な練習日です: {day}")
                return False
        
        return True
    
    def _validate_custom_constraints(self, request: OptimizationRequest) -> bool:
        """カスタム制約の検証"""
        constraints = request.constraints
        
        if constraints.max_practice_hours_per_week <= 0:
            self.validation_errors.append("週最大練習時間は正の値である必要があります")
            return False
        
        if constraints.min_members_per_session <= 0:
            self.validation_errors.append("セッション最小人数は正の値である必要があります")
            return False
        
        if constraints.max_sessions_per_day <= 0:
            self.validation_errors.append("1日の最大セッション数は正の値である必要があります")
            return False
        
        if constraints.min_break_time < 0:
            self.validation_errors.append("最小休憩時間は0以上である必要があります")
            return False
        
        # メンバー数と最小人数の整合性チェック
        if constraints.min_members_per_session > len(request.members):
            self.validation_errors.append(
                f"セッション最小人数がメンバー数を超えています (最小人数: {constraints.min_members_per_session}, メンバー数: {len(request.members)})"
            )
            return False
        
        return True
    
    def get_validation_errors(self) -> List[str]:
        """検証エラーの取得"""
        return self.validation_errors.copy()
    
    def get_validation_summary(self) -> Dict[str, Any]:
        """検証結果のサマリー取得"""
        return {
            "is_valid": len(self.validation_errors) == 0,
            "error_count": len(self.validation_errors),
            "errors": self.validation_errors
        }
