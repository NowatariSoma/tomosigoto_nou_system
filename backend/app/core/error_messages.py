from typing import Any
from starlette import status


class BaseMessage:
    """メッセージクラスのベース"""
    
    text: str
    status_code: int = status.HTTP_400_BAD_REQUEST
    
    def __init__(self, param: Any | None = None) -> None:
        self.param = param
    
    def __str__(self) -> str:
        return self.__class__.__name__


class ErrorMessage:
    """エラーメッセージクラス
    
    Example: raise APIException(ErrorMessage.UNAUTHORIZED)
    """
    
    # 認証関連
    class UNAUTHORIZED(BaseMessage):
        status_code = status.HTTP_401_UNAUTHORIZED
        text = "認証が必要です"
    
    class INVALID_CREDENTIALS(BaseMessage):
        status_code = status.HTTP_401_UNAUTHORIZED
        text = "認証情報が無効です"
    
    class TOKEN_EXPIRED(BaseMessage):
        status_code = status.HTTP_401_UNAUTHORIZED
        text = "トークンの有効期限が切れています"
    
    # ユーザー関連
    class USER_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "ユーザーが見つかりません"
    
    class USER_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "このメールアドレスは既に使用されています"
    
    class INACTIVE_USER(BaseMessage):
        status_code = status.HTTP_403_FORBIDDEN
        text = "このユーザーは無効化されています"
    
    # 会場関連
    class VENUE_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "会場が見つかりません"
    
    class VENUE_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "この会場名は既に使用されています"
    
    # データベース関連
    class DATABASE_ERROR(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "データベースエラーが発生しました"
    
    class AUTHENTICATION_ERROR(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "認証エラーが発生しました"
    
    # 共通
    class INTERNAL_SERVER_ERROR(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "システムエラーが発生しました"
    
    class BAD_REQUEST(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "リクエストが不正です"
    
    class VALIDATION_ERROR(BaseMessage):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        text = "入力値が正しくありません: {}"