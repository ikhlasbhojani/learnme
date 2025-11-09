from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables FIRST before creating Settings
load_dotenv()


class Settings(BaseSettings):
    # Server
    port: int = 8000
    cors_origin: str = "http://localhost:5173"
    
    # Database
    mongodb_uri: str = "mongodb://127.0.0.1:27017/learnme"
    
    # JWT (must match TypeScript backend)
    jwt_secret: str = ""
    
    # AI Provider - reads from .env file
    ai_provider: str = "openai"
    ai_model: str = "gpt-4o-mini"
    
    # OpenAI API Key - can be set via AI_API_KEY or OPENAI_API_KEY in .env
    # The SDK requires OPENAI_API_KEY environment variable
    ai_api_key: str = Field(default="", description="OpenAI API key (can also use OPENAI_API_KEY)")
    ai_base_url: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @model_validator(mode="after")
    def ensure_openai_api_key(self):
        """Ensure OPENAI_API_KEY environment variable is set for the Agents SDK"""
        # Priority: 1. OPENAI_API_KEY from environment, 2. ai_api_key from settings
        api_key = os.getenv("OPENAI_API_KEY") or self.ai_api_key
        
        if api_key:
            # Set both for consistency and ensure SDK can access it
            self.ai_api_key = api_key
            os.environ["OPENAI_API_KEY"] = api_key
        
        return self


# Create settings instance - this will load from .env and set OPENAI_API_KEY
settings = Settings()

# Final safety check: if OPENAI_API_KEY exists in env but wasn't captured, use it
if not settings.ai_api_key and os.getenv("OPENAI_API_KEY"):
    settings.ai_api_key = os.getenv("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = settings.ai_api_key
