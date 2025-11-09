"""
Book Router - Endpoints for book structure and content
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.book_service import get_book_service

router = APIRouter()


@router.get("/structure")
async def get_book_structure():
    """
    Get the complete book structure (parts, chapters, lessons)
    
    Returns hierarchical JSON structure of the book
    """
    try:
        book_service = get_book_service()
        structure = book_service.get_book_structure()
        return {
            "message": "Book structure retrieved successfully",
            "data": structure
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get book structure: {str(e)}")


@router.get("/content/lesson")
async def get_lesson_content(
    part: str = Query(..., description="Part path, e.g., '01-Introducing-AI-Driven-Development'"),
    chapter: str = Query(..., description="Chapter path, e.g., '01-ai-development-revolution'"),
    lesson: str = Query(..., description="Lesson filename, e.g., '01-moment_that_changed_everything.md'")
):
    """
    Get content of a specific lesson
    
    Args:
        part: Part directory name
        chapter: Chapter directory name
        lesson: Lesson filename
    
    Returns:
        Lesson content and metadata
    """
    try:
        book_service = get_book_service()
        result = book_service.get_lesson_content(part, chapter, lesson)
        return {
            "message": "Lesson content retrieved successfully",
            "data": result
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get lesson content: {str(e)}")


@router.get("/content/chapter")
async def get_chapter_content(
    part: str = Query(..., description="Part path, e.g., '01-Introducing-AI-Driven-Development'"),
    chapter: str = Query(..., description="Chapter path, e.g., '01-ai-development-revolution'")
):
    """
    Get all lessons in a chapter as combined content
    
    Args:
        part: Part directory name
        chapter: Chapter directory name
    
    Returns:
        Combined chapter content and lesson list
    """
    try:
        book_service = get_book_service()
        result = book_service.get_chapter_content(part, chapter)
        return {
            "message": "Chapter content retrieved successfully",
            "data": result
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chapter content: {str(e)}")

