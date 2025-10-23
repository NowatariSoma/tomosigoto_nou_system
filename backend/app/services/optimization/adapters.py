"""
データベースとOR-Toolsデータモデル間の変換アダプター
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from app.services.optimization.models import (
    SchedulingProblem, Player, Room, TimeSlot, PartType, 
    PracticeSession, SchedulingSolution
)
from app.services.optimization.constants import ProblemConfig


class SchedulingDataAdapter:
    """データベースとOR-Toolsデータモデル間の変換を行うアダプター"""
    
    @staticmethod
    def db_to_scheduling_problem(
        schedule_data: Dict[str, Any],
        venues_data: List[Dict[str, Any]],
        parts_data: List[Dict[str, Any]],
        users_data: List[Dict[str, Any]],
        member_assignments_data: List[Dict[str, Any]],
        session_instructors_data: List[Dict[str, Any]] = None
    ) -> SchedulingProblem:
        """データベースデータをSchedulingProblemに変換"""
        
        # パート変換
        parts = []
        for part_data in parts_data:
            part_name = part_data.get('name', '').upper()
            if part_name in [p.value for p in PartType]:
                parts.append(PartType(part_name))
        
        # 部屋変換
        rooms = []
        for i, venue_data in enumerate(venues_data):
            room = Room(
                id=i + 1,
                name=venue_data.get('name', f'会場{i+1}')
            )
            rooms.append(room)
        
        # 時間コマ変換（division_countに基づく）
        division_count = schedule_data.get('division_count', ProblemConfig.get_num_time_slots())
        time_slots = []
        for i in range(1, division_count + 1):
            time_slot = TimeSlot(
                id=i,
                name=f"{i}限目"
            )
            time_slots.append(time_slot)
        
        # プレイヤー変換
        players = []
        
        # 指導者を追加
        if session_instructors_data:
            instructor_ids = set()
            for si_data in session_instructors_data:
                user_id = si_data.get('user_id')
                if user_id and user_id not in instructor_ids:
                    instructor_ids.add(user_id)
                    
                    # ユーザー情報を取得
                    user_info = next((u for u in users_data if u.get('id') == user_id), None)
                    if user_info:
                        # 指導者の所属パートを取得（member_assignmentsから）
                        user_parts = []
                        for ma in member_assignments_data:
                            if ma.get('user_id') == user_id:
                                part_name = next((p.get('name', '').upper() for p in parts_data if p.get('id') == ma.get('part_id')), '')
                                if part_name in [p.value for p in PartType]:
                                    user_parts.append(PartType(part_name))
                        
                        if user_parts:  # パートが割り当てられている場合のみ追加
                            player = Player(
                                id=len(players) + 1,
                                name=user_info.get('name', f'指導者{len(players) + 1}'),
                                parts=user_parts,
                                is_instructor=True,
                                overlap_priority=50  # デフォルト値
                            )
                            players.append(player)
        
        # 一般プレイヤーを追加
        for ma_data in member_assignments_data:
            user_id = ma_data.get('user_id')
            part_id = ma_data.get('part_id')
            
            # 既に指導者として追加されている場合はスキップ
            if any(p.id == user_id for p in players if p.is_instructor):
                continue
            
            # ユーザー情報を取得
            user_info = next((u for u in users_data if u.get('id') == user_id), None)
            if not user_info:
                continue
            
            # このユーザーの全パートを取得
            user_parts = []
            for ma in member_assignments_data:
                if ma.get('user_id') == user_id:
                    part_name = next((p.get('name', '').upper() for p in parts_data if p.get('id') == ma.get('part_id')), '')
                    if part_name in [p.value for p in PartType]:
                        user_parts.append(PartType(part_name))
            
            if user_parts:
                player = Player(
                    id=len(players) + 1,
                    name=user_info.get('name', f'プレイヤー{len(players) + 1}'),
                    parts=user_parts,
                    is_instructor=False,
                    overlap_priority=50  # デフォルト値、将来的にはユーザープロファイルから取得
                )
                players.append(player)
        
        return SchedulingProblem(
            players=players,
            rooms=rooms,
            time_slots=time_slots,
            parts=parts
        )
    
    @staticmethod
    def solution_to_db_sessions(
        solution: SchedulingSolution,
        schedule_id: UUID,
        venue_mapping: Dict[int, str]  # room_id -> venue_id のマッピング
    ) -> List[Dict[str, Any]]:
        """SchedulingSolutionをデータベースのsessions形式に変換"""
        
        sessions = []
        for session in solution.sessions:
            # 会場IDを取得
            venue_id = venue_mapping.get(session.room_id)
            if not venue_id:
                continue  # マッピングが見つからない場合はスキップ
            
            # パートIDを取得（実際の実装ではpartsテーブルから取得）
            # ここでは仮の実装として、パート名から推測
            part_id = f"part_{session.part.value.lower()}"
            
            session_data = {
                "schedule_id": str(schedule_id),
                "part_id": part_id,  # 実際の実装ではUUIDに変換
                "title": f"{session.part.value}パート練習",
                "slot_order": session.time_slot_id,
                "schedule_available_venue_id": venue_id,
                "priority": 0
            }
            sessions.append(session_data)
        
        return sessions
    
    @staticmethod
    def create_venue_mapping(venues_data: List[Dict[str, Any]]) -> Dict[int, str]:
        """部屋IDと会場IDのマッピングを作成"""
        mapping = {}
        for i, venue_data in enumerate(venues_data):
            room_id = i + 1  # 1から始まる
            venue_id = venue_data.get('id')
            if venue_id:
                mapping[room_id] = str(venue_id)
        return mapping
    
    @staticmethod
    def create_part_mapping(parts_data: List[Dict[str, Any]]) -> Dict[str, str]:
        """パート名とパートIDのマッピングを作成"""
        mapping = {}
        for part_data in parts_data:
            part_name = part_data.get('name', '').upper()
            part_id = part_data.get('id')
            if part_name and part_id:
                mapping[part_name] = str(part_id)
        return mapping
    
    @staticmethod
    def validate_scheduling_data(
        schedule_data: Dict[str, Any],
        venues_data: List[Dict[str, Any]],
        parts_data: List[Dict[str, Any]],
        users_data: List[Dict[str, Any]],
        member_assignments_data: List[Dict[str, Any]]
    ) -> List[str]:
        """スケジューリングデータの妥当性を検証し、エラーメッセージを返す"""
        errors = []
        
        # スケジュールデータの検証
        if not schedule_data.get('id'):
            errors.append("スケジュールIDが設定されていません")
        
        if not schedule_data.get('division_count', 0) > 0:
            errors.append("division_countが正しく設定されていません")
        
        # 会場データの検証
        if not venues_data:
            errors.append("利用可能な会場が設定されていません")
        
        # パートデータの検証
        if not parts_data:
            errors.append("パートデータが設定されていません")
        
        # ユーザーデータの検証
        if not users_data:
            errors.append("ユーザーデータが設定されていません")
        
        # メンバー割り当てデータの検証
        if not member_assignments_data:
            errors.append("メンバー割り当てデータが設定されていません")
        
        # 指導者の存在確認
        instructor_count = 0
        for ma in member_assignments_data:
            user_id = ma.get('user_id')
            if user_id:
                # ここでは簡易的に、ユーザーが存在するかチェック
                if any(u.get('id') == user_id for u in users_data):
                    instructor_count += 1
        
        if instructor_count == 0:
            errors.append("指導者が設定されていません")
        
        return errors
