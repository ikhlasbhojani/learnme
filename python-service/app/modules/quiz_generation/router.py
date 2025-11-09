from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.modules.quiz_generation.service import (
    generate_quiz_from_url,
    generate_quiz_from_document
)

router = APIRouter()


class GenerateQuizFromUrlRequest(BaseModel):
    userId: str
    url: Optional[str] = None
    urls: Optional[List[str]] = None
    difficulty: str = "medium"
    numberOfQuestions: int = 10
    timeDuration: int = 3600


class GenerateQuizFromDocumentRequest(BaseModel):
    userId: str
    document: str
    difficulty: str = "medium"
    numberOfQuestions: int = 10
    timeDuration: int = 3600


@router.post("/from-url")
async def generate_from_url(request: GenerateQuizFromUrlRequest):
    """Generate quiz from URL(s)"""
    try:
        result = await generate_quiz_from_url(
            user_id=request.userId,
            url=request.url,
            urls=request.urls,
            difficulty=request.difficulty,
            number_of_questions=request.numberOfQuestions,
            time_duration=request.timeDuration
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


@router.post("/from-document")
async def generate_from_document(request: GenerateQuizFromDocumentRequest):
    """Generate quiz from document"""
    try:
        result = await generate_quiz_from_document(
            user_id=request.userId,
            document=request.document,
            difficulty=request.difficulty,
            number_of_questions=request.numberOfQuestions,
            time_duration=request.timeDuration
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

