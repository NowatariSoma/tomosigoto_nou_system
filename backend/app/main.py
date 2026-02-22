# from dotenv import load_dotenv
# # 環境変数を読み込み
# load_dotenv()

# Supabase連携を有効にする
from app.api.api import api_router
from app.core.config import settings
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

# 本番環境ではdocsを無効にする
is_production = settings.ENVIRONMENT == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Supabase integration API with FastAPI best practices",
    version="1.0.0",
    openapi_url=None if is_production else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    redirect_slashes=False,
)


# CORS設定
# 開発環境ではすべてのオリジンを許可（本番環境では適切に制限すること）
cors_origins = settings.BACKEND_CORS_ORIGINS if settings.BACKEND_CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Supabase連携APIルーターを有効にする
app.include_router(api_router, prefix=settings.API_V1_STR)


# ヘルスチェック用エンドポイント
@app.get("/")
async def root() -> dict[str, str]:
    return {"message": f"{settings.PROJECT_NAME} is running"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


# favicon.ico エンドポイント（404エラーを防ぐため）
@app.get("/favicon.ico")
async def favicon():
    """
    ブラウザのfavicon要求に対応するエンドポイント
    実際のfaviconファイルがない場合の404エラーを防ぐ
    """
    return Response(status_code=204)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
