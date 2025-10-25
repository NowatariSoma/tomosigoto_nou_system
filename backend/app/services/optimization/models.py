"""
データモデルの定義
"""
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
from app.services.optimization.constants import ProblemConfig


class PartType(Enum):
    """パートの種類"""
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"
    H = "H"
    I = "I"


@dataclass
class PartAssignment:
    """パート割り当てと優先度"""
    part: PartType
    priority: int = 50  # 0-100、デフォルト50


@dataclass
class Player:
    """プレイヤー（参加者）"""
    id: int
    name: str
    part_assignments: List[PartAssignment]  # パート割り当てと優先度
    is_instructor: bool = False  # 指導者かどうか
    
    @property
    def parts(self) -> List[PartType]:
        """後方互換性のためのプロパティ"""
        return [assignment.part for assignment in self.part_assignments]


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
    part: PartType
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
    parts: List[PartType]
    
    def get_players_by_part(self, part: PartType) -> List[Player]:
        """指定されたパートのプレイヤーリストを取得"""
        return [player for player in self.players if part in player.parts]
    
    def get_instructors_by_part(self, part: PartType) -> List[Player]:
        """指定されたパートの指導者リストを取得"""
        return [player for player in self.players if part in player.parts and player.is_instructor]
    
    def get_regular_players_by_part(self, part: PartType) -> List[Player]:
        """指定されたパートの一般プレイヤーリストを取得"""
        return [player for player in self.players if part in player.parts and not player.is_instructor]


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

    def get_part_distribution(self) -> Dict[PartType, int]:
        """パートごとのセッション数を取得"""
        distribution = {}
        for session in self.sessions:
            part = session.part
            distribution[part] = distribution.get(part, 0) + 1
        return distribution
