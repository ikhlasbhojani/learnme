from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.modules.quiz_analysis.service import analyze_quiz

router = APIRouter()


class AnalyzeQuizRequest(BaseModel):
    userId: str
    quiz: Dict[str, Any]
    answers: Dict[str, str]
    originalContent: Optional[str] = None


@router.post("/")
async def analyze(request: AnalyzeQuizRequest):
    """Analyze quiz performance"""
    try:
        result = await analyze_quiz(
            user_id=request.userId,
            quiz=request.quiz,
            answers=request.answers,
            original_content=request.originalContent
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz analysis failed: {str(e)}")

