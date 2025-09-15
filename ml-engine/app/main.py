"""
ML-Engine FastAPI Application
ポート8001で動作する機械学習サービス
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import ml_router
from app.core.config import settings

app = FastAPI(
    title="ML-Engine",
    description="機械学習エンジンサービス（強化学習ベースのスケジュール最適化）",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],  # バックエンドからのアクセスを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ML API ルーターを追加
app.include_router(ml_router, prefix="/api/v1")

@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {
        "message": "ML-Engine is running",
        "version": "1.0.0",
        "port": 8001
    }

@app.get("/health")
async def health_check():
    """ヘルスチェック用エンドポイント"""
    return {"status": "healthy", "service": "ml-engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
