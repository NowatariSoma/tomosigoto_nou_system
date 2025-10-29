"""
メインのスケジューリング最適化クラス
"""
import time
from typing import List, Optional
from ortools.sat.python import cp_model
from app.services.optimization.models import (
    SchedulingProblem, SchedulingSolution, PracticeSession, 
    Player, Room, TimeSlot
)
from app.services.optimization.constraints import SchedulingConstraints
from app.services.optimization.objectives import SchedulingObjectives
from app.services.optimization.constants import SchedulingConfig, ProblemConfig


class SchedulingOptimizer:
    """スケジューリング最適化のメインクラス"""
    
    def __init__(self, problem: SchedulingProblem):
        self.problem = problem
        self.constraints = SchedulingConstraints(problem)
        self.objectives = None  # 制約設定後に初期化
        
    def solve(self, time_limit_seconds: int = SchedulingConfig.DEFAULT_TIME_LIMIT, equality_weight: int = SchedulingConfig.DEFAULT_EQUALITY_WEIGHT) -> Optional[SchedulingSolution]:
        """スケジューリング問題を解く"""
        model = self.constraints.setup_all_constraints()
        
        self.objectives = SchedulingObjectives(self.problem, self.constraints.session_vars)
        self.objectives.setup_objective(model, equality_weight)
        
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        
        start_time = time.time()
        status = solver.Solve(model)
        solve_time = time.time() - start_time
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            sessions = self._extract_solution(solver)
            objective_value = self._calculate_objective_value(sessions)
            
            return SchedulingSolution(
                sessions=sessions,
                objective_value=objective_value,
                is_optimal=(status == cp_model.OPTIMAL),
                solve_time_seconds=solve_time
            )
        else:
            return None
    
    
    def _extract_solution(self, solver: cp_model.CpSolver) -> List[PracticeSession]:
        """ソルバーの解から練習セッションを抽出"""
        sessions = []
        session_id = 0
        
        for part in self.problem.parts:
            part_id = part["id"]
            part_name = part["name"]
            for room in self.problem.rooms:
                for time_slot in self.problem.time_slots:
                    for instructor in self.problem.players:
                        if instructor.is_instructor:
                            var = self.constraints.session_vars.get((part_id, room.id, time_slot.id, instructor.id))
                            if var is not None and solver.Value(var) == 1:
                                # 参加プレイヤーを取得
                                player_ids = [p.id for p in self.problem.get_players_by_part(part_id)]
                                
                                session = PracticeSession(
                                    id=session_id,
                                    part_id=part_id,
                                    part_name=part_name,
                                    room_id=room.id,
                                    time_slot_id=time_slot.id,
                                    instructor_id=instructor.id,
                                    player_ids=player_ids
                                )
                                sessions.append(session)
                                session_id += 1
        
        return sessions
    
    def _calculate_objective_value(self, sessions: List[PracticeSession]) -> float:
        """目的関数の値を計算"""
        # 指導者ごとのセッション数を計算
        instructor_counts = {}
        for session in sessions:
            instructor_id = session.instructor_id
            instructor_counts[instructor_id] = instructor_counts.get(instructor_id, 0) + 1
        
        if not instructor_counts:
            return 0.0
        
        # 分散を計算
        counts = list(instructor_counts.values())
        mean_count = sum(counts) / len(counts)
        variance = sum((count - mean_count) ** 2 for count in counts) / len(counts)
        
        return -variance  # 分散を最小化したいので負の値を返す
    
    def print_solution(self, solution: SchedulingSolution):
        """解を分かりやすく表示（デバッグ用）"""
        if not solution:
            return
        
        # 指導者ごとのセッション数
        instructor_counts = {}
        for session in solution.sessions:
            instructor_id = session.instructor_id
            instructor_counts[instructor_id] = instructor_counts.get(instructor_id, 0) + 1
        
        # スケジュール表を表示
        schedule_matrix = solution.get_schedule_matrix()
        
        # ヘッダー
        print("時間\\部屋", end="")
        for room in self.problem.rooms:
            print(f"\t{room.name}", end="")
        print()
        
        # 各行
        for time_slot in self.problem.time_slots:
            print(f"{time_slot.name}", end="")
            for room in self.problem.rooms:
                sessions = schedule_matrix.get(time_slot.id, {}).get(room.id, [])
                if sessions:
                    # 複数セッションがある場合はカンマ区切りで表示
                    session_strs = []
                    for session in sessions:
                        instructor = next(i for i in self.problem.players if i.id == session.instructor_id)
                        session_strs.append(f"{session.part_name}({instructor.name})")
                    print(f"\t{','.join(session_strs)}", end="")
                else:
                    print(f"\t-", end="")
            print()


