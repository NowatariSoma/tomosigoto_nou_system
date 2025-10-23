"""
スケジューリングシステムの定数定義
"""
from typing import Dict, Any

# 制約関連
class ConstraintLimits:
    """制約の上限値"""
    MAX_VIOLATIONS = 10        # 最大違反数
    MAX_WEIGHTED_VIOLATIONS = 1000  # 最大重み付き違反数
    MAX_SESSIONS = 100         # 最大セッション数
    MAX_WEIGHTED_EQUALITY = 10000  # 最大重み付き均等性

# スケジューリング設定
class SchedulingConfig:
    """スケジューリング設定"""
    DEFAULT_TIME_LIMIT = 30    # デフォルト時間制限（秒）
    DEFAULT_EQUALITY_WEIGHT = 100  # デフォルト均等性重み
    DEFAULT_PRIORITY = 50  # デフォルト優先度

# パート・部屋・時間コマ設定
class ProblemConfig:
    """問題設定"""
    NUM_ROOMS = 5              # 部屋数
    NUM_PARTS = 9              # パート数
    NUM_INSTRUCTORS = 5        # 指導者数
    NUM_GENERAL_PLAYERS = 18   # 一般プレイヤー数
    
    # 計算で決定される値
    @classmethod
    def get_num_time_slots(cls) -> int:
        """時間コマ数を計算で決定: パート数//部屋数+1"""
        return cls.NUM_PARTS // cls.NUM_ROOMS + 1

# 最適化パラメータのデフォルト値
DEFAULT_OPTIMIZATION_PARAMS: Dict[str, Any] = {
    "time_limit_seconds": SchedulingConfig.DEFAULT_TIME_LIMIT,
    "equality_weight": SchedulingConfig.DEFAULT_EQUALITY_WEIGHT,
    "allow_overlap": False,
    "max_iterations": 1000,
    "solution_limit": 10
}

# エラーメッセージ
class ErrorMessages:
    """エラーメッセージ定数"""
    NO_SOLUTION_FOUND = "最適解が見つかりませんでした。制約条件を緩和してください。"
    INVALID_SCHEDULE_ID = "無効なスケジュールIDです。"
    SCHEDULE_NOT_FOUND = "指定されたスケジュールが見つかりません。"
    OPTIMIZATION_FAILED = "最適化処理に失敗しました。"
    INSUFFICIENT_DATA = "最適化に必要なデータが不足しています。"
    CONSTRAINT_VIOLATION = "制約条件に違反しています。"
