"""
OR-Tools最適化エンジン

制約プログラミングを使用してスケジュール最適化を実行
"""

import time
from typing import List, Dict, Any, Optional, Tuple
from ortools.sat.python import cp_model
import structlog

from ..models.schedule import (
    ScheduleData, Member, Venue, Constraints,
    OptimizedSchedule, Session, Assignment, OptimizationResult
)
from ..models.optimization import OptimizationRequest

logger = structlog.get_logger(__name__)


class ORToolsOptimizer:
    """OR-Toolsを使用したスケジュール最適化エンジン"""
    
    def __init__(self, timeout_seconds: int = 30):
        """
        初期化
        
        Args:
            timeout_seconds: 最適化タイムアウト（秒）
        """
        self.timeout_seconds = timeout_seconds
        self.model = None
        self.solver = None
        
    def optimize_schedule(self, request: OptimizationRequest) -> OptimizationResult:
        """
        スケジュール最適化を実行
        
        Args:
            request: 最適化リクエスト
            
        Returns:
            OptimizationResult: 最適化結果
        """
        start_time = time.time()
        
        try:
            # 制約検証
            if not self._validate_constraints(request):
                return self._create_error_result("制約条件が満たされません", start_time)
            
            # 最適化モデル構築
            self._build_optimization_model(request)
            
            # 最適化実行
            status = self._solve_optimization()
            
            if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
                # 結果の構築
                result = self._build_optimization_result(request, start_time, status)
                logger.info("最適化完了", status=status, processing_time=result.processing_time)
                return result
            else:
                logger.warning("最適化失敗", status=status)
                return self._create_error_result(f"最適化に失敗しました (ステータス: {status})", start_time)
                
        except Exception as e:
            logger.error("最適化中にエラーが発生", error=str(e))
            return self._create_error_result(f"最適化中にエラーが発生しました: {str(e)}", start_time)
    
    def _validate_constraints(self, request: OptimizationRequest) -> bool:
        """制約条件の検証"""
        # 基本的な制約チェック
        if not request.members:
            return False
        if not request.venues:
            return False
        if not request.schedule_data.practice_days:
            return False
        
        # 会場容量チェック
        total_capacity = sum(venue.capacity for venue in request.venues)
        if total_capacity < len(request.members):
            logger.warning("会場容量不足", total_capacity=total_capacity, member_count=len(request.members))
            return False
        
        return True
    
    def _build_optimization_model(self, request: OptimizationRequest):
        """最適化モデルの構築"""
        self.model = cp_model.CpModel()
        
        # パラメータ設定
        scenes = self._create_scenes_from_members(request.members)
        rooms = request.venues
        timeslots = self._create_timeslots(request.schedule_data)
        
        # 変数定義: x[scene, room, timeslot] = 1 if scene is assigned to room at timeslot
        x = {}
        for scene_idx, scene in enumerate(scenes):
            for room_idx, room in enumerate(rooms):
                for timeslot_idx, timeslot in enumerate(timeslots):
                    x[scene_idx, room_idx, timeslot_idx] = self.model.NewBoolVar(
                        f'x_{scene_idx}_{room_idx}_{timeslot_idx}'
                    )
        
        # 制約1: 各場面は必ず1つの部屋・時間帯に割り当てられる
        for scene_idx in range(len(scenes)):
            self.model.Add(
                sum(x[scene_idx, room_idx, timeslot_idx] 
                    for room_idx in range(len(rooms)) 
                    for timeslot_idx in range(len(timeslots))) == 1
            )
        
        # 制約2: 各部屋・時間帯には最大1つの場面
        for room_idx in range(len(rooms)):
            for timeslot_idx in range(len(timeslots)):
                self.model.Add(
                    sum(x[scene_idx, room_idx, timeslot_idx] 
                        for scene_idx in range(len(scenes))) <= 1
                )
        
        # 制約3: 会場容量制約
        for room_idx, room in enumerate(rooms):
            for timeslot_idx in range(len(timeslots)):
                # その時間帯にその部屋に割り当てられる場面の人数合計が容量以下
                total_people = sum(
                    len(scene['members']) * x[scene_idx, room_idx, timeslot_idx]
                    for scene_idx, scene in enumerate(scenes)
                )
                self.model.Add(total_people <= room.capacity)
        
        # 目標関数: 場面の優先度の最大化
        objective_terms = []
        for scene_idx, scene in enumerate(scenes):
            for room_idx, room in enumerate(rooms):
                for timeslot_idx, timeslot in enumerate(timeslots):
                    # 場面の優先度 × 会場の優先度 × 時間帯の優先度
                    priority_score = (
                        scene['priority'] * 
                        room.priority * 
                        timeslot['priority']
                    )
                    objective_terms.append(priority_score * x[scene_idx, room_idx, timeslot_idx])
        
        self.model.Maximize(sum(objective_terms))
        
        # ソルバー初期化
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = self.timeout_seconds
        
        # 変数とスケジュール情報を保存
        self._scenes = scenes
        self._rooms = rooms
        self._timeslots = timeslots
        self._x = x
    
    def _create_scenes_from_members(self, members: List[Member]) -> List[Dict[str, Any]]:
        """メンバーから場面を作成"""
        scenes = []
        
        # パート別にグループ化
        part_groups = {}
        for member in members:
            if member.part not in part_groups:
                part_groups[member.part] = []
            part_groups[member.part].append(member)
        
        # 各パートを場面として定義
        for part, part_members in part_groups.items():
            scenes.append({
                'id': f'scene_{part}',
                'name': part,
                'members': [m.id for m in part_members],
                'priority': self._get_part_priority(part),
                'category': self._get_part_category(part)
            })
        
        return scenes
    
    def _get_part_priority(self, part: str) -> int:
        """パートの優先度を取得"""
        priority_map = {
            'シテ': 5,
            'ワキ': 4,
            '舞囃子': 4,
            '地謡': 3,
            '謡': 3,
            '笛': 3,
            '囃子': 3,
            '仕舞': 3,
            '小鼓': 2,
            '大鼓': 2,
            '太鼓': 2,
            '地拍子': 2,
        }
        return priority_map.get(part, 1)
    
    def _get_part_category(self, part: str) -> str:
        """パートのカテゴリを取得"""
        category_map = {
            'シテ': '役柄',
            'ワキ': '役柄',
            '舞囃子': '舞',
            '地謡': '歌',
            '謡': '歌',
            '笛': '楽器',
            '囃子': '楽器',
            '仕舞': '舞',
            '小鼓': '楽器',
            '大鼓': '楽器',
            '太鼓': '楽器',
            '地拍子': '楽器',
        }
        return category_map.get(part, 'その他')
    
    def _create_timeslots(self, schedule_data: ScheduleData) -> List[Dict[str, Any]]:
        """時間帯を作成"""
        timeslots = []
        
        # 基本的な時間帯設定（1日4時間帯想定）
        time_ranges = [
            {'start': '09:00', 'end': '12:00', 'priority': 3},
            {'start': '13:00', 'end': '16:00', 'priority': 4},
            {'start': '16:00', 'end': '19:00', 'priority': 3},
            {'start': '19:00', 'end': '22:00', 'priority': 2},
        ]
        
        for i, time_range in enumerate(time_ranges):
            timeslots.append({
                'id': f'timeslot_{i}',
                'start_time': time_range['start'],
                'end_time': time_range['end'],
                'priority': time_range['priority']
            })
        
        return timeslots
    
    def _solve_optimization(self) -> int:
        """最適化実行"""
        if not self.solver or not self.model:
            raise ValueError("モデルが初期化されていません")
        
        status = self.solver.Solve(self.model)
        return status
    
    def _build_optimization_result(self, request: OptimizationRequest, start_time: float, status: int) -> OptimizationResult:
        """最適化結果の構築"""
        processing_time = time.time() - start_time
        
        # 最適化されたスケジュールを構築
        sessions = []
        assignments = {}
        
        for scene_idx, scene in enumerate(self._scenes):
            for room_idx, room in enumerate(self._rooms):
                for timeslot_idx, timeslot in enumerate(self._timeslots):
                    if self.solver.Value(self._x[scene_idx, room_idx, timeslot_idx]) == 1:
                        # セッション作成
                        session = Session(
                            id=f"session_{scene_idx}_{room_idx}_{timeslot_idx}",
                            date=request.schedule_data.start_date,  # 簡略化
                            time=f"{timeslot['start_time']}-{timeslot['end_time']}",
                            venue=room.name,
                            members=scene['members'],
                            part=scene['name'],
                            duration=180,  # 3時間固定
                            priority=scene['priority']
                        )
                        sessions.append(session)
                        
                        # 割り当て情報更新
                        for member_id in scene['members']:
                            if member_id not in assignments:
                                assignments[member_id] = []
                            assignments[member_id].append(session.id)
        
        # 会場利用率計算
        venue_utilization = {}
        for room in self._rooms:
            assigned_sessions = [s for s in sessions if s.venue == room.name]
            utilization = len(assigned_sessions) / len(self._timeslots) if self._timeslots else 0
            venue_utilization[room.name] = utilization
        
        # 最適化スコア計算
        total_priority = sum(session.priority for session in sessions)
        max_possible_priority = sum(scene['priority'] for scene in self._scenes)
        reward = total_priority / max_possible_priority if max_possible_priority > 0 else 0
        
        optimized_schedule = OptimizedSchedule(
            sessions=sessions,
            assignments=assignments,
            total_sessions=len(sessions),
            total_practice_time=len(sessions) * 180,
            venue_utilization=venue_utilization
        )
        
        return OptimizationResult(
            optimized_schedule=optimized_schedule,
            reward=reward,
            processing_time=processing_time,
            model_version="ortools-v1.0.0",
            constraints_satisfied=True,
            optimization_status="OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"
        )
    
    def _create_error_result(self, error_message: str, start_time: float) -> OptimizationResult:
        """エラー結果の作成"""
        processing_time = time.time() - start_time
        
        return OptimizationResult(
            optimized_schedule=OptimizedSchedule(
                sessions=[],
                assignments={},
                total_sessions=0,
                total_practice_time=0,
                venue_utilization={}
            ),
            reward=0.0,
            processing_time=processing_time,
            model_version="ortools-v1.0.0",
            constraints_satisfied=False,
            optimization_status="ERROR"
        )
