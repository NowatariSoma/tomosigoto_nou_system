"""
Application configuration settings
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS settings
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "/tmp/ppt_uploads"
    FILE_RETENTION_HOURS: int = 24
    
    # Database settings (for future use)
    DATABASE_URL: str = "sqlite:///./ppt_diff.db"
    
    # Redis settings (for future use)
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True) 