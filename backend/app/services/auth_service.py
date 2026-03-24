"""
認証関連のビジネスロジックを処理するサービスクラス
"""
from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.core.database import Conn
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    get_refresh_token_expires,
    verify_password,
)

logger = logging.getLogger(__name__)

VERIFY_TOKEN_EXPIRE_HOURS = 24


class AuthService:
    """認証関連のビジネスロジックを処理するサービスクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn

    # ──────────────────────────────────────────────────────────
    # サインイン
    # ──────────────────────────────────────────────────────────
    def signin(self, email: str, password: str) -> dict[str, Any]:
        user = self.conn.execute(
            "SELECT id, email, encrypted_password, is_verified, raw_user_meta_data, "
            "created_at, updated_at, last_sign_in_at FROM users WHERE email = %s",
            (email,),
        ).fetchone()

        if not user or not verify_password(password, user["encrypted_password"]):
            raise APIException(ErrorMessage.INVALID_CREDENTIALS)

        if not user["is_verified"]:
            raise APIException(ErrorMessage.INACTIVE_USER)

        # last_sign_in_at を更新
        self.conn.execute(
            "UPDATE users SET last_sign_in_at = NOW() WHERE id = %s",
            (user["id"],),
        )

        access_token = create_access_token(str(user["id"]))
        refresh_token = create_refresh_token()
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        expires_at = get_refresh_token_expires()

        self.conn.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user["id"], refresh_hash, expires_at),
        )
        self.conn.commit()

        logger.info(f"User signed in: {email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "raw_user_meta_data": user["raw_user_meta_data"] or {},
                "created_at": user["created_at"],
                "updated_at": user["updated_at"],
                "last_sign_in_at": user["last_sign_in_at"],
            },
        }

    # ──────────────────────────────────────────────────────────
    # サインアップ
    # ──────────────────────────────────────────────────────────
    def signup(self, email: str, password: str) -> dict[str, str]:
        existing = self.conn.execute(
            "SELECT id FROM users WHERE email = %s", (email,)
        ).fetchone()
        if existing:
            raise APIException(ErrorMessage.USER_ALREADY_EXISTS)

        encrypted_password = get_password_hash(password)
        verify_token = secrets.token_urlsafe(32)
        expires = get_refresh_token_expires()  # 同じく30日（後で24h に変えてもOK）

        self.conn.execute(
            """
            INSERT INTO users
                (email, encrypted_password, is_verified, verify_token, verify_token_expires)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (email, encrypted_password, False, verify_token, expires),
        )
        self.conn.commit()

        # メール確認リンクを送信
        self._send_verification_email(email, verify_token)

        logger.info(f"User signed up: {email}")
        return {"message": "確認メールを送信しました。メールを確認してください。"}

    # ──────────────────────────────────────────────────────────
    # メール確認
    # ──────────────────────────────────────────────────────────
    def verify_email(self, token: str) -> dict[str, Any]:
        user = self.conn.execute(
            "SELECT id, email, verify_token_expires FROM users "
            "WHERE verify_token = %s AND is_verified = FALSE",
            (token,),
        ).fetchone()

        if not user:
            raise APIException(ErrorMessage.INVALID_CREDENTIALS)

        expires_at: datetime = user["verify_token_expires"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise APIException(ErrorMessage.TOKEN_EXPIRED)

        self.conn.execute(
            "UPDATE users SET is_verified = TRUE, verify_token = NULL, "
            "verify_token_expires = NULL WHERE id = %s",
            (user["id"],),
        )

        access_token = create_access_token(str(user["id"]))
        refresh_token = create_refresh_token()
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        self.conn.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user["id"], refresh_hash, get_refresh_token_expires()),
        )
        self.conn.commit()

        logger.info(f"Email verified: {user['email']}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_token": refresh_token,
            "user": {"id": str(user["id"]), "email": user["email"]},
        }

    # ──────────────────────────────────────────────────────────
    # サインアウト
    # ──────────────────────────────────────────────────────────
    def signout(self, refresh_token: str) -> dict[str, str]:
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        self.conn.execute(
            "DELETE FROM refresh_tokens WHERE token = %s", (token_hash,)
        )
        self.conn.commit()
        return {"message": "Successfully signed out"}

    # ──────────────────────────────────────────────────────────
    # トークンリフレッシュ
    # ──────────────────────────────────────────────────────────
    def refresh_token(self, refresh_token: str) -> dict[str, Any]:
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        row = self.conn.execute(
            "SELECT id, user_id, expires_at FROM refresh_tokens WHERE token = %s",
            (token_hash,),
        ).fetchone()

        if not row:
            raise APIException(ErrorMessage.INVALID_CREDENTIALS)

        expires_at: datetime = row["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            self.conn.execute(
                "DELETE FROM refresh_tokens WHERE id = %s", (row["id"],)
            )
            self.conn.commit()
            raise APIException(ErrorMessage.TOKEN_EXPIRED)

        # ローテーション: 古いトークン削除 → 新しいトークン発行
        self.conn.execute(
            "DELETE FROM refresh_tokens WHERE id = %s", (row["id"],)
        )

        user = self.conn.execute(
            "SELECT email FROM users WHERE id = %s", (row["user_id"],)
        ).fetchone()
        if not user:
            self.conn.commit()
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        new_access_token = create_access_token(str(row["user_id"]))
        new_refresh_token = create_refresh_token()
        new_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()
        self.conn.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (row["user_id"], new_hash, get_refresh_token_expires()),
        )
        self.conn.commit()

        logger.info(f"Token refreshed for user_id={row['user_id']}")
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_token": new_refresh_token,
        }

    # ──────────────────────────────────────────────────────────
    # パスワードリセット（メール送信）
    # ──────────────────────────────────────────────────────────
    def reset_password(self, email: str) -> dict[str, str]:
        user = self.conn.execute(
            "SELECT id FROM users WHERE email = %s", (email,)
        ).fetchone()
        # セキュリティのため、存在しなくても成功を返す
        if user:
            reset_token = secrets.token_urlsafe(32)
            self.conn.execute(
                "UPDATE users SET verify_token = %s, verify_token_expires = NOW() + INTERVAL '1 hour' "
                "WHERE id = %s",
                (reset_token, user["id"]),
            )
            self.conn.commit()
            self._send_password_reset_email(email, reset_token)

        return {"message": "パスワードリセットメールを送信しました"}

    # ──────────────────────────────────────────────────────────
    # パスワード更新
    # ──────────────────────────────────────────────────────────
    def update_password(self, reset_token: str, new_password: str) -> dict[str, str]:
        user = self.conn.execute(
            "SELECT id, verify_token_expires FROM users WHERE verify_token = %s",
            (reset_token,),
        ).fetchone()

        if not user:
            raise APIException(ErrorMessage.INVALID_CREDENTIALS)

        expires_at: datetime = user["verify_token_expires"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise APIException(ErrorMessage.TOKEN_EXPIRED)

        hashed = get_password_hash(new_password)
        self.conn.execute(
            "UPDATE users SET encrypted_password = %s, verify_token = NULL, "
            "verify_token_expires = NULL WHERE id = %s",
            (hashed, user["id"]),
        )
        self.conn.commit()

        logger.info(f"Password updated for user_id={user['id']}")
        return {"message": "パスワードを更新しました"}

    # ──────────────────────────────────────────────────────────
    # メール送信ヘルパー
    # ──────────────────────────────────────────────────────────
    def _send_email(self, to: str, subject: str, html: str) -> bool:
        if not settings.EMAIL_WORKER_SECRET or not settings.EMAIL_WORKER_URL:
            logger.warning("EMAIL_WORKER not configured, skipping email send")
            return False
        try:
            r = httpx.post(
                settings.EMAIL_WORKER_URL,
                headers={"Authorization": f"Bearer {settings.EMAIL_WORKER_SECRET}"},
                json={"to": to, "subject": subject, "html": html},
                timeout=10,
            )
            return r.status_code == 200
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False

    def _send_verification_email(self, email: str, token: str) -> None:
        url = f"{settings.APP_BASE_URL}/verify-email?token={token}"
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2>メールアドレスの確認</h2>
          <p>ともしごとへようこそ。以下のボタンをクリックしてメールアドレスを確認してください。</p>
          <a href="{url}" style="display:inline-block;background:#1a56db;color:#fff;
             padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">
            メールアドレスを確認する
          </a>
          <p style="color:#888;font-size:12px">このリンクは24時間有効です。</p>
        </div>
        """
        self._send_email(email, "【ともしごと】メールアドレスの確認", html)

    def _send_password_reset_email(self, email: str, token: str) -> None:
        url = f"{settings.APP_BASE_URL}/reset-password?token={token}"
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2>パスワードのリセット</h2>
          <p>以下のボタンをクリックしてパスワードをリセットしてください。</p>
          <a href="{url}" style="display:inline-block;background:#1a56db;color:#fff;
             padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">
            パスワードをリセットする
          </a>
          <p style="color:#888;font-size:12px">このリンクは1時間有効です。</p>
        </div>
        """
        self._send_email(email, "【ともしごと】パスワードのリセット", html)
