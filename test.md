# 追加したよ

# Environment
NODE_ENV=production

# Database - Supabase
PG_DATABASE_URL=postgres://postgres:postgrespassword@postgres:5432/default?connection_limit=1
SUPABASE_DATABASE_URL=postgresql://postgres:tomosigoto@db.iavrtdzbgxmklddarkgp.supabase.co:5432/postgres?connection_limit=10

NEXT_PUBLIC_SUPABASE_URL=https://uilydqaqephxtcnnqihy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_PD4f9KWx-NuqsmPgiF5mMg_b0UCcesO

# Debug
DEBUG_MODE=false
DEMO_MODE=false
TELEMETRY_ENABLED=true
TELEMETRY_ANONYMIZATION_ENABLED=true

# JWT Configuration (本番環境では必ず変更してください)
ACCESS_TOKEN_SECRET=secret_jwt_production_change_this
ACCESS_TOKEN_EXPIRES_IN=15m
LOGIN_TOKEN_SECRET=secret_login_token_production_change_this
LOGIN_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=secret_refresh_token_production_change_this
REFRESH_TOKEN_EXPIRES_IN=90d

# Frontend Auth Callback
FRONT_AUTH_CALLBACK_URL=http://localhost:3002/auth/callback

# Google Auth (Optional)
AUTH_GOOGLE_ENABLED=false
# AUTH_GOOGLE_CLIENT_ID=your_google_client_id
# AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
# AUTH_GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/redirect

# Storage Configuration
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=.local-storage