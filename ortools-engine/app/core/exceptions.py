"""
例外定義

最適化エンジン用の例外処理
"""

from typing import Any, Dict, Optional


class OptimizationEngineException(Exception):
    """最適化エンジンの基底例外"""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class OptimizationTimeoutException(OptimizationEngineException):
    """最適化タイムアウト例外"""
    
    def __init__(self, timeout_seconds: int):
        super().__init__(
            message=f"最適化がタイムアウトしました（{timeout_seconds}秒）",
            error_code="OPTIMIZATION_TIMEOUT",
            details={"timeout_seconds": timeout_seconds}
        )


class OptimizationFailedException(OptimizationEngineException):
    """最適化失敗例外"""
    
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"最適化に失敗しました: {reason}",
            error_code="OPTIMIZATION_FAILED",
            details={"reason": reason, **(details or {})}
        )


class ModelNotReadyException(OptimizationEngineException):
    """モデル未準備例外"""
    
    def __init__(self):
        super().__init__(
            message="最適化モデルが準備できていません",
            error_code="MODEL_NOT_READY"
        )
