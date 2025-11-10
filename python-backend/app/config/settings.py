"""
Application settings and configuration.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # API Configuration
    API_V1_PREFIX: str = "/api/ai"
    PROJECT_NAME: str = "LearnMe Python Backend"
    VERSION: str = "0.1.0"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # AI Configuration
    GEMINI_API_KEY: str
    DEFAULT_MODEL: str = "gemini-2.0-flash"
    
    # CORS Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000",
    ]
    
    # Request Configuration
    REQUEST_TIMEOUT: int = 60  # seconds
    MAX_CONTENT_SIZE: int = 10_000_000  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

