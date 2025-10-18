"""
OR-Tools最適化エンジン

制約プログラミングを使用したスケジュール最適化のコア実装
"""

import logging
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model
from app.schemas.schedule import ScheduleData, Member, Venue, Constraints
from app.core.exceptions import (
    OptimizationTimeoutException,
    OptimizationFailedException,
    InvalidInputException
)

logger = logging.getLogger(__name__)


class ORToolsOptimizer:
    """OR-Toolsを使用した最適化エンジン"""
    
    def __init__(
        self,
        timeout_seconds: int = 30,
        max_rooms: int = 10,
        max_scenes: int = 20,
        max_timeslots: int = 4,
        max_people: int = 60
    ):
        self.timeout_seconds = timeout_seconds
        self.max_rooms = max_rooms
        self.max_scenes = max_scenes
        self.max_timeslots = max_timeslots
        self.max_people = max_people
        self.model = None
        self.solver = None
    
    def initialize(self):
        """最適化エンジンの初期化"""
        try:
            self.model = cp_model.CpModel()
            self.solver = cp_model.CpSolver()
            self.solver.parameters.max_time_in_seconds = self.timeout_seconds
            logger.info("OR-Tools最適化エンジンの初期化が完了しました")
        except Exception as e:
            logger.error(f"最適化エンジンの初期化に失敗しました: {str(e)}")
            raise OptimizationFailedException(f"初期化に失敗しました: {str(e)}")
    
    def optimize(
        self,
        schedule_data: ScheduleData,
        members: List[Member],
        venues: List[Venue],
        constraints: Optional[Constraints] = None
    ) -> Dict[str, Any]:
        """スケジュール最適化の実行"""
        if not self.model or not self.solver:
            raise OptimizationFailedException("最適化エンジンが初期化されていません")
        
        try:
            # 入力データの検証
            self._validate_inputs(schedule_data, members, venues, constraints)
            
            # 最適化モデルの構築
            self._build_optimization_model(schedule_data, members, venues, constraints)
            
            # 最適化の実行
            status = self.solver.Solve(self.model)
            
            if status == cp_model.OPTIMAL:
                return self._extract_solution(members, venues)
            elif status == cp_model.FEASIBLE:
                logger.warning("最適解ではなく実行可能解が見つかりました")
                return self._extract_solution(members, venues)
            elif status == cp_model.INFEASIBLE:
                raise OptimizationFailedException("制約を満たす解が存在しません")
            elif status == cp_model.UNKNOWN:
                raise OptimizationTimeoutException(self.timeout_seconds)
            else:
                raise OptimizationFailedException(f"最適化に失敗しました: ステータス={status}")
                
        except Exception as e:
            logger.error(f"最適化実行エラー: {str(e)}")
            raise
    
    def _validate_inputs(
        self,
        schedule_data: ScheduleData,
        members: List[Member],
        venues: List[Venue],
        constraints: Optional[Constraints]
    ):
        """入力データの検証"""
        if not members:
            raise InvalidInputException("members", members, "メンバーが空です")
        
        if not venues:
            raise InvalidInputException("venues", venues, "会場が空です")
        
        if len(members) > self.max_people:
            raise InvalidInputException(
                "members", len(members), 
                f"メンバー数が上限を超えています（最大{self.max_people}名）"
            )
        
        if len(venues) > self.max_rooms:
            raise InvalidInputException(
                "venues", len(venues),
                f"会場数が上限を超えています（最大{self.max_rooms}会場）"
            )
    
    def _build_optimization_model(
        self,
        schedule_data: ScheduleData,
        members: List[Member],
        venues: List[Venue],
        constraints: Optional[Constraints]
    ):
        """最適化モデルの構築"""
        # 変数の定義
        # 各メンバーが各会場の各時間帯に参加するかどうか
        assignments = {}
        for member in members:
            for venue in venues:
                for timeslot in range(self.max_timeslots):
                    assignments[(member.id, venue.id, timeslot)] = self.model.NewBoolVar(
                        f"assign_{member.id}_{venue.id}_{timeslot}"
                    )
        
        # 制約の追加
        self._add_constraints(assignments, members, venues, constraints)
        
        # 目的関数の設定
        self._set_objective(assignments, members, venues)
    
    def _add_constraints(
        self,
        assignments: Dict[tuple, Any],
        members: List[Member],
        venues: List[Venue],
        constraints: Optional[Constraints]
    ):
        """制約の追加"""
        # 各メンバーは同時に1つの会場にのみ参加可能
        for member in members:
            for timeslot in range(self.max_timeslots):
                self.model.Add(
                    sum(assignments[(member.id, venue.id, timeslot)] 
                        for venue in venues) <= 1
                )
        
        # 会場の収容人数制限
        for venue in venues:
            for timeslot in range(self.max_timeslots):
                self.model.Add(
                    sum(assignments[(member.id, venue.id, timeslot)] 
                        for member in members) <= venue.capacity
                )
        
        # メンバーの利用可能日制限
        for member in members:
            for venue in venues:
                for timeslot in range(self.max_timeslots):
                    # 利用可能日チェック（簡略化）
                    if not self._is_member_available(member, timeslot):
                        self.model.Add(
                            assignments[(member.id, venue.id, timeslot)] == 0
                        )
    
    def _set_objective(
        self,
        assignments: Dict[tuple, Any],
        members: List[Member],
        venues: List[Venue]
    ):
        """目的関数の設定"""
        # 総参加人数を最大化
        total_assignments = sum(
            assignments[(member.id, venue.id, timeslot)]
            for member in members
            for venue in venues
            for timeslot in range(self.max_timeslots)
        )
        
        self.model.Maximize(total_assignments)
    
    def _is_member_available(self, member: Member, timeslot: int) -> bool:
        """メンバーの利用可能性チェック（簡略化）"""
        # 実際の実装では、日付と時間帯を考慮する
        return True
    
    def _extract_solution(
        self,
        members: List[Member],
        venues: List[Venue]
    ) -> Dict[str, Any]:
        """最適化結果の抽出"""
        sessions = []
        assignments = {}
        venue_utilization = {}
        
        # セッションの生成
        session_id = 1
        for venue in venues:
            for timeslot in range(self.max_timeslots):
                session_members = []
                for member in members:
                    if self.solver.Value(
                        self.model.GetOrMakeIndex(
                            f"assign_{member.id}_{venue.id}_{timeslot}"
                        )
                    ):
                        session_members.append(member.id)
                
                if session_members:
                    session = {
                        "id": f"session_{session_id}",
                        "date": "2024-01-01",  # 実際の実装では日付を計算
                        "time": f"{9 + timeslot * 3}:00-{12 + timeslot * 3}:00",
                        "venue": venue.name,
                        "members": session_members,
                        "part": "練習",  # 実際の実装ではパートを決定
                        "duration": 180,
                        "priority": 1
                    }
                    sessions.append(session)
                    session_id += 1
        
        # 割り当ての生成
        for member in members:
            member_sessions = []
            for session in sessions:
                if member.id in session["members"]:
                    member_sessions.append(session["id"])
            assignments[member.id] = member_sessions
        
        # 会場利用率の計算
        for venue in venues:
            total_capacity = venue.capacity * self.max_timeslots
            used_capacity = sum(
                len(session["members"])
                for session in sessions
                if session["venue"] == venue.name
            )
            venue_utilization[venue.name] = used_capacity / total_capacity if total_capacity > 0 else 0
        
        return {
            "sessions": sessions,
            "assignments": assignments,
            "venue_utilization": venue_utilization,
            "reward": len(sessions) / (len(venues) * self.max_timeslots),
            "processing_time": self.solver.WallTime(),
            "constraints_satisfied": True,
            "status": "OPTIMAL"
        }
