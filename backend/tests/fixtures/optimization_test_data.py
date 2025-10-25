"""
テスト用サンプルデータ生成
"""
from app.services.optimization.models import (
    SchedulingProblem, Player, Room, TimeSlot, PartAssignment
)
from app.services.optimization.constants import ProblemConfig


def create_full_sample_problem() -> SchedulingProblem:
    """フルサンプル問題を作成（統合テスト用）"""
    # パート定義
    parts = [
        {"id": "part_a", "name": "第1バイオリン"},
        {"id": "part_b", "name": "第2バイオリン"},
        {"id": "part_c", "name": "ビオラ"},
        {"id": "part_d", "name": "チェロ"}
    ]
    
    # 部屋定義
    rooms = []
    for i in range(1, ProblemConfig.NUM_ROOMS + 1):
        rooms.append(Room(id=i, name=f"練習室{chr(64 + i)}"))  # A, B, C, D
    
    # 時間コマ定義
    time_slots = []
    num_time_slots = ProblemConfig.get_num_time_slots()
    for i in range(1, num_time_slots + 1):
        time_slots.append(TimeSlot(id=i, name=f"{i}限目"))
    
    # プレイヤー定義（簡略化）
    players = [
        # 指導者
        Player(id=1, name="田中先生", part_assignments=[
            PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=100),
            PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=80)
        ], is_instructor=True),
        Player(id=2, name="佐藤先生", part_assignments=[
            PartAssignment(part_id="part_c", part_name="ビオラ", priority=90),
            PartAssignment(part_id="part_d", part_name="チェロ", priority=70)
        ], is_instructor=True),
        # 一般プレイヤー
        Player(id=3, name="佐々木さん", part_assignments=[
            PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=90),
            PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=30)
        ]),
        Player(id=4, name="松本さん", part_assignments=[
            PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=60),
            PartAssignment(part_id="part_c", part_name="ビオラ", priority=50)
        ]),
        Player(id=5, name="井上さん", part_assignments=[
            PartAssignment(part_id="part_c", part_name="ビオラ", priority=40),
            PartAssignment(part_id="part_d", part_name="チェロ", priority=20)
        ]),
        Player(id=6, name="木村さん", part_assignments=[
            PartAssignment(part_id="part_d", part_name="チェロ", priority=95),
            PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=10)
        ]),
    ]
    
    return SchedulingProblem(
        players=players,
        rooms=rooms,
        time_slots=time_slots,
        parts=parts
    )


def create_simple_test_problem() -> SchedulingProblem:
    """シンプルなテスト問題を作成"""
    # 最小構成でのテスト用データ
    parts = [
        {"id": "part_a", "name": "第1バイオリン"},
        {"id": "part_b", "name": "第2バイオリン"}
    ]
    rooms = [Room(id=1, name="練習室A"), Room(id=2, name="練習室B")]
    time_slots = [TimeSlot(id=1, name="1限目"), TimeSlot(id=2, name="2限目")]
    
    players = [
        # 指導者
        Player(id=1, name="指導者1", part_assignments=[
            PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=80),
            PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=60)
        ], is_instructor=True),
        # 一般プレイヤー
        Player(id=2, name="プレイヤー1", part_assignments=[
            PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=90),
            PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=30)
        ]),
        Player(id=3, name="プレイヤー2", part_assignments=[
            PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=70),
            PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=40)
        ]),
    ]
    
    return SchedulingProblem(
        players=players,
        rooms=rooms,
        time_slots=time_slots,
        parts=parts
    )
