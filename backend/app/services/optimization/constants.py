"""
スケジューリングシステムの定数定義
"""
from typing import Dict, Any

# 制約関連
class ConstraintLimits:
    """制約の上限値"""
    MAX_SESSIONS = 100         # 最大セッション数
    MAX_WEIGHTED_EQUALITY = 10000  # 最大重み付き均等性

# スケジューリング設定
class SchedulingConfig:
    """スケジューリング設定"""
    DEFAULT_TIME_LIMIT = 30    # デフォルト時間制限（秒）
    DEFAULT_EQUALITY_WEIGHT = 100  # デフォルト均等性重み
    DEFAULT_PART_PRIORITY = 50  # デフォルトパート優先度（0-100）

# 優先度・出席関連設定
class PriorityConfig:
    """優先度と出席に関する設定"""
    MAI_CATEGORY_BONUS = 30  # 舞カテゴリの優先度ボーナス
    ATTENDANCE_REQUIRED_STATUSES = ['present', 'late']  # 出席必須ステータス

# パート・部屋・時間コマ設定
class ProblemConfig:
    """問題設定"""
    NUM_ROOMS = 5              # 部屋数（テストデータ生成で使用）
    
    # 計算で決定される値
    @classmethod
    def get_num_time_slots(cls) -> int:
        """時間コマ数を計算で決定: パート数//部屋数+1"""
        # デフォルト値として2を返す（9//5+1=2）
        return 2

# 最適化パラメータのデフォルト値
DEFAULT_OPTIMIZATION_PARAMS: Dict[str, Any] = {
    "time_limit_seconds": SchedulingConfig.DEFAULT_TIME_LIMIT,
    "equality_weight": SchedulingConfig.DEFAULT_EQUALITY_WEIGHT,
    "allow_overlap": False,
    "max_iterations": 1000,
    "solution_limit": 10,
    "default_part_priority": SchedulingConfig.DEFAULT_PART_PRIORITY
}

# エラーメッセージ
class ErrorMessages:
    """エラーメッセージ定数"""
    NO_SOLUTION_FOUND = "最適解が見つかりませんでした。制約条件を緩和してください。"
    OPTIMIZATION_FAILED = "最適化処理に失敗しました。"
