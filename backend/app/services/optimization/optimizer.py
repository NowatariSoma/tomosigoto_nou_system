"""
メインのスケジューリング最適化クラス
"""
from __future__ import annotations

import time
import logging
from ortools.sat.python import cp_model
from app.services.optimization.models import (
    SchedulingProblem, SchedulingSolution, PracticeSession,
)
from app.services.optimization.constraints import SchedulingConstraints
from app.services.optimization.objectives import SchedulingObjectives
from app.services.optimization.constants import SchedulingConfig, ProblemConfig

logger = logging.getLogger(__name__)


class SchedulingOptimizer:
    """スケジューリング最適化のメインクラス"""
    
    def __init__(self, problem: SchedulingProblem):
        self.problem = problem
        self.constraints = SchedulingConstraints(problem)
        self.objectives = None  # 制約設定後に初期化
        
    def solve(self, time_limit_seconds: int = SchedulingConfig.DEFAULT_TIME_LIMIT, equality_weight: int = SchedulingConfig.DEFAULT_EQUALITY_WEIGHT) -> SchedulingSolution | None:
        """スケジューリング問題を解く"""
        model = self.constraints.setup_all_constraints()
        
        self.objectives = SchedulingObjectives(self.problem, self.constraints.session_vars)
        self.objectives.setup_objective(model, equality_weight)
        
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        
        start_time = time.time()
        status = solver.Solve(model)
        solve_time = time.time() - start_time
        
        # ステータスごとの詳細なログ出力
        if status == cp_model.OPTIMAL:
            logger.info("最適解が見つかりました")
            sessions = self._extract_solution(solver)
            objective_value = self._calculate_objective_value(sessions)
            
            return SchedulingSolution(
                sessions=sessions,
                objective_value=objective_value,
                is_optimal=True,
                solve_time_seconds=solve_time
            )
        elif status == cp_model.FEASIBLE:
            logger.info("実行可能解が見つかりました（最適ではない可能性があります）")
            sessions = self._extract_solution(solver)
            objective_value = self._calculate_objective_value(sessions)
            
            return SchedulingSolution(
                sessions=sessions,
                objective_value=objective_value,
                is_optimal=False,
                solve_time_seconds=solve_time
            )
        elif status == cp_model.INFEASIBLE:
            logger.error("制約が矛盾しています（実行不可能）")
            
            # 詳細な診断メッセージを生成
            error_details = self._diagnose_infeasibility()
            for detail in error_details:
                logger.error(f"  - {detail}")
            
            # エラー情報を例外に含める
            error_message = "最適化に失敗しました。以下の問題が考えられます:\n" + "\n".join(f"・{detail}" for detail in error_details)
            raise ValueError(error_message)
        elif status == cp_model.MODEL_INVALID:
            logger.error("モデルが不正です")
            logger.error("制約条件の設定に問題がある可能性があります")
            raise ValueError("最適化モデルが不正です。システム管理者に連絡してください。")
        else:
            logger.error(f"予期しないソルバーステータス: {status}")
            logger.error("最適化が完了しませんでした")
            raise ValueError(f"最適化が完了しませんでした（ステータス: {status}）")
    
    def _diagnose_infeasibility(self) -> list[str]:
        """実行不可能な理由を診断する"""
        # 基本情報を取得
        num_parts = len(self.problem.parts)
        num_time_slots = len(self.problem.time_slots)
        num_rooms = len(self.problem.rooms)
        instructors = [p for p in self.problem.players if p.is_instructor]
        num_instructors = len(instructors)
        
        # 1. 容量の基本チェック（各パートは1回だけ練習）
        total_capacity = num_time_slots * num_rooms
        if total_capacity < num_parts:
            min_slots_needed = (num_parts + num_rooms - 1) // num_rooms
            return [f"時間コマ数または部屋数が不足しています（{num_time_slots}コマ × {num_rooms}部屋 = {total_capacity}セッション < {num_parts}パート）。時間コマを{min_slots_needed}コマ以上に増やすか、部屋を追加してください。"]
        
        # 2. 指導者数の基本チェック
        if num_instructors == 0:
            return ["指導者が設定されていません。is_instructorフラグを持つユーザーを設定してください。"]
        
        # 3. 各パートに対応可能な指導者がいるかチェック
        parts_without_instructors = []
        for part in self.problem.parts:
            part_id = part["id"]
            part_name = part["name"]
            available_instructors = [p for p in instructors if part_id in p.part_ids]
            if not available_instructors:
                parts_without_instructors.append(part_name)
        
        if parts_without_instructors:
            parts_list = "、".join(parts_without_instructors)
            return [f"指導者不在のパートがあります: {parts_list}。各パートに少なくとも1人の指導者を割り当ててください。"]
        
        # 4. 均等割り振り制約の厳しさチェック
        if num_instructors > 1:
            # 各指導者が担当可能なパート数をカウント
            instructor_loads = {}
            for instructor in instructors:
                assignable_parts = [p for p in self.problem.parts if p["id"] in instructor.part_ids]
                instructor_loads[instructor.name] = len(assignable_parts)
            
            max_load = max(instructor_loads.values())
            min_load = min(instructor_loads.values())
            
            if max_load - min_load > 1:
                load_info = "、".join([f"{name}:{load}パート" for name, load in instructor_loads.items()])
                return [f"指導者間の担当可能パート数に差があり、均等割り振りできません（{load_info}）。指導者のパート割り当てを調整してください。"]
            
            # 時間コマ数が少なすぎる場合
            if num_time_slots < 3 and num_parts >= num_instructors * 2:
                return [f"時間コマ数が少なく、制約を満たせません（現在{num_time_slots}コマ）。時間コマを{num_time_slots + 1}コマ以上に増やしてください。"]
        
        # 5. 指導者の自パート制約の問題チェック
        instructor_own_parts_count = sum(1 for inst in instructors if any(p["id"] in inst.part_ids for p in self.problem.parts))
        if instructor_own_parts_count > 0 and num_time_slots < 3:
            return [f"指導者が自分のパートにも所属しており、時間コマ数({num_time_slots}コマ)が不足しています。指導者は自パート練習時に他パートを指導できないため、時間コマを増やしてください。"]
        
        # 6. デフォルトメッセージ
        return ["制約条件が複雑で解を見つけられませんでした。時間コマ数を増やす、部屋数を増やす、または指導者の割り当てを調整してください。"]
    
    
    def _extract_solution(self, solver: cp_model.CpSolver) -> list[PracticeSession]:
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
    
    def _calculate_objective_value(self, sessions: list[PracticeSession]) -> float:
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
        
        # デバッグレベルのログに変更
        debug_lines = []
        
        # ヘッダー
        header = "時間\\部屋"
        for room in self.problem.rooms:
            header += f"\t{room.name}"
        debug_lines.append(header)
        
        # 各行
        for time_slot in self.problem.time_slots:
            row = f"{time_slot.name}"
            for room in self.problem.rooms:
                sessions = schedule_matrix.get(time_slot.id, {}).get(room.id, [])
                if sessions:
                    # 複数セッションがある場合はカンマ区切りで表示
                    session_strs = []
                    for session in sessions:
                        instructor = next(
                            (i for i in self.problem.players if i.id == session.instructor_id),
                            None
                        )
                        if instructor:
                            # 型安全性を確保（nameは常にstr）
                            instructor_name = str(instructor.name) if instructor.name else f"指導者{instructor.id}"
                            session_strs.append(f"{session.part_name}({instructor_name})")
                        else:
                            # 指導者が見つからない場合のフォールバック
                            session_strs.append(f"{session.part_name}(指導者{session.instructor_id})")
                    row += f"\t{','.join(session_strs)}"
                else:
                    row += "\t-"
            debug_lines.append(row)
        
        # ロガーでデバッグ出力（本番環境では無効化される）
        logger.debug("最適化解のスケジュール表:\n%s", "\n".join(debug_lines))


