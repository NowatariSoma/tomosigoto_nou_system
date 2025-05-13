# BACK-API-001.1: Supabase Auth設定と実装

## 概要
練習表自動生成システムの認証基盤となるSupabaseAuthの設定と実装を行います。Pythonを使用してメールアドレス認証、パスワードポリシー、セッション管理機能を実装し、システム全体のセキュリティ境界を確立します。

## 詳細
- Supabase認証プロバイダの設定とPythonラッパーの実装
- メールアドレス認証のセットアップとPython APIの開発
- パスワードポリシーと要件の設定
- 認証ページのカスタマイズ
- セッション管理とトークン有効期限のPython実装

## 依存関係
- 親タスク: BACK-API-001
- BACK-DB-001.1: ユーザー・メンバー管理テーブルの設計と実装

## 参照ファイル
- [設計書/07_権限・ロール設計.md](../../../../設計書/07_権限・ロール設計.md)
- [設計書/11g_実装指針_バックエンド.md](../../../../設計書/11g_実装指針_バックエンド.md)

## 成果物
- Supabase Auth設定ファイル
- Python認証クライアントライブラリ
- メール認証テンプレート
- 認証関連APIのエンドポイント定義
- 認証フロー実装コード
- 認証テスト仕様書

## ステータス
- [x] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **認証プロバイダ設定**
   - メールアドレス認証の有効化
   - パスワード認証の設定
   - SupabaseクライアントのPythonラッパー
   - FastAPI連携用のSupabase Auth APIの実装

2. **パスワードポリシー**
   - 最小文字数要件の実装
   - 文字種の複雑さ要件の検証ロジック
   - パスワード有効期限管理
   - Pythonによるパスワードリセットフロー

3. **認証ページカスタマイズ**
   - カスタムロゴと色設定
   - 利用規約とプライバシーポリシーリンク
   - Jinja2テンプレートによるエラーメッセージカスタマイズ
   - メールテンプレートのカスタマイズ

4. **セッション管理**
   - Pythonでのセッション有効期間の設定
   - リフレッシュトークン生成と検証
   - 同時ログイン制限の実装
   - 自動ログアウト機能

## 実装予定ファイル
以下は実装予定の全ファイルのリストです。各ファイルの役割と目的を簡潔に記載します。

- `lib/auth/supabase_client.py` - Supabase認証機能のPythonラッパー
- `lib/auth/auth_service.py` - 認証サービスの主要クラス
- `lib/auth/password_policy.py` - パスワードポリシー実装
- `lib/auth/session_manager.py` - セッション管理機能
- `api/auth/routes.py` - 認証関連APIエンドポイント
- `api/auth/schemas.py` - 認証関連のPydanticスキーマ
- `templates/emails/confirmation.html` - メール確認テンプレート
- `templates/emails/reset_password.html` - パスワードリセットテンプレート
- `supabase/config/auth.json` - Supabase Auth設定ファイル
- `tests/auth/test_auth_service.py` - 認証サービスのテスト
- `tests/auth/test_password_policy.py` - パスワードポリシーのテスト
- `tests/auth/test_session_manager.py` - セッション管理のテスト

## 設計図
### 実装する全ファイルのクラス図
```mermaid
classDiagram
    %% ライブラリクラス
    class SupabaseClient {
        +str api_url
        +str api_key
        -_client
        -_http_client: httpx.AsyncClient
        -_base_url: str
        -_auth_path: str
        -_timeout: int
        -_retry_attempts: int
        -_retry_delay: float
        +__init__(api_url: str, api_key: str, timeout: int = 10)
        +initialize() -> None
        +sign_up(email: str, password: str, user_data: dict = None) -> AuthResponse
        +sign_in(email: str, password: str) -> AuthResponse
        +sign_out(jwt: str) -> bool
        +reset_password(email: str) -> bool
        +confirm_reset(token: str, new_password: str) -> bool
        +refresh_token(refresh_token: str) -> AuthResponse
        +get_user(user_id: str) -> User
        +update_user(user_id: str, user_data: dict) -> User
        +get_user_by_email(email: str) -> Optional[User]
        +check_email_exists(email: str) -> bool
        +update_user_password(user_id: str, password: str) -> bool
        +delete_user(user_id: str) -> bool
        -_handle_error(response: httpx.Response) -> None
        -_build_headers(with_auth: bool = False, jwt: str = None) -> dict
        -_perform_request(method: str, path: str, data: dict = None, jwt: str = None) -> Any
        -_retry_request(func: Callable, *args, **kwargs) -> Any
    }
    
    class AuthService {
        +SupabaseClient client
        +SessionManager session_manager
        +PasswordPolicy password_policy
        +EmailService email_service
        -_logger: Logger
        -_default_session_limit: int
        -_failed_login_attempts: Dict
        +__init__(supabase_client: SupabaseClient, session_manager: SessionManager, password_policy: PasswordPolicy, email_service: EmailService)
        +register_user(email: str, password: str, user_data: dict = None) -> UserResponse
        +authenticate_user(email: str, password: str) -> AuthResponse
        +logout_user(jwt: str) -> bool
        +logout_all_devices(user_id: str) -> bool
        +request_password_reset(email: str) -> bool
        +confirm_password_reset(token: str, new_password: str) -> bool
        +verify_jwt(jwt: str) -> TokenPayload
        +refresh_auth_token(refresh_token: str) -> AuthResponse
        +get_user_profile(user_id: str) -> UserProfile
        +update_user_profile(user_id: str, profile_data: dict) -> UserProfile
        +check_session_valid(session_id: str, jwt: str) -> bool
        +verify_email(token: str) -> bool
        +resend_verification_email(email: str) -> bool
        +change_password(user_id: str, old_password: str, new_password: str) -> bool
        +get_login_history(user_id: str, limit: int = 10) -> List[LoginRecord]
        -_create_user_profile(user_id: str, user_data: dict) -> UserProfile
        -_validate_registration_data(email: str, password: str) -> None
        -_handle_auth_error(error: Exception) -> None
        -_increment_failed_attempt(email: str) -> int
        -_reset_failed_attempts(email: str) -> None
        -_check_account_lockout(email: str) -> bool
        -_generate_verification_token(user_id: str) -> str
        -_log_auth_event(event_type: str, user_id: str, details: dict = None) -> None
    }
    
    class SessionManager {
        -_redis_client
        -_session_ttl: int
        -_cache_prefix: str
        -_lock_timeout: int
        -_cleanup_interval: int
        +__init__(redis_client, session_ttl: int = 86400)
        +create_session(user_id: str, jwt: str, user_agent: str = None, ip_address: str = None) -> Session
        +validate_session(session_id: str, jwt: str) -> bool
        +terminate_session(session_id: str) -> bool
        +terminate_all_sessions(user_id: str) -> bool
        +get_active_sessions(user_id: str) -> List[Session]
        +refresh_session(session_id: str, refresh_token: str) -> Session
        +get_session(session_id: str) -> Optional[Session]
        +update_session_data(session_id: str, data: dict) -> bool
        +is_session_active(session_id: str) -> bool
        +extend_session(session_id: str, additional_time: int = None) -> bool
        +enforce_session_limit(user_id: str, max_sessions: int = 5) -> None
        +get_session_count(user_id: str) -> int
        +get_oldest_session(user_id: str) -> Optional[Session]
        +clear_expired_sessions() -> int
        -_generate_session_id() -> str
        -_generate_cache_key(session_id: str) -> str
        -_generate_user_sessions_key(user_id: str) -> str
        -_serialize_session(session: Session) -> str
        -_deserialize_session(data: str) -> Session
        -_acquire_lock(key: str) -> bool
        -_release_lock(key: str) -> bool
        -_schedule_cleanup() -> None
    }
    
    class PasswordPolicy {
        +int min_length
        +bool require_uppercase
        +bool require_lowercase
        +bool require_digit
        +bool require_special
        +int max_repeated_chars
        +List[str] forbidden_passwords
        +int password_history_count
        +int password_expiry_days
        +int token_expiry_minutes
        -_token_secret: str
        -_bcrypt_rounds: int
        +__init__(config: dict = None)
        +validate_password(password: str) -> ValidationResult
        +hash_password(password: str) -> str
        +verify_password(password: str, hash: str) -> bool
        +generate_reset_token(user_id: str) -> str
        +verify_reset_token(token: str) -> str
        +check_password_history(user_id: str, password: str) -> bool
        +add_to_password_history(user_id: str, password_hash: str) -> bool
        +enforce_password_expiry(user_id: str, max_age_days: int = 90) -> bool
        +is_password_expired(user_id: str) -> bool
        +get_password_expiry_date(user_id: str) -> Optional[datetime]
        +generate_temp_password() -> str
        -_check_complexity(password: str) -> List[str]
        -_check_common_passwords(password: str) -> bool
        -_check_leaked_passwords(password: str) -> bool
        -_encrypt_token(data: dict) -> str
        -_decrypt_token(token: str) -> dict
        -_load_forbidden_passwords() -> List[str]
        -_sanitize_password(password: str) -> str
    }
    
    class EmailService {
        -_templates_dir: str
        -_jinja_env: jinja2.Environment
        -_smtp_config: dict
        -_default_from_email: str
        -_queue: Queue
        -_is_async: bool
        -_worker_thread: Thread
        +__init__(templates_dir: str, smtp_config: dict, is_async: bool = True)
        +send_confirmation_email(email: str, confirmation_url: str) -> bool
        +send_password_reset_email(email: str, reset_url: str) -> bool
        +send_account_locked_email(email: str) -> bool
        +send_login_notification(email: str, login_info: dict) -> bool
        +send_password_changed_email(email: str) -> bool
        +send_profile_updated_email(email: str) -> bool
        +send_account_deletion_email(email: str) -> bool
        +start_worker() -> None
        +stop_worker() -> None
        +is_running() -> bool
        +get_queue_size() -> int
        -_get_template(template_name: str) -> jinja2.Template
        -_render_template(template_name: str, context: dict) -> str
        -_send_email(to_email: str, subject: str, body: str, is_html: bool = True) -> bool
        -_worker_process() -> None
        -_process_email_task(task: dict) -> bool
        -_log_email_status(to_email: str, subject: str, success: bool, error: str = None) -> None
    }
    
    %% モデルクラス
    class AuthResponse {
        +str access_token
        +str refresh_token
        +int expires_in
        +str token_type
        +UserResponse user
        +datetime issued_at
        +datetime expires_at
        +str session_id
        +__init__(response_data: dict)
        +is_expired() -> bool
        +time_until_expiry() -> timedelta
        +to_dict() -> dict
        +from_dict(data: dict) -> AuthResponse
    }
    
    class UserResponse {
        +str id
        +str email
        +bool email_verified
        +datetime created_at
        +datetime updated_at
        +datetime last_sign_in_at
        +UserProfile profile
        +List[str] roles
        +__init__(user_data: dict)
        +is_active() -> bool
        +to_dict() -> dict
        +from_dict(data: dict) -> UserResponse
    }
    
    class UserProfile {
        +str user_id
        +str display_name
        +str first_name
        +str last_name
        +str avatar_url
        +dict metadata
        +datetime created_at
        +datetime updated_at
        +__init__(profile_data: dict)
        +full_name() -> str
        +to_dict() -> dict
        +from_dict(data: dict) -> UserProfile
        +update(update_data: dict) -> None
    }
    
    class Session {
        +str id
        +str user_id
        +str jwt
        +datetime created_at
        +datetime expires_at
        +str ip_address
        +str user_agent
        +str device_info
        +dict metadata
        +__init__(user_id: str, jwt: str)
        +is_expired() -> bool
        +time_until_expiry() -> timedelta
        +extend(additional_time: int) -> None
        +to_dict() -> dict
        +from_dict(data: dict) -> Session
        +add_metadata(key: str, value: Any) -> None
        +get_metadata(key: str, default: Any = None) -> Any
    }
    
    class ValidationResult {
        +bool is_valid
        +List[str] errors
        +str message
        +__init__(is_valid: bool = True, errors: List[str] = None, message: str = "")
        +add_error(error: str) -> None
        +has_errors() -> bool
        +to_dict() -> dict
        +from_dict(data: dict) -> ValidationResult
    }
    
    class TokenPayload {
        +str sub
        +List[str] roles
        +int exp
        +int iat
        +str iss
        +str jti
        +str type
        +str session_id
        +__init__(payload: dict)
        +is_expired() -> bool
        +time_until_expiry() -> timedelta
        +has_role(role: str) -> bool
        +to_dict() -> dict
        +from_dict(data: dict) -> TokenPayload
    }
    
    class LoginRecord {
        +str id
        +str user_id
        +datetime timestamp
        +str ip_address
        +str user_agent
        +str device_info
        +str location
        +bool success
        +str failure_reason
        +__init__(user_id: str, success: bool = True)
        +to_dict() -> dict
        +from_dict(data: dict) -> LoginRecord
    }
    
    %% APIルーター関連
    class AuthRouter {
        +AuthService auth_service
        +UserService user_service
        +__init__(auth_service: AuthService, user_service = None)
        +register_user(user_data: UserCreate) -> UserResponse
        +login_user(credentials: UserLogin, request: Request) -> AuthResponse
        +logout_user(token: str = Depends(oauth2_scheme)) -> dict
        +logout_all_devices(token: str = Depends(oauth2_scheme)) -> dict
        +request_password_reset(email_data: EmailRequest) -> dict
        +confirm_password_reset(reset_data: PasswordReset) -> dict
        +refresh_token(refresh_data: RefreshRequest) -> AuthResponse
        +get_current_user(token: str = Depends(oauth2_scheme)) -> User
        +get_user_profile(current_user: User = Depends(get_current_user)) -> UserProfile
        +update_user_profile(profile_data: ProfileUpdate, current_user: User = Depends(get_current_user)) -> UserProfile
        +verify_email(token: str) -> dict
        +resend_verification(email_data: EmailRequest) -> dict
        +change_password(password_data: PasswordChange, current_user: User = Depends(get_current_user)) -> dict
        +get_login_history(current_user: User = Depends(get_current_user), limit: int = 10) -> List[LoginRecord]
        +get_active_sessions(current_user: User = Depends(get_current_user)) -> List[Session]
        +terminate_session(session_data: SessionTerminate, current_user: User = Depends(get_current_user)) -> dict
        -_extract_client_info(request: Request) -> dict
        -_handle_auth_error(e: Exception) -> HTTPException
    }
    
    %% Pydanticスキーマ
    class UserCreate {
        +str email
        +str password
        +str display_name
        +Optional[str] first_name
        +Optional[str] last_name
        +model_config: dict
        +validate_email(cls, v) -> str
        +validate_password(cls, v) -> str
    }
    
    class UserLogin {
        +str email
        +str password
        +model_config: dict
    }
    
    class EmailRequest {
        +str email
        +model_config: dict
        +validate_email(cls, v) -> str
    }
    
    class PasswordReset {
        +str token
        +str new_password
        +model_config: dict
        +validate_password(cls, v) -> str
    }
    
    class PasswordChange {
        +str current_password
        +str new_password
        +model_config: dict
        +validate_new_password(cls, v) -> str
    }
    
    class RefreshRequest {
        +str refresh_token
        +model_config: dict
    }
    
    class SessionTerminate {
        +str session_id
        +model_config: dict
    }
    
    class ProfileUpdate {
        +Optional[str] display_name
        +Optional[str] first_name
        +Optional[str] last_name
        +Optional[str] avatar_url
        +Optional[dict] metadata
        +model_config: dict
        +validate_avatar_url(cls, v) -> Optional[str]
    }
    
    %% テストクラス
    class TestAuthService {
        -_auth_service: AuthService
        -_mock_supabase: MagicMock
        -_mock_session_manager: MagicMock
        -_mock_password_policy: MagicMock
        -_mock_email_service: MagicMock
        +setUp() -> None
        +tearDown() -> None
        +test_register_user() -> None
        +test_register_user_with_weak_password() -> None
        +test_register_user_with_existing_email() -> None
        +test_authenticate_user() -> None
        +test_authenticate_user_invalid_credentials() -> None
        +test_authenticate_user_account_locked() -> None
        +test_logout_user() -> None
        +test_request_password_reset() -> None
        +test_request_password_reset_invalid_email() -> None
        +test_confirm_password_reset() -> None
        +test_confirm_password_reset_invalid_token() -> None
        +test_verify_jwt() -> None
        +test_verify_jwt_expired() -> None
        +test_refresh_auth_token() -> None
        +test_verify_email() -> None
    }
    
    class TestPasswordPolicy {
        -_password_policy: PasswordPolicy
        +setUp() -> None
        +tearDown() -> None
        +test_validate_password_valid() -> None
        +test_validate_password_too_short() -> None
        +test_validate_password_no_uppercase() -> None
        +test_validate_password_no_lowercase() -> None
        +test_validate_password_no_digit() -> None
        +test_validate_password_no_special() -> None
        +test_validate_password_repeated_chars() -> None
        +test_validate_password_common() -> None
        +test_hash_password() -> None
        +test_verify_password_valid() -> None
        +test_verify_password_invalid() -> None
        +test_generate_reset_token() -> None
        +test_verify_reset_token_valid() -> None
        +test_verify_reset_token_expired() -> None
        +test_verify_reset_token_tampered() -> None
        +test_check_password_history() -> None
        +test_enforce_password_expiry() -> None
        +test_generate_temp_password() -> None
    }
    
    class TestSessionManager {
        -_session_manager: SessionManager
        -_mock_redis: MagicMock
        +setUp() -> None
        +tearDown() -> None
        +test_create_session() -> None
        +test_validate_session_valid() -> None
        +test_validate_session_invalid() -> None
        +test_validate_session_expired() -> None
        +test_terminate_session() -> None
        +test_terminate_all_sessions() -> None
        +test_get_active_sessions() -> None
        +test_refresh_session() -> None
        +test_update_session_data() -> None
        +test_is_session_active() -> None
        +test_extend_session() -> None
        +test_enforce_session_limit() -> None
        +test_clear_expired_sessions() -> None
    }
    
    %% リレーションシップ
    AuthService --> SupabaseClient : 使用
    AuthService --> SessionManager : 使用
    AuthService --> PasswordPolicy : 使用
    AuthService --> EmailService : 使用
    AuthService --> UserProfile : 管理
    AuthService --> LoginRecord : 生成
    
    AuthRouter --> AuthService : 使用
    AuthRouter ..> UserCreate : 受け入れ
    AuthRouter ..> UserLogin : 受け入れ
    AuthRouter ..> EmailRequest : 受け入れ
    AuthRouter ..> PasswordReset : 受け入れ
    AuthRouter ..> PasswordChange : 受け入れ
    AuthRouter ..> RefreshRequest : 受け入れ
    AuthRouter ..> SessionTerminate : 受け入れ
    AuthRouter ..> ProfileUpdate : 受け入れ
    AuthRouter --> AuthResponse : 返却
    AuthRouter --> UserResponse : 返却
    AuthRouter --> Session : 返却
    
    AuthResponse o-- UserResponse : 含む
    UserResponse o-- UserProfile : 含む
    
    SessionManager --> Session : 管理
    PasswordPolicy --> ValidationResult : 生成
    
    TestAuthService --> AuthService : テスト
    TestPasswordPolicy --> PasswordPolicy : テスト
    TestSessionManager --> SessionManager : テスト
``` 