"""
FastAPI Main Application
PowerPoint Diff API Backend
"""
import sys
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add the parent project src to Python path to import existing modules
project_root = Path(__file__).parent.parent.parent.parent
src_path = project_root / "src"
sys.path.insert(0, str(src_path))

from app.api import compare, health
from app.core.config import settings

# Create FastAPI application
app = FastAPI(
    title="PowerPoint Diff API",
    description="API for comparing PowerPoint presentations with GitHub-like interface",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(compare.router, prefix="/api/v1", tags=["compare"])

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "PowerPoint Diff API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    ) 