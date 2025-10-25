"""
テスト用サンプルデータ生成
"""
from app.services.optimization.models import (
    SchedulingProblem, Player, PartType, Room, TimeSlot, PartAssignment
)
from app.services.optimization.constants import ProblemConfig


def create_full_sample_problem() -> SchedulingProblem:
    """フルサンプル問題を作成（統合テスト用）"""
    # パート定義
    parts = [
        PartType.A, PartType.B, PartType.C, PartType.D, PartType.E,
        PartType.F, PartType.G, PartType.H, PartType.I
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
    
    # プレイヤー定義（指導者含む）
    players = [
        # 指導者（5人、全員2つのパートに所属）
        Player(id=1, name="田中先生", part_assignments=[
            PartAssignment(PartType.A, 100), PartAssignment(PartType.B, 80)
        ], is_instructor=True),
        Player(id=2, name="佐藤先生", part_assignments=[
            PartAssignment(PartType.C, 90), PartAssignment(PartType.D, 70)
        ], is_instructor=True),
        Player(id=3, name="鈴木先生", part_assignments=[
            PartAssignment(PartType.E, 80), PartAssignment(PartType.F, 60)
        ], is_instructor=True),
        Player(id=4, name="高橋先生", part_assignments=[
            PartAssignment(PartType.G, 70), PartAssignment(PartType.H, 50)
        ], is_instructor=True),
        Player(id=5, name="山田先生", part_assignments=[
            PartAssignment(PartType.I, 60), PartAssignment(PartType.A, 40)
        ], is_instructor=True),
        # 一般プレイヤー（複数パート所属、パート別優先度設定）
        Player(id=6, name="佐々木さん", part_assignments=[
            PartAssignment(PartType.A, 90), PartAssignment(PartType.B, 30)
        ]),  # Aパート優先
        Player(id=7, name="松本さん", part_assignments=[
            PartAssignment(PartType.B, 60), PartAssignment(PartType.C, 50)
        ]),  # バランス
        Player(id=8, name="井上さん", part_assignments=[
            PartAssignment(PartType.C, 40), PartAssignment(PartType.D, 20)
        ]),  # 緩い
        Player(id=9, name="木村さん", part_assignments=[
            PartAssignment(PartType.D, 95), PartAssignment(PartType.E, 10)
        ]),  # Dパート優先
        Player(id=10, name="林さん", part_assignments=[
            PartAssignment(PartType.E, 30), PartAssignment(PartType.F, 25)
        ]),  # 緩い
        Player(id=11, name="清水さん", part_assignments=[
            PartAssignment(PartType.F, 85), PartAssignment(PartType.G, 15)
        ]),  # Fパート優先
        Player(id=12, name="森さん", part_assignments=[
            PartAssignment(PartType.G, 20), PartAssignment(PartType.H, 10)
        ]),  # 制限なし
        Player(id=13, name="石川さん", part_assignments=[
            PartAssignment(PartType.H, 100), PartAssignment(PartType.I, 5)
        ]),  # Hパート厳格
        Player(id=14, name="田村さん", part_assignments=[
            PartAssignment(PartType.I, 55), PartAssignment(PartType.A, 45)
        ]),  # バランス
        Player(id=15, name="山田さん", part_assignments=[
            PartAssignment(PartType.A, 75), PartAssignment(PartType.C, 25)
        ]),  # Aパートやや優先
        Player(id=16, name="佐藤さん", part_assignments=[
            PartAssignment(PartType.B, 35), PartAssignment(PartType.D, 15)
        ]),  # 緩い
        Player(id=17, name="鈴木さん", part_assignments=[
            PartAssignment(PartType.C, 50), PartAssignment(PartType.E, 50)
        ]),  # 完全バランス
        Player(id=18, name="高橋さん", part_assignments=[
            PartAssignment(PartType.D, 90), PartAssignment(PartType.F, 20)
        ]),  # Dパート優先
        Player(id=19, name="伊藤さん", part_assignments=[
            PartAssignment(PartType.E, 10), PartAssignment(PartType.G, 5)
        ]),  # 制限なし
        Player(id=20, name="渡辺さん", part_assignments=[
            PartAssignment(PartType.F, 80), PartAssignment(PartType.H, 30)
        ]),  # Fパートやや優先
        Player(id=21, name="中村さん", part_assignments=[
            PartAssignment(PartType.G, 25), PartAssignment(PartType.I, 15)
        ]),  # 緩い
        Player(id=22, name="小林さん", part_assignments=[
            PartAssignment(PartType.H, 50), PartAssignment(PartType.A, 50)
        ]),  # 完全バランス
        Player(id=23, name="加藤さん", part_assignments=[
            PartAssignment(PartType.I, 95), PartAssignment(PartType.B, 5)
        ]),  # Iパート厳格
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
    parts = [PartType.A, PartType.B]
    rooms = [Room(id=1, name="練習室A"), Room(id=2, name="練習室B")]
    time_slots = [TimeSlot(id=1, name="1限目"), TimeSlot(id=2, name="2限目")]
    
    players = [
        # 指導者
        Player(id=1, name="指導者1", part_assignments=[
            PartAssignment(PartType.A, 80), PartAssignment(PartType.B, 60)
        ], is_instructor=True),
        # 一般プレイヤー
        Player(id=2, name="プレイヤー1", part_assignments=[
            PartAssignment(PartType.A, 90), PartAssignment(PartType.B, 30)
        ]),
        Player(id=3, name="プレイヤー2", part_assignments=[
            PartAssignment(PartType.B, 70), PartAssignment(PartType.A, 40)
        ]),
    ]
    
    return SchedulingProblem(
        players=players,
        rooms=rooms,
        time_slots=time_slots,
        parts=parts
    )
