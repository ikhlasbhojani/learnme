"""
Quiz API routes.
"""
from fastapi import APIRouter, Header, HTTPException, status
from app.services.quiz import QuizService
from app.models.schemas import (
    GenerateQuizFromUrlRequest,
    GenerateQuizFromDocumentRequest,
    QuizGenerationResponse,
    AnalyzeQuizRequest,
    QuizAnalysisResponse,
    ErrorResponse
)
from app.utils.error_handler import get_error_response, get_http_status_code
from openai import RateLimitError, APIError, APIConnectionError, APITimeoutError
from typing import Optional
import traceback
import logging
from app.config.settings import settings

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["Quiz"])

# Initialize service
quiz_service = QuizService()


@router.post("/generate-from-url")
async def generate_quiz_from_url(
    request: GenerateQuizFromUrlRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Generate quiz from selected topics or single URL.
    
    This API:
    1. Extracts content from selected URLs
    2. Combines content
    3. Generates quiz questions using AI
    4. Returns quiz with questions
    """
    try:
        # Validate request
        if not request.url and not request.selectedTopics:
            raise ValueError("Either url or selectedTopics must be provided")
        
        if request.selectedTopics:
            # Validate that all topics have URLs
            for topic in request.selectedTopics:
                if not topic.url:
                    raise ValueError(f"Topic '{topic.id}' is missing URL field")
        
        logger.info(f"Generating quiz from URL - User: {x_user_id}, Topics: {len(request.selectedTopics) if request.selectedTopics else 0}, URL: {request.url}")
        
        # Generate quiz
        result = await quiz_service.generate_quiz_from_url(request)
        
        logger.info(f"Quiz generated successfully - Questions: {len(result.questions)}")
        
        return {"success": True, "data": result.model_dump()}
        
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        error_response = get_error_response(e, "Invalid input", settings.DEBUG)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
        # Handle AI service errors specifically
        error_trace = traceback.format_exc()
        logger.error(f"AI service error during quiz generation: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to generate quiz", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Quiz generation failed: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to generate quiz", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )


@router.post("/generate-from-document")
async def generate_quiz_from_document(
    request: GenerateQuizFromDocumentRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Generate quiz from document text.
    
    This API:
    1. Takes document text directly
    2. Generates quiz questions using AI
    3. Returns quiz with questions
    """
    try:
        # Generate quiz
        result = await quiz_service.generate_quiz_from_document(request)
        
        return {"success": True, "data": result.model_dump()}
        
    except ValueError as e:
        error_response = get_error_response(e, "Invalid input", settings.DEBUG)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
        error_trace = traceback.format_exc()
        logger.error(f"AI service error during quiz generation: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to generate quiz", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Quiz generation failed: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to generate quiz", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )


@router.post("/analyze")
async def analyze_quiz(
    request: AnalyzeQuizRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Analyze completed quiz and generate feedback.
    
    This API:
    1. Calculates quiz score
    2. Analyzes performance using AI
    3. Generates detailed feedback
    4. Returns analysis with suggestions
    """
    try:
        # Validate request
        if not request.quiz.questions:
            raise ValueError("Questions array cannot be empty")
        
        if not request.answers:
            raise ValueError("Answers object cannot be empty")
        
        # Convert quiz to dict format
        quiz_dict = {
            "id": request.quiz.id,
            "questions": [q.model_dump() for q in request.quiz.questions],
            "configuration": request.quiz.configuration.model_dump()
        }
        
        # Analyze quiz
        result = await quiz_service.analyze_quiz(
            quiz=quiz_dict,
            answers=request.answers,
            original_content=request.originalContent
        )
        
        return {"success": True, "data": result.model_dump()}
        
    except ValueError as e:
        error_response = get_error_response(e, "Invalid quiz data", settings.DEBUG)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
        error_trace = traceback.format_exc()
        logger.error(f"AI service error during quiz analysis: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to generate quiz analysis", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Quiz analysis failed: {str(e)}\n{error_trace}")
        error_response = get_error_response(e, "Failed to generate quiz analysis", settings.DEBUG)
        http_status = get_http_status_code(e)
        raise HTTPException(
            status_code=http_status,
            detail=error_response
        )

