"""
YouTube OAuth認証用エンドポイント（リファクタリング版）
システム管理者用のYouTube OAuth認証フローを提供

改善点:
- state管理をDBで実装（CSRF対策）
- client_secretをDBに保存しない
- エラー処理の改善
- Flow生成の共通化
- より堅牢な実装
"""
import os
import secrets
import logging
from typing import Any
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow

from app.api.deps import get_youtube_oauth_token_repository
from app.core.config import settings
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage

logger = logging.getLogger(__name__)

router = APIRouter()

# Google OAuth設定
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
STATE_EXPIRY_MINUTES = 10  # stateの有効期限（分）


def _validate_oauth_config() -> str:
    """
    OAuth設定を検証し、redirect_uriを返す

    Returns:
        redirect_uri

    Raises:
        HTTPException: 設定が不正な場合
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET が設定されていません"
        )

    redirect_uri = settings.YOUTUBE_OAUTH_REDIRECT_URI
    if not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="YOUTUBE_OAUTH_REDIRECT_URIが設定されていません"
        )

    return redirect_uri


def _create_oauth_flow(redirect_uri: str, state: str | None = None) -> Flow:
    """
    OAuth Flowインスタンスを作成

    Args:
        redirect_uri: リダイレクトURI
        state: OAuth state（オプション）

    Returns:
        Flowインスタンス
    """
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=redirect_uri,
        state=state
    )


def _save_oauth_state(
    token_repository,
    state: str
) -> None:
    """
    OAuth stateをDBに保存

    Args:
        token_repository: YoutubeOauthTokenリポジトリ
        state: OAuth state

    Raises:
        APIException: 保存に失敗した場合
    """
    try:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=STATE_EXPIRY_MINUTES)

        token_repository.save_oauth_state(state, expires_at.isoformat())
    except Exception as e:
        logger.error(f"Failed to save OAuth state: {str(e)}")
        raise APIException(ErrorMessage.STATE_SAVE_FAILED(str(e)))


def _verify_oauth_state(
    token_repository,
    state: str
) -> bool:
    """
    OAuth stateを検証し、使用後は削除

    Args:
        token_repository: YoutubeOauthTokenリポジトリ
        state: 検証するOAuth state

    Returns:
        stateが有効な場合True、無効な場合False
    """
    try:
        state_data = token_repository.find_oauth_state(state)

        if not state_data:
            logger.warning(f"OAuth state not found: {state[:8]}...")
            return False

        expires_at_str = state_data["expires_at"]

        # タイムゾーン情報を統一してパース
        if expires_at_str.endswith("Z"):
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
        else:
            expires_at = datetime.fromisoformat(expires_at_str)

        # 現在時刻をUTCで取得（タイムゾーン情報付き）
        now_utc = datetime.now(timezone.utc)

        # 期限切れチェック
        if expires_at < now_utc:
            logger.warning(f"OAuth state expired: {state[:8]}...")
            # 期限切れのstateを削除
            token_repository.delete_oauth_state(state_data["id"])
            return False

        # 使用済みのstateを削除（ワンタイム使用）
        token_repository.delete_oauth_state(state_data["id"])

        return True

    except Exception as e:
        logger.error(f"Failed to verify OAuth state: {str(e)}")
        return False


def _save_oauth_token(
    token_repository,
    credentials: Any
) -> None:
    """
    OAuthトークンをDBに保存（client_secretは保存しない）

    Args:
        token_repository: YoutubeOauthTokenリポジトリ
        credentials: Google認証情報

    Raises:
        APIException: 保存に失敗した場合
    """
    try:
        # client_secretは保存しない（セキュリティ上の理由）
        token_data = {
            "account_type": "system",
            "user_id": None,
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            # client_secretは保存しない
            "scopes": list(credentials.scopes),
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None
        }

        existing = token_repository.find_system_token()

        if existing:
            # 更新
            token_repository.update_token(existing["id"], token_data)
            logger.info("YouTube OAuth token updated for system account")
        else:
            # 新規作成
            token_repository.create_token(token_data)
            logger.info("YouTube OAuth token created for system account")

    except APIException:
        raise
    except Exception as e:
        logger.error(f"Failed to save OAuth token: {str(e)}")
        raise APIException(ErrorMessage.TOKEN_SAVE_FAILED(str(e)))


@router.get("/youtube/oauth/authorize")
def authorize_youtube(
    token_repository=Depends(get_youtube_oauth_token_repository),
):
    """
    YouTube OAuth認証を開始

    システム管理者用の認証フローを開始します。
    stateはDBに保存され、CSRF対策として使用されます。
    """
    try:
        redirect_uri = _validate_oauth_config()

        # OAuth Flowを作成
        flow = _create_oauth_flow(redirect_uri)

        # 認証URLとstateを生成
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # リフレッシュトークンを確実に取得
        )

        # stateをDBに保存（CSRF対策）
        _save_oauth_state(token_repository, state)

        return {
            "authorization_url": authorization_url,
            "state": state,  # デバッグ用（本番環境では返さない方が良い）
            "message": "ブラウザでauthorization_urlにアクセスして認証を完了してください"
        }

    except HTTPException:
        raise
    except APIException as e:
        error_msg = e.detail.get("error_msg", str(e.detail)) if isinstance(e.detail, dict) else str(e.detail)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    except Exception as e:
        logger.error(f"Failed to create OAuth flow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth認証の開始に失敗しました: {str(e)}"
        )


@router.get("/youtube/oauth/callback")
def youtube_oauth_callback(
    code: str | None = Query(None, description="OAuth認証コード"),
    state: str | None = Query(None, description="OAuth state（必須）"),
    error: str | None = Query(None, description="OAuthエラー"),
    token_repository=Depends(get_youtube_oauth_token_repository),
):
    """
    YouTube OAuth認証のコールバック

    認証成功後、トークンをDBに保存します。
    stateの検証によりCSRF攻撃を防ぎます。

    注意: このエンドポイントはGoogle OAuth認証後のリダイレクト用です。
    直接アクセスする場合は、/youtube/oauth/authorize から認証を開始してください。
    """
    # 直接アクセスされた場合のエラーメッセージ
    if not code and not state and not error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このエンドポイントはGoogle OAuth認証後のリダイレクト用です。認証を開始するには /youtube/oauth/authorize にアクセスしてください。"
        )

    # 必須パラメータのチェック
    if not code and not error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth認証コード（code）が提供されていません。認証を開始するには /youtube/oauth/authorize にアクセスしてください。"
        )

    if not state and not error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth stateが提供されていません。認証を開始するには /youtube/oauth/authorize にアクセスしてください。"
        )

    # OAuthエラーチェック
    if error:
        logger.error(f"OAuth error from Google: {error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth認証が拒否されました: {error}"
        )

    # stateの検証（CSRF対策）
    if not _verify_oauth_state(token_repository, state):
        logger.warning(f"Invalid or expired OAuth state: {state[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効または期限切れのOAuth stateです"
        )

    try:
        redirect_uri = _validate_oauth_config()

        # 同じstateでFlowを作成（Googleの推奨方法）
        flow = _create_oauth_flow(redirect_uri, state=state)

        # トークンを取得
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # リフレッシュトークンが取得できなかった場合の警告
        if not credentials.refresh_token:
            logger.warning("Refresh token was not provided. User may need to revoke access and re-authenticate.")

        # トークンをDBに保存（client_secretは保存しない）
        _save_oauth_token(token_repository, credentials)

        return {
            "message": "YouTube認証が完了しました",
            "status": "success",
            "has_refresh_token": bool(credentials.refresh_token)
        }

    except HTTPException:
        raise
    except APIException as e:
        error_msg = e.detail.get("error_msg", str(e.detail)) if isinstance(e.detail, dict) else str(e.detail)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    except Exception as e:
        logger.error(f"Failed to process OAuth callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth認証の処理に失敗しました: {str(e)}"
        )


@router.get("/youtube/oauth/status")
def youtube_oauth_status(
    token_repository=Depends(get_youtube_oauth_token_repository),
):
    """
    YouTube OAuth認証の状態を確認

    システム管理者のトークンが保存されているか、期限切れかを確認します。
    リダイレクトURIの設定も確認できます。
    """
    try:
        # リダイレクトURIの設定を確認
        redirect_uri = None
        redirect_uri_error = None
        try:
            redirect_uri = _validate_oauth_config()
        except Exception as e:
            redirect_uri_error = str(e)

        token_data = token_repository.find_system_token()

        result = {
            "authenticated": False,
            "redirect_uri": redirect_uri,
            "redirect_uri_error": redirect_uri_error,
            "callback_url": f"{settings.API_V1_STR}/youtube/oauth/callback" if redirect_uri else None,
            "message": "OAuth認証が完了していません"
        }

        if not token_data:
            return result

        expiry = token_data.get("expiry")

        is_expired = False
        if expiry:
            try:
                expiry_dt = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                is_expired = expiry_dt < datetime.now(expiry_dt.tzinfo)
            except Exception as e:
                logger.warning(f"Failed to parse expiry date: {str(e)}")

        result.update({
            "authenticated": True,
            "expired": is_expired,
            "expiry": expiry,
            "created_at": token_data.get("created_at"),
            "has_refresh_token": bool(token_data.get("refresh_token"))
        })

        return result

    except Exception as e:
        logger.error(f"Failed to check OAuth status: {str(e)}")
        return {
            "authenticated": False,
            "error": str(e),
            "redirect_uri": None,
            "redirect_uri_error": str(e)
        }
