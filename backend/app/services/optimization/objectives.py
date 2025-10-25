"""
スケジューリング最適化の目的関数
"""
from typing import List, Optional
from ortools.sat.python import cp_model
from app.services.optimization.models import SchedulingProblem
from app.services.optimization.constants import ConstraintLimits


class SchedulingObjectives:
    """スケジューリングの目的関数を管理するクラス"""
    
    def __init__(self, problem: SchedulingProblem, session_vars: dict):
        self.problem = problem
        self.session_vars = session_vars
    
    def setup_objective(self, model: cp_model.CpModel, equality_weight: int = 100):
        """目的関数を設定"""
        # 均等割り振りの目的関数（重み付き）
        equality_objective = self.create_equality_objective(model, equality_weight)
        
        # プレイヤー制約違反ペナルティ（個人別優先度）
        player_penalty = self.create_player_penalty(model)
        
        # 目的関数を設定
        if player_penalty is not None:
            model.Minimize(equality_objective + player_penalty)
        else:
            model.Minimize(equality_objective)
    
    def create_equality_objective(self, model: cp_model.CpModel, weight: int = 100):
        """均等割り振りの目的関数を作成（重み付き）"""
        instructor_session_counts = []
        for instructor in self.problem.players:
            if not instructor.is_instructor:
                continue
                
            sessions = []
            for part in self.problem.parts:
                part_id = part["id"]
                for room in self.problem.rooms:
                    for time_slot in self.problem.time_slots:
                        if (part_id, room.id, time_slot.id, instructor.id) in self.session_vars:
                            sessions.append(
                                self.session_vars[(part_id, room.id, time_slot.id, instructor.id)]
                            )
            instructor_session_counts.append(sum(sessions))
        
        # セッション数の分散を最小化
        if len(instructor_session_counts) > 1:
            # 分散を最小化（簡略化：最大値と最小値の差を最小化）
            max_var = model.NewIntVar(0, ConstraintLimits.MAX_SESSIONS, "max_sessions")
            min_var = model.NewIntVar(0, ConstraintLimits.MAX_SESSIONS, "min_sessions")
            
            for count in instructor_session_counts:
                model.Add(count <= max_var)
                model.Add(count >= min_var)
            
            # 重みを適用
            weighted_difference = model.NewIntVar(0, ConstraintLimits.MAX_WEIGHTED_EQUALITY, "weighted_equality")
            model.Add(weighted_difference == (max_var - min_var) * weight)
            return weighted_difference
        else:
            # 指導者が1人の場合は単純にセッション数を最大化
            return -sum(instructor_session_counts)  # 最大化のため負の値を返す
    
    def create_player_penalty(self, model: cp_model.CpModel):
        """パート×個人優先度に基づくペナルティを作成"""
        total_penalty = []
        
        for player in self.problem.players:
            if player.is_instructor:
                continue
            
            for time_slot in self.problem.time_slots:
                # 1. この時間にスケジュールされた所属パートを列挙
                scheduled_assignments = []
                for assignment in player.part_assignments:
                    part_id = assignment.part_id
                    for room in self.problem.rooms:
                        for instructor in self.problem.players:
                            if instructor.is_instructor:
                                var = self.session_vars.get((part_id, room.id, time_slot.id, instructor.id))
                                if var is not None:
                                    scheduled_assignments.append((assignment, var))
                
                if len(scheduled_assignments) <= 1:
                    continue  # 重複なし
                
                # 2. 各パートへの参加/不参加を表す変数
                attend_vars = {}
                for assignment, session_var in scheduled_assignments:
                    part_id = assignment.part_id
                    attend_var = model.NewBoolVar(f"attend_{player.id}_{part_id}_{time_slot.id}")
                    attend_vars[part_id] = (attend_var, assignment.priority)
                    
                    # セッションがない場合は参加できない
                    model.Add(attend_var <= session_var)
                
                # 3. 最大1つのパートにのみ参加
                model.Add(sum(attend_var for attend_var, _ in attend_vars.values()) <= 1)
                
                # 4. ペナルティ = 参加しなかったパートの優先度の合計
                for part_id, (attend_var, priority) in attend_vars.items():
                    # not_attend = 1 - attend
                    not_attend = model.NewBoolVar(f"not_attend_{player.id}_{part_id}_{time_slot.id}")
                    model.Add(not_attend == 1 - attend_var)
                    
                    # penalty = not_attend * priority
                    penalty_var = model.NewIntVar(0, 100, f"penalty_{player.id}_{part_id}_{time_slot.id}")
                    model.AddMultiplicationEquality(penalty_var, [not_attend, priority])
                    
                    total_penalty.append(penalty_var)
        
        return sum(total_penalty) if total_penalty else None
