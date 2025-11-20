"""
Gemini API client setup for OpenAI Agents SDK.

DEPRECATED: This module is kept for backward compatibility but is no longer used.
All AI clients should be created from user-provided API keys via AIClient class.
"""
import os
from agents import AsyncOpenAI, set_default_openai_client, set_tracing_disabled, set_default_openai_api
from app.config.settings import settings
from typing import Optional


def setup_gemini_client(api_key: Optional[str] = None) -> Optional[AsyncOpenAI]:
    """
    Setup Gemini API client for OpenAI Agents SDK.
    
    Args:
        api_key: Optional API key (if not provided, returns None)
    
    Returns:
        Configured AsyncOpenAI client for Gemini, or None if no API key
    """
    # If no API key provided, return None
    if not api_key:
        return None
    
    # Disable tracing for production
    set_tracing_disabled(True)
    
    # Set default OpenAI API format (Gemini uses OpenAI-compatible format)
    set_default_openai_api("chat_completions")
    
    # Create Gemini client
    external_client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    
    # Set as default client
    set_default_openai_client(external_client)
    
    return external_client


# Global Gemini client instance (None by default - must be set from user's API key)
# DEPRECATED: Services should use AIClient from request headers instead
gemini_client: Optional[AsyncOpenAI] = None

