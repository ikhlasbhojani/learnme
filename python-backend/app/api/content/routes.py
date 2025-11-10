"""
Content API routes.
"""
from fastapi import APIRouter, Header, HTTPException, status
from app.services.content import ContentService
from app.models.schemas import (
    ExtractTopicsRequest,
    ExtractTopicsResponse,
    ExtractContentRequest,
    ExtractContentResponse,
    ErrorResponse
)
from app.utils.error_handler import get_error_response, get_http_status_code
from openai import RateLimitError, APIError, APIConnectionError, APITimeoutError
from typing import Any
from typing import Optional
import traceback
import logging
from app.config.settings import settings

# Setup logging
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/content", tags=["Content"])

# Initialize service
content_service = ContentService()


@router.post("/extract-topics")
async def extract_topics(
    request: ExtractTopicsRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Extract topics from documentation URL.
    
    This API:
    1. Fetches HTML from URL
    2. Extracts all links
    3. Uses AI to organize into topics
    4. Returns organized topics with URLs
    """
    try:
        # Use X-User-Id from header or request body
        user_id = x_user_id or request.userId
        
        # Extract topics
        result = await content_service.extract_topics(
            url=str(request.url),
            user_id=user_id
        )
        
        return {"success": True, "data": result.model_dump()}
        
    except ValueError as e:
        error_response = get_error_response(e, "Invalid URL format", settings.DEBUG)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
        error_trace = traceback.format_exc()
        logger.error(f"AI service error during topic extraction: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to extract topics", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Topic extraction failed: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to extract topics", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )


@router.post("/extract")
async def extract_content(
    request: ExtractContentRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Extract content from a single URL.
    
    This API:
    1. Fetches HTML from URL
    2. Extracts and cleans content
    3. Uses AI to summarize
    4. Returns cleaned content
    """
    try:
        # Extract content
        result = await content_service.extract_content(str(request.url))
        
        return {"success": True, "data": result.model_dump()}
        
    except ValueError as e:
        error_response = get_error_response(e, "Invalid URL format", settings.DEBUG)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
        error_trace = traceback.format_exc()
        logger.error(f"AI service error during content extraction: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to extract content", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Content extraction failed: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to extract content", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )

