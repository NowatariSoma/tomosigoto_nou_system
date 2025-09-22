# from dotenv import load_dotenv
# # 環境変数を読み込み
# load_dotenv()

# Supabase連携を有効にする
from app.api.api import api_router
from app.core.config import settings
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Supabase integration API with FastAPI best practices",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
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


# favicon.ico エンドポイント（404エラーを防ぐため）
@app.get("/favicon.ico")
async def favicon():
    """
    ブラウザのfavicon要求に対応するエンドポイント
    実際のfaviconファイルがない場合の404エラーを防ぐ
    """
    return Response(status_code=204)


# Supabase接続テスト用エンドポイント（認証不要）
@app.get("/debug/supabase-users")
async def debug_supabase_users():
    """実際のSupabaseからユーザを取得（デバッグ用・認証不要）"""
    try:
        from app.core.exceptions import create_error_response, create_success_response
        from app.core.supabase import get_supabase
        from app.repositories.user_repository import UserRepository
        from app.services.user_service import UserService

        client = get_supabase()
        repository = UserRepository(client)
        service = UserService(repository, client.auth)

        users = await service.get_all_users()
        return create_success_response(users, f"Found {len(users)} users")
    except Exception as e:
        from app.core.exceptions import create_error_response

        return create_error_response("Failed to fetch users", e)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
