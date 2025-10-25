"""
データモデルの定義
"""
from dataclasses import dataclass
from typing import List, Dict, Optional
from app.services.optimization.constants import ProblemConfig


@dataclass
class PartAssignment:
    """パート割り当てと優先度"""
    part_id: str      # パートID（UUID）
    part_name: str    # パート名
    priority: int = 50  # 0-100、デフォルト50


@dataclass
class Player:
    """プレイヤー（参加者）"""
    id: int
    name: str
    part_assignments: List[PartAssignment]  # パート割り当てと優先度
    is_instructor: bool = False  # 指導者かどうか
    
    @property
    def part_ids(self) -> List[str]:
        """所属パートIDのリスト"""
        return [pa.part_id for pa in self.part_assignments]


@dataclass
class Room:
    """練習室"""
    id: int
    name: str


@dataclass
class TimeSlot:
    """時間コマ"""
    id: int
    name: str  # 例: "1限目", "2限目", "3限目"


@dataclass
class PracticeSession:
    """練習セッション"""
    id: int
    part_id: str      # UUID
    part_name: str    # 表示用
    room_id: int
    time_slot_id: int
    instructor_id: int
    player_ids: List[int]  # 参加プレイヤーのIDリスト


@dataclass
class SchedulingProblem:
    """スケジューリング問題の全体設定"""
    players: List[Player]  # プレイヤーリスト（指導者含む）
    rooms: List[Room]
    time_slots: List[TimeSlot]
    parts: List[Dict[str, str]]  # [{"id": "uuid", "name": "第1バイオリン"}, ...]
    
    def get_players_by_part(self, part_id: str) -> List[Player]:
        """指定されたパートのプレイヤーリストを取得"""
        return [p for p in self.players if part_id in p.part_ids]
    
    def get_instructors_by_part(self, part_id: str) -> List[Player]:
        """指定されたパートの指導者リストを取得"""
        return [p for p in self.players if p.is_instructor and part_id in p.part_ids]


@dataclass
class SchedulingSolution:
    """スケジューリングの解"""
    sessions: List[PracticeSession]
    objective_value: float
    is_optimal: bool
    solve_time_seconds: float
    
    def get_schedule_matrix(self) -> Dict[int, Dict[int, List[PracticeSession]]]:
        """時間コマ×部屋のスケジュールマトリックスを返す（複数セッション対応）"""
        matrix = {}
        num_time_slots = ProblemConfig.get_num_time_slots()
        for time_slot in range(1, num_time_slots + 1):  # 時間コマID: 計算で決定
            matrix[time_slot] = {}
            for room in range(1, ProblemConfig.NUM_ROOMS + 1):  # 部屋ID: 1, 2, 3, 4, 5
                matrix[time_slot][room] = []

        for session in self.sessions:
            matrix[session.time_slot_id][session.room_id].append(session)

        return matrix

    def get_instructor_distribution(self) -> Dict[int, int]:
        """指導者ごとのセッション数を取得"""
        distribution = {}
        for session in self.sessions:
            instructor_id = session.instructor_id
            distribution[instructor_id] = distribution.get(instructor_id, 0) + 1
        return distribution

    def get_part_distribution(self) -> Dict[str, int]:
        """パートIDごとのセッション数を取得"""
        distribution = {}
        for session in self.sessions:
            part_id = session.part_id
            distribution[part_id] = distribution.get(part_id, 0) + 1
        return distribution
    
    def get_part_distribution_by_name(self) -> Dict[str, int]:
        """パート名ごとのセッション数を取得"""
        distribution = {}
        for session in self.sessions:
            part_name = session.part_name
            distribution[part_name] = distribution.get(part_name, 0) + 1
        return distribution
