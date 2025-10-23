"""
APIルーター統合

既存のバックエンド構成に合わせたAPIルーター
"""

from app.api.endpoints import optimization
from fastapi import APIRouter

api_router = APIRouter()

# 最適化エンジン関連のエンドポイント
api_router.include_router(
    optimization.router, 
    prefix="/ortools", 
    tags=["ortools-optimization"]
)
