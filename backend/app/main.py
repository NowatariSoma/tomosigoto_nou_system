from dotenv import load_dotenv
# 環境変数を読み込み
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Supabase連携を有効にする
from app.api.api import api_router
from app.core.config import settings

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


@app.get("/debug/users-crud")
async def debug_users_crud():
    """ユーザーCRUD操作のテスト（デバッグ用・認証不要）"""
    try:
        from app.services.supabase_service import supabase_service
        from app.core.exceptions import create_success_response, create_error_response
        
        # ユーザー一覧取得
        users = await supabase_service.get_all_users()
        
        # 最初のユーザーでテスト
        if users:
            test_user = users[0]
            user_id = test_user["id"]
            
            # 特定ユーザー取得テスト
            specific_user = await supabase_service.get_user_by_id(user_id)
            
            return {
                "status": "success",
                "message": "CRUD operations test completed",
                "total_users": len(users),
                "test_user": specific_user,
                "all_users": users[:3]  # 最初の3ユーザーのみ表示
            }
        else:
            return create_error_response("No users found", "No users available for testing")
            
    except Exception as e:
        from app.core.exceptions import create_error_response
        return create_error_response("CRUD test failed", e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 