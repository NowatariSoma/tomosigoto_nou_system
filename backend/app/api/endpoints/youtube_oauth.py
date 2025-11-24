"""
YouTube OAuth認証用エンドポイント（リファクタリング版）
システム管理者用のYouTube OAuth認証フローを提供

改善点:
- state管理をSupabaseで実装（CSRF対策）
- client_secretをDBに保存しない
- エラー処理の改善
- Flow生成の共通化
- より堅牢な実装
"""
import os
import secrets
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from supabase import Client

from app.api.deps import get_supabase
from app.core.config import settings
from app.core.exceptions import APIException

logger = logging.getLogger(__name__)

router = APIRouter()

# Google OAuth設定
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
STATE_EXPIRY_MINUTES = 10  # stateの有効期限（分）


def _validate_oauth_config() -> tuple[str, str]:
    """
    OAuth設定を検証し、必要な値を返す
    
    Returns:
        (client_secrets_file, redirect_uri)のタプル
        
    Raises:
        HTTPException: 設定が不正な場合
    """
    client_secrets_file = settings.GOOGLE_CLIENT_SECRETS_FILE
    redirect_uri = settings.YOUTUBE_OAUTH_REDIRECT_URI
    
    if not client_secrets_file:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_SECRETS_FILEが設定されていません"
        )
    
    if not os.path.exists(client_secrets_file):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth設定ファイルが見つかりません: {client_secrets_file}"
        )
    
    if not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="YOUTUBE_OAUTH_REDIRECT_URIが設定されていません"
        )
    
    return client_secrets_file, redirect_uri


def _create_oauth_flow(
    client_secrets_file: str,
    redirect_uri: str,
    state: Optional[str] = None
) -> Flow:
    """
    OAuth Flowインスタンスを作成
    
    Args:
        client_secrets_file: クライアントシークレットファイルのパス
        redirect_uri: リダイレクトURI
        state: OAuth state（オプション）
        
    Returns:
        Flowインスタンス
    """
    return Flow.from_client_secrets_file(
        client_secrets_file,
        scopes=SCOPES,
        redirect_uri=redirect_uri,
        state=state
    )


async def _save_oauth_state(
    supabase_client: Client,
    state: str
) -> None:
    """
    OAuth stateをSupabaseに保存
    
    Args:
        supabase_client: Supabaseクライアント
        state: OAuth state
        
    Raises:
        APIException: 保存に失敗した場合
    """
    try:
        expires_at = datetime.utcnow() + timedelta(minutes=STATE_EXPIRY_MINUTES)
        
        response = supabase_client.table("youtube_oauth_states").insert({
            "state": state,
            "expires_at": expires_at.isoformat()
        }).execute()
        
        if response.data is None:
            raise APIException(
                error_code="STATE_SAVE_FAILED",
                error_msg="OAuth stateの保存に失敗しました"
            )
        
        logger.info(f"OAuth state saved: {state[:8]}...")
    except Exception as e:
        logger.error(f"Failed to save OAuth state: {str(e)}")
        raise APIException(
            error_code="STATE_SAVE_FAILED",
            error_msg=f"OAuth stateの保存に失敗しました: {str(e)}"
        )


async def _verify_oauth_state(
    supabase_client: Client,
    state: str
) -> bool:
    """
    OAuth stateを検証し、使用後は削除
    
    Args:
        supabase_client: Supabaseクライアント
        state: 検証するOAuth state
        
    Returns:
        stateが有効な場合True、無効な場合False
    """
    try:
        # stateを検索
        response = supabase_client.table("youtube_oauth_states").select("*").eq(
            "state", state
        ).execute()
        
        if not response.data:
            logger.warning(f"OAuth state not found: {state[:8]}...")
            return False
        
        state_data = response.data[0]
        expires_at = datetime.fromisoformat(
            state_data["expires_at"].replace("Z", "+00:00")
        )
        
        # 期限切れチェック
        if expires_at < datetime.now(expires_at.tzinfo):
            logger.warning(f"OAuth state expired: {state[:8]}...")
            # 期限切れのstateを削除
            supabase_client.table("youtube_oauth_states").delete().eq(
                "id", state_data["id"]
            ).execute()
            return False
        
        # 使用済みのstateを削除（ワンタイム使用）
        supabase_client.table("youtube_oauth_states").delete().eq(
            "id", state_data["id"]
        ).execute()
        
        logger.info(f"OAuth state verified and deleted: {state[:8]}...")
        return True
        
    except Exception as e:
        logger.error(f"Failed to verify OAuth state: {str(e)}")
        return False


def _save_oauth_token(
    supabase_client: Client,
    credentials: Any
) -> None:
    """
    OAuthトークンをSupabaseに保存（client_secretは保存しない）
    
    Args:
        supabase_client: Supabaseクライアント
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
        
        # 既存のシステム管理者トークンがあるか確認
        existing = (
            supabase_client.table("youtube_oauth_tokens")
            .select("id")
            .eq("account_type", "system")
            .execute()
        )
        
        if existing.data:
            # 更新
            response = supabase_client.table("youtube_oauth_tokens").update(
                token_data
            ).eq("account_type", "system").execute()
            
            if response.data is None:
                raise APIException(
                    error_code="TOKEN_UPDATE_FAILED",
                    error_msg="OAuthトークンの更新に失敗しました"
                )
            
            logger.info("YouTube OAuth token updated for system account")
        else:
            # 新規作成
            response = supabase_client.table("youtube_oauth_tokens").insert(
                token_data
            ).execute()
            
            if response.data is None:
                raise APIException(
                    error_code="TOKEN_SAVE_FAILED",
                    error_msg="OAuthトークンの保存に失敗しました"
                )
            
            logger.info("YouTube OAuth token created for system account")
            
    except APIException:
        raise
    except Exception as e:
        logger.error(f"Failed to save OAuth token: {str(e)}")
        raise APIException(
            error_code="TOKEN_SAVE_FAILED",
            error_msg=f"OAuthトークンの保存に失敗しました: {str(e)}"
        )


@router.get("/youtube/oauth/authorize")
async def authorize_youtube(
    supabase_client: Client = Depends(get_supabase),
):
    """
    YouTube OAuth認証を開始
    
    システム管理者用の認証フローを開始します。
    stateはSupabaseに保存され、CSRF対策として使用されます。
    """
    try:
        client_secrets_file, redirect_uri = _validate_oauth_config()
        
        # OAuth Flowを作成
        flow = _create_oauth_flow(client_secrets_file, redirect_uri)
        
        # 認証URLとstateを生成
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # リフレッシュトークンを確実に取得
        )
        
        # stateをSupabaseに保存（CSRF対策）
        await _save_oauth_state(supabase_client, state)
        
        return {
            "authorization_url": authorization_url,
            "state": state,  # デバッグ用（本番環境では返さない方が良い）
            "message": "ブラウザでauthorization_urlにアクセスして認証を完了してください"
        }
        
    except HTTPException:
        raise
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.error_msg
        )
    except Exception as e:
        logger.error(f"Failed to create OAuth flow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth認証の開始に失敗しました: {str(e)}"
        )


@router.get("/youtube/oauth/callback")
async def youtube_oauth_callback(
    code: str = Query(..., description="OAuth認証コード"),
    state: str = Query(..., description="OAuth state（必須）"),
    error: Optional[str] = Query(None, description="OAuthエラー"),
    supabase_client: Client = Depends(get_supabase),
):
    """
    YouTube OAuth認証のコールバック
    
    認証成功後、トークンをDBに保存します。
    stateの検証によりCSRF攻撃を防ぎます。
    """
    # OAuthエラーチェック
    if error:
        logger.error(f"OAuth error from Google: {error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth認証が拒否されました: {error}"
        )
    
    # stateの検証（CSRF対策）
    if not await _verify_oauth_state(supabase_client, state):
        logger.warning(f"Invalid or expired OAuth state: {state[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効または期限切れのOAuth stateです"
        )
    
    try:
        client_secrets_file, redirect_uri = _validate_oauth_config()
        
        # 同じstateでFlowを作成（Googleの推奨方法）
        flow = _create_oauth_flow(client_secrets_file, redirect_uri, state=state)
        
        # トークンを取得
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # リフレッシュトークンが取得できなかった場合の警告
        if not credentials.refresh_token:
            logger.warning("Refresh token was not provided. User may need to revoke access and re-authenticate.")
        
        # トークンをDBに保存（client_secretは保存しない）
        _save_oauth_token(supabase_client, credentials)
        
        return {
            "message": "YouTube認証が完了しました",
            "status": "success",
            "has_refresh_token": bool(credentials.refresh_token)
        }
        
    except HTTPException:
        raise
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.error_msg
        )
    except Exception as e:
        logger.error(f"Failed to process OAuth callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth認証の処理に失敗しました: {str(e)}"
        )


@router.get("/youtube/oauth/status")
async def youtube_oauth_status(
    supabase_client: Client = Depends(get_supabase),
):
    """
    YouTube OAuth認証の状態を確認
    
    システム管理者のトークンが保存されているか、期限切れかを確認します。
    """
    try:
        response = (
            supabase_client.table("youtube_oauth_tokens")
            .select("id, expiry, created_at, refresh_token")
            .eq("account_type", "system")
            .execute()
        )
        
        if not response.data:
            return {
                "authenticated": False,
                "message": "OAuth認証が完了していません"
            }
        
        token_data = response.data[0]
        expiry = token_data.get("expiry")
        
        is_expired = False
        if expiry:
            try:
                expiry_dt = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                is_expired = expiry_dt < datetime.now(expiry_dt.tzinfo)
            except Exception as e:
                logger.warning(f"Failed to parse expiry date: {str(e)}")
        
        return {
            "authenticated": True,
            "expired": is_expired,
            "expiry": expiry,
            "created_at": token_data.get("created_at"),
            "has_refresh_token": bool(token_data.get("refresh_token"))
        }
        
    except Exception as e:
        logger.error(f"Failed to check OAuth status: {str(e)}")
        return {
            "authenticated": False,
            "error": str(e)
        }
