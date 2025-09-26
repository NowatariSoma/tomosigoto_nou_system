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

# CORS設定 - 本番環境用
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://noh.fullweak.com",
        "https://www.noh.fullweak.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
