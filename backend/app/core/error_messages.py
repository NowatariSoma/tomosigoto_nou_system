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
        status_code = status.HTTP_409_CONFLICT
        text = "このメールアドレスは既に使用されています"
    
    class INACTIVE_USER(BaseMessage):
        status_code = status.HTTP_403_FORBIDDEN
        text = "このユーザーは無効化されています"
    
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
    
    # 練習表関連
    class PRACTICE_SLOT_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "練習表が見つかりません"
    
    class PRACTICE_SLOT_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_409_CONFLICT
        text = "この日付の練習表は既に存在します"
    
    class SCHEDULE_ITEM_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "スケジュールアイテムが見つかりません"
    
    # グループ関連
    class GROUP_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "グループが見つかりません"
    
    class GROUP_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_409_CONFLICT
        text = "この名前のグループは既に存在します"
    
    # パート関連
    class PART_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "パートが見つかりません"
    
    class PART_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_409_CONFLICT
        text = "この名前のパートは既に存在します"
    
    # 練習スケジュール関連
    class PRACTICE_SCHEDULE_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "練習スケジュールが見つかりません"
    
    class PRACTICE_SCHEDULE_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_409_CONFLICT
        text = "この日付の練習スケジュールは既に存在します"
    
    class PRACTICE_SCHEDULE_CREATION_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "練習スケジュールの作成に失敗しました"
    
    class PRACTICE_SCHEDULE_DELETION_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "練習スケジュールの削除に失敗しました"
    
    # セッション関連
    class SESSION_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "セッションが見つかりません"
    
    class SESSION_CREATION_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "セッションの作成に失敗しました"
    
    class SESSION_DELETION_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "セッションの削除に失敗しました"
    
    # 共通エラー
    class INVALID_UPDATE_DATA(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "有効な更新データが提供されていません"