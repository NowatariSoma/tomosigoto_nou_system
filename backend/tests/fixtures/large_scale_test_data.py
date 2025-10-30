"""
大規模テスト用サンプルデータ生成
20パート、5部屋、60人（指導者10人）のテストデータ
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from typing import List, Dict, Any
from app.services.optimization.models import (
    SchedulingProblem, Player, Room, TimeSlot, PartAssignment
)
from app.services.optimization.constants import ProblemConfig, PriorityConfig


def create_large_scale_test_data() -> Dict[str, Any]:
    """大規模テスト用のデータを作成"""
    
    # 20パート定義（楽器パート）
    parts = []
    part_names = [
        "第1バイオリン1", "第1バイオリン2", "第2バイオリン1", "第2バイオリン2",
        "ビオラ1", "ビオラ2", "チェロ1", "チェロ2", "コントラバス1", "コントラバス2",
        "フルート1", "フルート2", "オーボエ1", "オーボエ2", "クラリネット1", "クラリネット2",
        "ファゴット1", "ファゴット2", "ホルン1", "ホルン2"
    ]
    
    for i, name in enumerate(part_names):
        parts.append({
            "id": f"part_{i+1:02d}",
            "name": name
        })
    
    # 5部屋定義
    rooms = []
    for i in range(1, 6):
        rooms.append(Room(id=i, name=f"練習室{chr(64 + i)}"))  # A, B, C, D, E
    
    # 時間コマ定義（動的計算）
    time_slots = []
    num_time_slots = max(2, len(parts) // len(rooms) + 1)  # 20パート÷5部屋+1=5コマ
    for i in range(1, num_time_slots + 1):
        time_slots.append(TimeSlot(id=i, name=f"{i}限目"))
    
    # 指導者10人作成
    instructors = []
    for i in range(1, 11):
        # 各指導者は2-3パートを担当
        instructor_parts = []
        for j in range(2):  # 各指導者は2パート担当
            part_idx = (i + j * 2) % len(parts)
            part = parts[part_idx]
            # 舞カテゴリの指導者（50%の確率）
            category = "mai" if i % 2 == 0 else "utai"
            priority = 80 + (i % 3) * 10  # 80-100の優先度
            
            instructor_parts.append(PartAssignment(
                part_id=part["id"],
                part_name=part["name"],
                priority=priority
            ))
        
        instructors.append(Player(
            id=i,
            name=f"指導者{i}",
            part_assignments=instructor_parts,
            is_instructor=True
        ))
    
    # 一般プレイヤー50人作成
    players = []
    for i in range(11, 61):  # ID 11-60
        # 各プレイヤーは1-2パートに所属
        num_parts = 1 if i % 3 == 0 else 2
        player_parts = []
        
        for j in range(num_parts):
            part_idx = (i + j * 3) % len(parts)
            part = parts[part_idx]
            # 舞カテゴリのプレイヤー（30%の確率）
            category = "mai" if i % 10 < 3 else "utai"
            priority = 30 + (i % 7) * 10  # 30-90の優先度
            
            player_parts.append(PartAssignment(
                part_id=part["id"],
                part_name=part["name"],
                priority=priority
            ))
        
        players.append(Player(
            id=i,
            name=f"プレイヤー{i-10}",
            part_assignments=player_parts,
            is_instructor=False
        ))
    
    # 全プレイヤー（指導者+一般）
    all_players = instructors + players
    
    return SchedulingProblem(
        players=all_players,
        rooms=rooms,
        time_slots=time_slots,
        parts=parts
    )


def create_large_scale_member_assignments() -> List[Dict[str, Any]]:
    """大規模テスト用のメンバー割り当てデータ"""
    assignments = []
    
    # 指導者10人の割り当て
    for instructor_id in range(1, 11):
        for part_idx in range(2):  # 各指導者は2パート
            part_id = f"part_{part_idx + instructor_id:02d}"
            category = "mai" if instructor_id % 2 == 0 else "utai"
            priority = 80 + (instructor_id % 3) * 10
            
            assignments.append({
                "user_id": f"instructor_{instructor_id}",
                "part_id": part_id,
                "category": category,
                "priority": priority
            })
    
    # 一般プレイヤー50人の割り当て
    for player_id in range(11, 61):
        num_parts = 1 if player_id % 3 == 0 else 2
        
        for part_offset in range(num_parts):
            part_id = f"part_{((player_id + part_offset * 3) % 20) + 1:02d}"
            category = "mai" if player_id % 10 < 3 else "utai"
            priority = 30 + (player_id % 7) * 10
            
            assignments.append({
                "user_id": f"player_{player_id}",
                "part_id": part_id,
                "category": category,
                "priority": priority
            })
    
    return assignments


def create_large_scale_attendance_data() -> List[Dict[str, Any]]:
    """大規模テスト用の出席データ"""
    attendance = []
    
    # 出席率80%（48人出席、12人欠席）
    for user_id in range(1, 61):
        if user_id <= 48:  # 80%出席
            status = "present" if user_id % 4 != 0 else "late"  # 遅刻も含む
        else:  # 20%欠席
            status = "absent"
        
        attendance.append({
            "user_id": f"user_{user_id}",
            "status": status
        })
    
    return attendance


def create_large_scale_test_problem() -> SchedulingProblem:
    """大規模テスト問題を作成"""
    return create_large_scale_test_data()


if __name__ == "__main__":
    # テストデータ作成と検証
    problem = create_large_scale_test_problem()
    
    print(f"=== 大規模テストデータ統計 ===")
    print(f"パート数: {len(problem.parts)}")
    print(f"部屋数: {len(problem.rooms)}")
    print(f"時間コマ数: {len(problem.time_slots)}")
    print(f"総プレイヤー数: {len(problem.players)}")
    print(f"指導者数: {len([p for p in problem.players if p.is_instructor])}")
    print(f"一般プレイヤー数: {len([p for p in problem.players if not p.is_instructor])}")
    
    # パートごとの所属人数
    part_members = {}
    for player in problem.players:
        for assignment in player.part_assignments:
            part_id = assignment.part_id
            if part_id not in part_members:
                part_members[part_id] = 0
            part_members[part_id] += 1
    
    print(f"\n=== パートごとの所属人数 ===")
    for part in problem.parts:
        part_id = part["id"]
        member_count = part_members.get(part_id, 0)
        print(f"{part['name']}: {member_count}人")
    
    # 舞カテゴリの統計
    mai_assignments = 0
    utai_assignments = 0
    for player in problem.players:
        for assignment in player.part_assignments:
            # 舞カテゴリの判定（簡略化）
            if assignment.priority > 70:  # 高優先度を舞と仮定
                mai_assignments += 1
            else:
                utai_assignments += 1
    
    print(f"\n=== カテゴリ統計 ===")
    print(f"舞カテゴリ（推定）: {mai_assignments}件")
    print(f"謡カテゴリ（推定）: {utai_assignments}件")
