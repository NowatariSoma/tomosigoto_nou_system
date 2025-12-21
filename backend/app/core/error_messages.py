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
    
    class STUDENT_ID_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_409_CONFLICT
        text = "この学籍番号は既に使用されています"
    
    class INACTIVE_USER(BaseMessage):
        status_code = status.HTTP_403_FORBIDDEN
        text = "このユーザーは無効化されています"
    
    # パート関連
    class PART_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "パートが見つかりません"
    
    class PART_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "このパート名は既に使用されています"
    
    class INACTIVE_PART(BaseMessage):
        status_code = status.HTTP_403_FORBIDDEN
        text = "このパートは無効化されています"
    
    # ステージ関連
    class STAGE_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "指定されたステージが見つかりません"
    
    # メンバー所属関連
    class MEMBER_ASSIGNMENT_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "メンバー所属が見つかりません"
    
    class MEMBER_ASSIGNMENT_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "このユーザーは既に指定されたパートに所属しています"
    
    class INVALID_CATEGORY(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "カテゴリは 'utai' または 'mai' である必要があります"
    
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

    # 練習スケジュール関連
    class PRACTICE_SCHEDULE_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "練習スケジュールが見つかりません"

    class SESSION_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "セッションが見つかりません"

    class SCHEDULE_VENUE_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "スケジュール利用可能会場が見つかりません"

    class SESSION_INSTRUCTOR_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "セッション指導者が見つかりません"

    # カレンダー関連
    class INVALID_MONTH(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "月は1から12の範囲で指定してください"

    class INVALID_DATE_FORMAT(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "日付はYYYY-MM-DD形式で指定してください"
    
    # YouTube関連
    class INVALID_PLAYLIST_URL(BaseMessage):
        status_code = status.HTTP_400_BAD_REQUEST
        text = "無効な再生リストURLです"
    
    class CLIENT_SECRET_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "client_secretが見つかりません。GOOGLE_CLIENT_SECRETS_FILEを確認してください。"
    
    class TOKEN_REFRESH_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "トークンのリフレッシュに失敗しました: {}"
    
    class OAUTH_TOKEN_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_401_UNAUTHORIZED
        text = "YouTube OAuthトークンが見つかりません。先に認証を行ってください。"
    
    class YOUTUBE_QUOTA_EXCEEDED(BaseMessage):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
        text = "YouTube APIのクォータを超過しました"
    
    class YOUTUBE_ACCESS_DENIED(BaseMessage):
        status_code = status.HTTP_403_FORBIDDEN
        text = "この再生リストにアクセスできません。限定公開動画を含む場合は適切なOAuth認証が必要です。"
    
    class YOUTUBE_PLAYLIST_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "指定された再生リストが見つかりません"
    
    class YOUTUBE_API_ERROR(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "YouTube APIからの取得に失敗しました: {}"
    
    class SUB_PLAYLIST_NOT_FOUND(BaseMessage):
        status_code = status.HTTP_404_NOT_FOUND
        text = "指定されたサブプレイリストが見つかりません"
    
    class FAVORITE_ALREADY_EXISTS(BaseMessage):
        status_code = status.HTTP_409_CONFLICT
        text = "既にお気に入りに登録されています"
    
    # OAuth関連
    class STATE_SAVE_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "OAuth stateの保存に失敗しました: {}"
    
    class TOKEN_UPDATE_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "OAuthトークンの更新に失敗しました"
    
    class TOKEN_SAVE_FAILED(BaseMessage):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        text = "OAuthトークンの保存に失敗しました: {}"