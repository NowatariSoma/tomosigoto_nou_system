"""
OR-Tools最適化エンジンのメインアプリケーション

既存のバックエンド構成に合わせたFastAPIアプリケーション
"""

from app.api.api import api_router
from app.core.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="OR-Tools based optimization engine for schedule optimization",
    version=settings.VERSION,
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

# APIルーターを有効にする
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": f"{settings.PROJECT_NAME} is running",
        "version": settings.VERSION,
        "status": "healthy",
        "docs": f"/{settings.API_V1_STR}/docs"
    }




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
