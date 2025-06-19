"""
Health check endpoints
"""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development" if settings.DEBUG else "production"
    }


@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with system information"""
    import psutil
    import os
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "upload_dir_exists": os.path.exists(settings.UPLOAD_DIR),
            "upload_dir_writable": os.access(settings.UPLOAD_DIR, os.W_OK)
        },
        "configuration": {
            "debug": settings.DEBUG,
            "max_file_size": settings.MAX_FILE_SIZE,
            "file_retention_hours": settings.FILE_RETENTION_HOURS
        }
    } 