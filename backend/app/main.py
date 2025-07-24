from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Supabase連携を有効にする
from app.api.api import api_router
from app.core.config import settings

# 環境変数を読み込み
load_dotenv()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Supabase integration API with FastAPI best practices",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase連携APIルーターを有効にする
app.include_router(api_router, prefix=settings.API_V1_STR)

# ヘルスチェック用エンドポイント
@app.get("/")
async def root():
    return {"message": f"{settings.PROJECT_NAME} is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Supabase接続テスト用エンドポイント（認証不要）
@app.get("/debug/supabase-users")
async def debug_supabase_users():
    """実際のSupabaseからユーザを取得（デバッグ用・認証不要）"""
    try:
        from app.services.supabase_service import supabase_service
        from app.core.exceptions import create_success_response, create_error_response
        
        users = await supabase_service.get_all_users()
        return create_success_response(users, f"Found {len(users)} users")
    except Exception as e:
        from app.core.exceptions import create_error_response
        return create_error_response("Failed to fetch users", e)

@app.get("/debug/supabase-tables")
async def debug_supabase_tables():
    """利用可能なSupabaseテーブルを確認（デバッグ用）"""
    try:
        from app.services.supabase_service import supabase_service
        from app.core.exceptions import create_success_response, create_error_response
        
        tables = await supabase_service.get_table_list()
        return create_success_response(tables, "Available tables retrieved")
    except Exception as e:
        from app.core.exceptions import create_error_response
        return create_error_response("Failed to fetch tables", e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 