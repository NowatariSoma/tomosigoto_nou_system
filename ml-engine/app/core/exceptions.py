"""
ML-Engine例外処理
"""
from fastapi import HTTPException
from typing import Any, Dict, Optional

class MLEngineException(Exception):
    """ML-Engine基底例外クラス"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class ModelNotFoundException(MLEngineException):
    """モデルが見つからない場合の例外"""
    pass

class ModelLoadException(MLEngineException):
    """モデルの読み込みに失敗した場合の例外"""
    pass

class PredictionException(MLEngineException):
    """予測処理に失敗した場合の例外"""
    pass

class TrainingException(MLEngineException):
    """学習処理に失敗した場合の例外"""
    pass

class VisualizationException(MLEngineException):
    """可視化処理に失敗した場合の例外"""
    pass

def create_error_response(message: str, details: Optional[Dict[str, Any]] = None) -> HTTPException:
    """エラーレスポンスを作成"""
    return HTTPException(
        status_code=500,
        detail={
            "error": message,
            "details": details or {}
        }
    )

def create_not_found_response(message: str) -> HTTPException:
    """404エラーレスポンスを作成"""
    return HTTPException(
        status_code=404,
        detail={"error": message}
    )
