"""
AI Configuration Middleware - Extract user's AI config from request headers.
"""
from fastapi import Request, HTTPException, status
from typing import Optional


class AIConfigHeaders:
    """AI configuration extracted from request headers."""
    
    def __init__(
        self,
        provider: str = "gemini",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
    
    @property
    def has_api_key(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)


def get_ai_config_from_headers(request: Request) -> AIConfigHeaders:
    """
    Extract AI configuration from request headers.
    
    Headers expected:
    - X-AI-Provider: gemini | openai
    - X-AI-API-Key: <api_key>
    - X-AI-Model: <model_name> (optional)
    - X-AI-Base-URL: <base_url> (optional)
    
    Args:
        request: FastAPI request object
        
    Returns:
        AIConfigHeaders with extracted configuration
        
    Raises:
        HTTPException: If API key is missing
    """
    provider = request.headers.get("X-AI-Provider", "gemini").lower()
    api_key = request.headers.get("X-AI-API-Key")
    model = request.headers.get("X-AI-Model")
    base_url = request.headers.get("X-AI-Base-URL")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "MISSING_API_KEY",
                    "message": "API key is required",
                    "details": "Please configure your AI provider API key in settings"
                }
            }
        )
    
    if provider not in ["gemini", "openai"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_PROVIDER",
                    "message": "Invalid AI provider",
                    "details": f"Provider must be 'gemini' or 'openai', got '{provider}'"
                }
            }
        )
    
    return AIConfigHeaders(
        provider=provider,
        api_key=api_key,
        model=model,
        base_url=base_url
    )

