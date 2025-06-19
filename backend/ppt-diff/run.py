#!/usr/bin/env python
"""
PowerPoint Diff API Server
Run this script to start the FastAPI server
"""
import uvicorn
from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    print("🚀 Starting PowerPoint Diff API Server...")
    print(f"📍 Server will be available at: http://{settings.HOST}:{settings.PORT}")
    print(f"📚 API Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔧 Debug mode: {settings.DEBUG}")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    ) 