"""
AI Client - Dynamic AI provider configuration using OpenAI-compatible client.
"""
from typing import Optional
from openai import AsyncOpenAI


class AIClient:
    """
    Dynamic AI client that supports multiple providers (Gemini, OpenAI, etc.)
    using OpenAI SDK's flexibility with base_url.
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        model: str = "gpt-4o-mini"
    ):
        """
        Initialize AI client with provider-specific configuration.
        
        Args:
            api_key: API key for the provider
            base_url: Optional base URL (for Gemini or custom endpoints)
            model: Model name to use
        """
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        
        # Create OpenAI client with custom base_url if provided
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
    
    async def create_chat_completion(self, messages: list, **kwargs):
        """
        Create a chat completion.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            **kwargs: Additional arguments to pass to the API
            
        Returns:
            Chat completion response
        """
        return await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **kwargs
        )
    
    @classmethod
    def from_provider(
        cls,
        provider: str,
        api_key: str,
        model: Optional[str] = None
    ) -> 'AIClient':
        """
        Create AI client from provider name with default settings.
        
        Args:
            provider: Provider name ('gemini' or 'openai')
            api_key: API key
            model: Optional model override
            
        Returns:
            Configured AIClient instance
        """
        # Validate that model is provided (no defaults - user must select)
        if not model:
            raise ValueError(
                f"Model name is required. User must select an AI model for provider '{provider}'. "
                f"No default models are used to ensure user's choice is always respected."
            )
        
        if provider == 'gemini':
            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        elif provider == 'openai':
            base_url = None  # Use default OpenAI endpoint
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        return cls(
            api_key=api_key,
            base_url=base_url,
            model=model  # ALWAYS use user-selected model (no defaults)
        )

