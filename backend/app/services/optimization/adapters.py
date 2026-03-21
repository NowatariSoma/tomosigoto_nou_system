"""
データベースとOR-Toolsデータモデル間の変換アダプター
"""
from __future__ import annotations

from typing import Any
from uuid import UUID
from app.services.optimization.models import (
    SchedulingProblem, Player, Room, TimeSlot, 
    PracticeSession, SchedulingSolution, PartAssignment
)
from app.services.optimization.constants import ProblemConfig, PriorityConfig, SchedulingConfig


class SchedulingDataAdapter:
    """データベースとOR-Toolsデータモデル間の変換を行うアダプター"""
    
    @staticmethod
    def db_to_scheduling_problem(
        schedule_data: dict[str, Any],
        venues_data: list[dict[str, Any]],
        parts_data: list[dict[str, Any]],
        users_data: list[dict[str, Any]],
        member_assignments_data: list[dict[str, Any]],
        session_instructors_data: list[dict[str, Any]] = None,
        stage_id: str = None,  # ステージIDを追加
        sessions_data: list[dict[str, Any]] = None,  # セッションデータを追加
        attendance_data: list[dict[str, Any]] = None,  # 出席データを追加
        user_roles_data: list[dict[str, Any]] = None,  # ユーザーロールデータを追加
        time_slots_data: list[dict[str, Any]] = None  # 時間スロットデータを追加
    ) -> SchedulingProblem:
        """データベースデータをSchedulingProblemに変換"""
        from datetime import datetime, time
        
        # ステージIDが指定されていない場合は自動解決
        if not stage_id:
            stage_id = SchedulingDataAdapter._get_stage_id_from_schedule(
                schedule_data, sessions_data, parts_data
            )
        
        # ステージに紐づくパートのみを取得
        if stage_id:
            parts_data = SchedulingDataAdapter._get_parts_by_stage_id(parts_data, stage_id)
            member_assignments_data = SchedulingDataAdapter._get_member_assignments_by_stage_id(
                member_assignments_data, parts_data, stage_id
            )
        
        # パート変換（辞書リスト形式）
        parts = []
        for part_data in parts_data:
            parts.append({
                "id": str(part_data.get('id')),
                "name": part_data.get('name', '')
            })
        
        # 部屋変換
        rooms = []
        for i, venue_data in enumerate(venues_data):
            room = Room(
                id=i + 1,
                name=venue_data.get('name', f'会場{i+1}')
            )
            rooms.append(room)
        
        # 時間コマ変換（schedule_time_slotsを優先、なければdivision_countを使用）
        time_slots = []
        if time_slots_data and len(time_slots_data) > 0:
            # schedule_time_slotsから時間スロットを作成
            for slot_data in time_slots_data:
                slot_order = slot_data.get('slot_order')
                start_time_str = slot_data.get('start_time')
                end_time_str = slot_data.get('end_time')
                
                # 文字列から時刻に変換
                start_time_obj = None
                end_time_obj = None
                if start_time_str:
                    if isinstance(start_time_str, str):
                        # HH:MM:SS形式または時刻オブジェクト
                        try:
                            if 'T' in start_time_str or 'Z' in start_time_str:
                                dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                                start_time_obj = dt.time()
                            else:
                                parts_time = start_time_str.split(':')
                                start_time_obj = time(int(parts_time[0]), int(parts_time[1]), int(parts_time[2]) if len(parts_time) > 2 else 0)
                        except:
                            pass
                    elif isinstance(start_time_str, time):
                        start_time_obj = start_time_str
                
                if end_time_str:
                    if isinstance(end_time_str, str):
                        try:
                            if 'T' in end_time_str or 'Z' in end_time_str:
                                dt = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                                end_time_obj = dt.time()
                            else:
                                parts_time = end_time_str.split(':')
                                end_time_obj = time(int(parts_time[0]), int(parts_time[1]), int(parts_time[2]) if len(parts_time) > 2 else 0)
                        except:
                            pass
                    elif isinstance(end_time_str, time):
                        end_time_obj = end_time_str
                
                time_slot = TimeSlot(
                    id=slot_order,
                    name=f"{slot_order}限目",
                    start_time=start_time_obj,
                    end_time=end_time_obj
                )
                time_slots.append(time_slot)
        else:
            # フォールバック: division_countから生成
            division_count = schedule_data.get("division_count")
            if not isinstance(division_count, int) or division_count <= 0:
                division_count = ProblemConfig.get_num_time_slots()
            
            for i in range(1, division_count + 1):
                time_slot = TimeSlot(
                    id=i,
                    name=f"{i}限目"
                )
                time_slots.append(time_slot)
        
        # プレイヤー変換
        players = []
        
        # 指導者を追加（user_rolesからも取得を試みる）
        # まずsession_instructors_dataから指導者を取得
        if session_instructors_data:
            instructor_ids = set()
            for si_data in session_instructors_data:
                # attendance_idから出席データを取得し、user_idを取得
                attendance_id = si_data.get('attendance_id')
                if not attendance_id:
                    continue
                
                # 出席データからuser_idを取得
                if not attendance_data:
                    continue
                user_attendance = next((a for a in attendance_data if a.get('id') == attendance_id), None)
                if not user_attendance:
                    continue
                
                user_id = user_attendance.get('user_id')
                if user_id and user_id not in instructor_ids:
                    instructor_ids.add(user_id)
                    
                    # ユーザー情報を取得
                    user_info = next((u for u in users_data if u.get('id') == user_id), None)
                    if user_info:
                        # 出席データによるフィルタリング（指導者も対象）
                        if attendance_data:
                            user_attendance = next((a for a in attendance_data if a.get('user_id') == user_id), None)
                            if not user_attendance or user_attendance.get('status') not in PriorityConfig.ATTENDANCE_REQUIRED_STATUSES:
                                continue  # 出席確定でない指導者はスキップ
                        
                        # 指導者の所属パートと優先度を取得（member_assignmentsから）
                        part_assignments = []
                        for ma in member_assignments_data:
                            if ma.get('user_id') == user_id:
                                part_data = next((p for p in parts_data if p.get('id') == ma.get('part_id')), None)
                                if not part_data:
                                    continue
                                
                                # 基本優先度を取得（デフォルトは定数から取得）
                                base_priority = ma.get('priority') or SchedulingConfig.DEFAULT_PART_PRIORITY
                                
                                # 舞カテゴリボーナスを適用
                                if ma.get('category') == 'mai':
                                    base_priority += PriorityConfig.MAI_CATEGORY_BONUS
                                
                                part_assignments.append(PartAssignment(
                                    part_id=str(part_data['id']),
                                    part_name=part_data.get('name', ''),
                                    priority=base_priority
                                ))
                        
                        if part_assignments:  # パートが割り当てられている場合のみ追加
                            available_slot_ids = SchedulingDataAdapter._compute_available_slot_ids(
                                user_attendance, time_slots
                            )
                            player = Player(
                                id=len(players) + 1,
                                name=user_info.get('name') or f'指導者{len(players) + 1}',
                                part_assignments=part_assignments,
                                is_instructor=True,
                                user_id=str(user_id),
                                available_slot_ids=available_slot_ids
                            )
                            players.append(player)

        # user_rolesから指導者を追加（session_instructors_dataが空の場合のフォールバック）
        # is_instructorフラグを確認
        if (not session_instructors_data or len(session_instructors_data) == 0) and user_roles_data:
            instructor_ids = set(str(p.id) for p in players if p.is_instructor)  # 既存の指導者ID
            
            for role_data in user_roles_data:
                # is_instructorフラグを確認
                if role_data.get('is_instructor', False):
                    user_id = role_data.get('user_id')
                    if user_id and user_id not in instructor_ids:
                        instructor_ids.add(user_id)
                        
                        # ユーザー情報を取得
                        user_info = next((u for u in users_data if u.get('id') == user_id), None)
                        if user_info:
                            # 出席データによるフィルタリング
                            if attendance_data:
                                user_attendance = next((a for a in attendance_data if a.get('user_id') == user_id), None)
                                if not user_attendance or user_attendance.get('status') not in PriorityConfig.ATTENDANCE_REQUIRED_STATUSES:
                                    continue  # 出席確定でない指導者はスキップ
                            
                            # 指導者の所属パートと優先度を取得（member_assignmentsから）
                            part_assignments = []
                            for ma in member_assignments_data:
                                if ma.get('user_id') == user_id:
                                    part_data = next((p for p in parts_data if p.get('id') == ma.get('part_id')), None)
                                    if not part_data:
                                        continue
                                    
                                    # 基本優先度を取得（デフォルトは定数から取得）
                                    base_priority = ma.get('priority') or SchedulingConfig.DEFAULT_PART_PRIORITY
                                    
                                    # 舞カテゴリボーナスを適用
                                    if ma.get('category') == 'mai':
                                        base_priority += PriorityConfig.MAI_CATEGORY_BONUS
                                    
                                    part_assignments.append(PartAssignment(
                                        part_id=str(part_data['id']),
                                        part_name=part_data.get('name', ''),
                                        priority=base_priority
                                    ))
                            
                            if part_assignments:  # パートが割り当てられている場合のみ追加
                                user_attendance_for_slot = next(
                                    (a for a in attendance_data if a.get('user_id') == user_id), {}
                                ) if attendance_data else {}
                                available_slot_ids = SchedulingDataAdapter._compute_available_slot_ids(
                                    user_attendance_for_slot, time_slots
                                )
                                player = Player(
                                    id=len(players) + 1,
                                    name=user_info.get('name') or user_info.get('email') or f'指導者{len(players) + 1}',
                                    part_assignments=part_assignments,
                                    is_instructor=True,
                                    user_id=str(user_id),
                                    available_slot_ids=available_slot_ids
                                )
                                players.append(player)
        
        # 一般プレイヤーを追加
        for ma_data in member_assignments_data:
            user_id = ma_data.get('user_id')
            part_id = ma_data.get('part_id')
            
            # 既に指導者として追加されている場合はスキップ（user_id同士で比較）
            if any(p.user_id == str(user_id) for p in players if p.is_instructor):
                continue
            
            # ユーザー情報を取得
            user_info = next((u for u in users_data if u.get('id') == user_id), None)
            if not user_info:
                continue
            
            # 出席データによるフィルタリング
            if attendance_data:
                user_attendance = next((a for a in attendance_data if a.get('user_id') == user_id), None)
                if not user_attendance or user_attendance.get('status') not in PriorityConfig.ATTENDANCE_REQUIRED_STATUSES:
                    continue  # 出席確定でないユーザーはスキップ
            
            # このユーザーの全パートと優先度を取得
            part_assignments = []
            for ma in member_assignments_data:
                if ma.get('user_id') == user_id:
                    part_data = next((p for p in parts_data if p.get('id') == ma.get('part_id')), None)
                    if not part_data:
                        continue
                    
                    # 基本優先度を取得（デフォルトは定数から取得）
                    base_priority = ma.get('priority') or SchedulingConfig.DEFAULT_PART_PRIORITY
                    
                    # 舞カテゴリボーナスを適用
                    if ma.get('category') == 'mai':
                        base_priority += PriorityConfig.MAI_CATEGORY_BONUS
                    
                    part_assignments.append(PartAssignment(
                        part_id=str(part_data['id']),
                        part_name=part_data.get('name', ''),
                        priority=base_priority
                    ))
            
            if part_assignments:
                available_slot_ids = SchedulingDataAdapter._compute_available_slot_ids(
                    user_attendance, time_slots
                ) if attendance_data and user_attendance else None
                player = Player(
                    id=len(players) + 1,
                    name=user_info.get('name') or f'プレイヤー{len(players) + 1}',
                    part_assignments=part_assignments,
                    is_instructor=False,
                    user_id=str(user_id),
                    available_slot_ids=available_slot_ids
                )
                players.append(player)
        
        return SchedulingProblem(
            players=players,
            rooms=rooms,
            time_slots=time_slots,
            parts=parts
        )
    
    @staticmethod
    def _parse_time_value(value: Any) -> 'time | None':
        """attendance の available_from/available_to を time オブジェクトに変換"""
        from datetime import time as time_type
        if value is None:
            return None
        if isinstance(value, time_type):
            return value
        if isinstance(value, str):
            try:
                parts = value.split(':')
                return time_type(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
            except Exception:
                return None
        return None

    @staticmethod
    def _compute_available_slot_ids(
        attendance: dict[str, Any],
        time_slots: list[TimeSlot]
    ) -> list[int] | None:
        """
        出席データの available_from / available_to から参加可能なスロットIDを計算する。

        【時刻モード】スロットに start_time/end_time が設定されている場合:
        - available_from: 参加開始時刻。スロット開始がこれ以降のスロットのみ参加可能。
        - available_to: 参加終了時刻。スロット終了がこれ以前のスロットのみ参加可能。

        【センチネルモード】全スロットに start_time/end_time が未設定の場合:
        - available_from の hour 値 = 1始まりのスロット順序（例: hour=2 → 2限目以降）
        - available_to の hour 値 = 1始まりのスロット順序（例: hour=2 → 2限目まで）
        - フロントエンドが "0N:00" 形式でエンコードして DB に保存する

        どちらも未設定の場合は None（全スロット参加可能）を返す。
        """
        available_from = SchedulingDataAdapter._parse_time_value(attendance.get('available_from'))
        available_to = SchedulingDataAdapter._parse_time_value(attendance.get('available_to'))

        if available_from is None and available_to is None:
            return None  # 全スロット参加可能

        available_ids = []

        # 全スロットが時刻未設定かどうか確認
        has_any_time = any(
            slot.start_time is not None and slot.end_time is not None
            for slot in time_slots
        )

        if not has_any_time:
            # センチネルモード: hour = 1始まりスロット順序
            from_pos = available_from.hour if available_from is not None else 1
            to_pos = available_to.hour if available_to is not None else len(time_slots)
            for i, slot in enumerate(time_slots, start=1):
                if from_pos <= i <= to_pos:
                    available_ids.append(slot.id)
        else:
            # 時刻モード: slot の start_time/end_time と比較
            for slot in time_slots:
                # start_time/end_time が不明なスロットは参加可能と仮定
                if slot.start_time is None or slot.end_time is None:
                    available_ids.append(slot.id)
                    continue

                # 遅刻チェック: スロット開始がプレイヤーの参加開始時刻より早い場合は不可
                if available_from is not None and slot.start_time < available_from:
                    continue

                # 途中退席チェック: スロット終了がプレイヤーの参加終了時刻より遅い場合は不可
                if available_to is not None and slot.end_time > available_to:
                    continue

                available_ids.append(slot.id)

        # 全スロット参加可能であれば None を返す（制約不要）
        return available_ids if len(available_ids) < len(time_slots) else None

    @staticmethod
    def solution_to_db_sessions(
        solution: SchedulingSolution,
        schedule_id: UUID,
        venue_mapping: dict[int, str]  # room_id -> venue_id のマッピング
    ) -> list[dict[str, Any]]:
        """SchedulingSolutionをデータベースのsessions形式に変換"""
        
        sessions = []
        for session in solution.sessions:
            # 会場IDを取得
            venue_id = venue_mapping.get(session.room_id)
            if not venue_id:
                continue  # マッピングが見つからない場合はスキップ
            
            session_data = {
                "schedule_id": str(schedule_id),
                "part_id": session.part_id,  # UUIDをそのまま使用
                "title": f"{session.part_name}パート練習",
                "slot_order": session.time_slot_id,
                "schedule_available_venue_id": venue_id,
                "priority": 0
            }
            sessions.append(session_data)
        
        return sessions
    
    @staticmethod
    def _get_part_id_by_name(part_name: str, parts_data: list[dict[str, Any]]) -> str:
        """パート名からパートIDを取得"""
        if not parts_data:
            # パートデータがない場合は仮のIDを生成
            return f"part_{part_name.lower()}"
        
        for part_data in parts_data:
            if part_data.get('name', '').upper() == part_name.upper():
                return str(part_data.get('id', f"part_{part_name.lower()}"))
        
        # マッチするパートが見つからない場合は仮のIDを生成
        return f"part_{part_name.lower()}"
    
    @staticmethod
    def create_venue_mapping(venues_data: list[dict[str, Any]]) -> dict[int, str]:
        """部屋IDと会場IDのマッピングを作成"""
        mapping = {}
        for i, venue_data in enumerate(venues_data):
            room_id = i + 1  # 1から始まる
            venue_id = venue_data.get('id')
            if venue_id:
                mapping[room_id] = str(venue_id)
        return mapping
    
    @staticmethod
    def create_part_mapping(parts_data: list[dict[str, Any]]) -> dict[str, str]:
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
        schedule_data: dict[str, Any],
        venues_data: list[dict[str, Any]],
        parts_data: list[dict[str, Any]],
        users_data: list[dict[str, Any]],
        member_assignments_data: list[dict[str, Any]],
        session_instructors_data: list[dict[str, Any]] = None,
        user_roles_data: list[dict[str, Any]] = None
    ) -> list[str]:
        """スケジューリングデータの妥当性を検証し、エラーメッセージを返す"""
        from app.services.optimization.constants import ErrorMessages
        
        errors = []
        
        # スケジュールデータの検証
        if not schedule_data.get('id'):
            errors.append("スケジュールIDが設定されていません")
        
        # 会場データの検証
        if not venues_data or len(venues_data) == 0:
            errors.append(ErrorMessages.INSUFFICIENT_VENUES)
        
        # パートデータの検証
        if not parts_data or len(parts_data) == 0:
            errors.append("パートが登録されていません。ステージにパートを追加してください。")
        
        # ユーザーデータの検証
        if not users_data or len(users_data) == 0:
            errors.append(ErrorMessages.INSUFFICIENT_USERS)
        
        # メンバー割り当てデータの検証
        if not member_assignments_data or len(member_assignments_data) == 0:
            errors.append("メンバー割り当てが設定されていません。パートにメンバーを割り当ててください。")
        
        # 指導者の存在確認（is_instructorフラグを確認）
        has_instructors = False
        if session_instructors_data and len(session_instructors_data) > 0:
            has_instructors = True
        elif user_roles_data:
            # user_rolesからis_instructorフラグを確認
            for role_data in user_roles_data:
                if role_data.get('is_instructor', False):
                    has_instructors = True
                    break
        
        if not has_instructors and not errors:
            errors.append("指導者が設定されていません。is_instructorフラグを持つユーザーを設定してください。")
        
        return errors
    
    @staticmethod
    def _get_stage_id_from_schedule(
        schedule_data: dict[str, Any],
        sessions_data: list[dict[str, Any]] = None,
        parts_data: list[dict[str, Any]] = None
    ) -> str | None:
        """
        スケジュールからステージIDを取得
        
        Args:
            schedule_data: スケジュールデータ
            sessions_data: セッションデータ（オプション）
            parts_data: パートデータ（オプション）
            
        Returns:
            ステージID（見つからない場合はNone）
        """
        # 方法1: スケジュールデータにstage_idが直接含まれている場合
        if 'stage_id' in schedule_data:
            return schedule_data['stage_id']
        
        # 方法2: セッションデータからパートIDを取得し、パートデータからステージIDを取得
        if sessions_data and parts_data:
            # セッションからパートIDを取得
            part_ids = set()
            for session in sessions_data:
                part_id = session.get('part_id')
                if part_id:
                    part_ids.add(part_id)
            
            # パートデータからステージIDを取得
            stage_ids = set()
            for part_data in parts_data:
                if part_data.get('id') in part_ids:
                    stage_id = part_data.get('stage_id')
                    if stage_id:
                        stage_ids.add(stage_id)
            
            # 複数のステージIDが見つかった場合は最初のものを返す
            if stage_ids:
                return list(stage_ids)[0]
        
        # 方法3: パートデータから最も一般的なステージIDを取得
        if parts_data:
            stage_counts = {}
            for part_data in parts_data:
                stage_id = part_data.get('stage_id')
                if stage_id:
                    stage_counts[stage_id] = stage_counts.get(stage_id, 0) + 1
            
            if stage_counts:
                # 最も多くのパートを持つステージIDを返す
                return max(stage_counts, key=stage_counts.get)
        
        return None
    
    @staticmethod
    def _get_parts_by_stage_id(
        parts_data: list[dict[str, Any]], 
        stage_id: str
    ) -> list[dict[str, Any]]:
        """
        指定されたステージIDのパートのみを取得
        
        Args:
            parts_data: 全パートデータ
            stage_id: ステージID
            
        Returns:
            指定されたステージのパートデータ
        """
        return [part for part in parts_data if part.get('stage_id') == stage_id]
    
    @staticmethod
    def _get_member_assignments_by_stage_id(
        member_assignments_data: list[dict[str, Any]],
        parts_data: list[dict[str, Any]],
        stage_id: str
    ) -> list[dict[str, Any]]:
        """
        指定されたステージIDのパートに属するメンバー割り当てのみを取得
        
        Args:
            member_assignments_data: 全メンバー割り当てデータ
            parts_data: 全パートデータ
            stage_id: ステージID
            
        Returns:
            指定されたステージのパートに属するメンバー割り当てデータ
        """
        # ステージのパートIDを取得
        stage_part_ids = set()
        for part_data in parts_data:
            if part_data.get('stage_id') == stage_id:
                stage_part_ids.add(part_data.get('id'))
        
        # そのパートに属するメンバー割り当てを取得
        return [
            ma for ma in member_assignments_data 
            if ma.get('part_id') in stage_part_ids
        ]
