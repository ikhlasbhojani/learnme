"""
Error handling utilities for API responses.
"""
from typing import Dict, Any, Optional
from openai import RateLimitError, APIError, APIConnectionError, APITimeoutError
import logging

logger = logging.getLogger(__name__)


def get_error_response(
    error: Exception,
    default_message: str = "An error occurred",
    debug: bool = False
) -> Dict[str, Any]:
    """
    Convert an exception to a user-friendly error response.
    
    Args:
        error: The exception that occurred
        default_message: Default error message if error type is unknown
        debug: Whether to include detailed error information
        
    Returns:
        Dictionary with error response structure
    """
    error_type = type(error).__name__
    error_message = str(error)
    
    # Handle specific error types
    if isinstance(error, RateLimitError):
        return {
            "success": False,
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "API rate limit exceeded. Please wait a moment and try again.",
                "details": "The AI service is currently busy. Please try again in a few seconds." if not debug else error_message,
                "retryAfter": 60  # Suggest retry after 60 seconds
            }
        }
    
    elif isinstance(error, APIConnectionError):
        return {
            "success": False,
            "error": {
                "code": "CONNECTION_ERROR",
                "message": "Unable to connect to AI service",
                "details": "Please check your internet connection and try again." if not debug else error_message
            }
        }
    
    elif isinstance(error, APITimeoutError):
        return {
            "success": False,
            "error": {
                "code": "TIMEOUT_ERROR",
                "message": "Request timed out",
                "details": "The request took too long to process. Please try again with fewer topics or shorter content." if not debug else error_message
            }
        }
    
    elif isinstance(error, APIError):
        # Generic API error
        status_code = getattr(error, 'status_code', None)
        if status_code == 429:
            return {
                "success": False,
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "API rate limit exceeded. Please wait a moment and try again.",
                    "details": "The AI service is currently busy. Please try again in a few seconds." if not debug else error_message,
                    "retryAfter": 60
                }
            }
        elif status_code == 401:
            return {
                "success": False,
                "error": {
                    "code": "AUTHENTICATION_ERROR",
                    "message": "Authentication failed",
                    "details": "Invalid API key. Please check your configuration." if not debug else error_message
                }
            }
        elif status_code == 400:
            return {
                "success": False,
                "error": {
                    "code": "INVALID_REQUEST",
                    "message": "Invalid request to AI service",
                    "details": "The request format is incorrect. Please try again." if not debug else error_message
                }
            }
        else:
            return {
                "success": False,
                "error": {
                    "code": "AI_SERVICE_ERROR",
                    "message": "AI service error",
                    "details": "The AI service encountered an error. Please try again later." if not debug else error_message
                }
            }
    
    elif isinstance(error, ValueError):
        return {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input",
                "details": error_message
            }
        }
    
    elif isinstance(error, TimeoutError):
        return {
            "success": False,
            "error": {
                "code": "TIMEOUT_ERROR",
                "message": "Request timed out",
                "details": "The operation took too long. Please try again with less content." if not debug else error_message
            }
        }
    
    else:
        # Generic error
        logger.error(f"Unhandled error type: {error_type}, Message: {error_message}")
        return {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": default_message,
                "details": error_message if debug else "An unexpected error occurred. Please try again later."
            }
        }


def get_http_status_code(error: Exception) -> int:
    """
    Get appropriate HTTP status code for an error.
    
    Args:
        error: The exception
        
    Returns:
        HTTP status code
    """
    if isinstance(error, RateLimitError):
        return 429
    elif isinstance(error, (APIConnectionError, APITimeoutError)):
        return 503
    elif isinstance(error, APIError):
        status_code = getattr(error, 'status_code', None)
        if status_code:
            return status_code
        return 500
    elif isinstance(error, ValueError):
        return 400
    else:
        return 500

