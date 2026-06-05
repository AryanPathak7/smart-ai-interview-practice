import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart AI Interview Practice Platform"
    
    # Database
    DATABASE_URL: str = "sqlite:////tmp/interview_practice.db" if os.environ.get("VERCEL") else "sqlite:///./interview_practice.db"

    
    # JWT Authentication
    JWT_SECRET: str = "supersecretkey_interview_practice_platform_12345!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # AI Keys
    GEMINI_API_KEY: Optional[str] = None
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
