"""
Gemini API client setup for OpenAI Agents SDK.
"""
import os
from agents import AsyncOpenAI, set_default_openai_client, set_tracing_disabled, set_default_openai_api
from app.config.settings import settings


def setup_gemini_client() -> AsyncOpenAI:
    """
    Setup Gemini API client for OpenAI Agents SDK.
    
    Returns:
        Configured AsyncOpenAI client for Gemini
    """
    # Disable tracing for production
    set_tracing_disabled(True)
    
    # Set default OpenAI API format (Gemini uses OpenAI-compatible format)
    set_default_openai_api("chat_completions")
    
    # Create Gemini client
    external_client = AsyncOpenAI(
        api_key=settings.GEMINI_API_KEY,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    
    # Set as default client
    set_default_openai_client(external_client)
    
    return external_client


# Global Gemini client instance
gemini_client = setup_gemini_client()

