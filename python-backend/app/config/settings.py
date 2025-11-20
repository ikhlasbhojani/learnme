"""
Application settings and configuration.
"""


class Settings:
    """Application settings."""
    # API Configuration
    API_V1_PREFIX = "/api/ai"
    PROJECT_NAME = "LearnMe Python Backend"
    VERSION = "0.1.0"
    
    # Server Configuration
    HOST = "0.0.0.0"
    PORT = 8000
    DEBUG = False
    
    # AI Configuration (handled via user-provided API keys from frontend)
    # No default API key or model - users must provide their own
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000",
    ]
    
    # Request Configuration
    REQUEST_TIMEOUT = 60  # seconds
    MAX_CONTENT_SIZE = 10_000_000  # 10MB


# Global settings instance
settings = Settings()

