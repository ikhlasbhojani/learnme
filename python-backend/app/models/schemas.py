"""
Pydantic models for API requests and responses.
"""
from pydantic import BaseModel, Field, HttpUrl, model_validator
from typing import List, Optional, Dict, Union, Any
from datetime import datetime


# ============================================
# Topic Extraction Models
# ============================================

class Topic(BaseModel):
    """Topic model."""
    id: str
    title: str
    url: str = Field(..., description="MANDATORY - Quiz generation ke liye zaroori")
    description: Optional[str] = None
    section: Optional[str] = None


class ExtractTopicsRequest(BaseModel):
    """Request model for topic extraction."""
    url: HttpUrl = Field(..., description="Documentation URL")
    userId: str = Field(..., description="User ID for tracking")


class ExtractTopicsResponse(BaseModel):
    """Response model for topic extraction."""
    topics: List[Topic]
    mainUrl: str
    totalPages: int


# ============================================
# Content Extraction Models
# ============================================

class ExtractContentRequest(BaseModel):
    """Request model for content extraction."""
    url: HttpUrl = Field(..., description="URL to extract content from")
    userId: str = Field(..., description="User ID for tracking")


class ExtractContentResponse(BaseModel):
    """Response model for content extraction."""
    content: str = Field(..., description="Extracted and cleaned content text")
    pageTitle: Optional[str] = None
    source: str
    extractedAt: str = Field(..., description="ISO 8601 timestamp")


# ============================================
# Quiz Generation Models
# ============================================

class SelectedTopic(BaseModel):
    """Selected topic model."""
    id: str
    title: str
    url: str = Field(..., description="MANDATORY - Content fetch ke liye")
    description: Optional[str] = None
    section: Optional[str] = None


class Question(BaseModel):
    """Quiz question model."""
    id: str
    text: str
    options: List[str] = Field(..., min_length=4, max_length=4, description="Exactly 4 options")
    correctAnswer: str
    difficulty: str = Field(..., pattern="^(Easy|Normal|Hard|Master)$")
    explanation: Optional[str] = None
    codeSnippet: Optional[str] = None
    imageReference: Optional[str] = None


class QuizMetadata(BaseModel):
    """Quiz metadata model."""
    source: str
    difficulty: str
    requestedQuestions: int
    generatedQuestions: int
    extractedAt: str = Field(..., description="ISO 8601 timestamp")
    generatedAt: str = Field(..., description="ISO 8601 timestamp")


class GenerateQuizFromUrlRequest(BaseModel):
    """Request model for quiz generation from URL."""
    url: Optional[HttpUrl] = Field(None, description="Single URL (if selectedTopics not provided)")
    selectedTopics: Optional[List[SelectedTopic]] = Field(None, description="Selected topics with URLs")
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    numberOfQuestions: int = Field(..., ge=1, le=100)
    userId: str = Field(..., description="User ID for tracking")
    
    @model_validator(mode='after')
    def validate_url_or_topics(self):
        """Validate that either url or selectedTopics is provided."""
        if not self.url and not self.selectedTopics:
            raise ValueError("Either url or selectedTopics must be provided")
        return self


class GenerateQuizFromDocumentRequest(BaseModel):
    """Request model for quiz generation from document."""
    document: str = Field(..., min_length=100, description="Document text content (minimum 100 characters)")
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    numberOfQuestions: int = Field(..., ge=1, le=100)
    userId: str = Field(..., description="User ID for tracking")


class QuizGenerationResponse(BaseModel):
    """Response model for quiz generation."""
    questions: List[Question]
    quizName: str
    metadata: QuizMetadata


# ============================================
# Quiz Analysis Models
# ============================================

class QuizConfiguration(BaseModel):
    """Quiz configuration model."""
    difficulty: str = Field(..., pattern="^(Easy|Normal|Hard|Master)$")
    numberOfQuestions: int
    timeDuration: int


class QuizQuestionForAnalysis(BaseModel):
    """Quiz question for analysis."""
    id: str
    text: str
    options: List[str]
    correctAnswer: str
    difficulty: str
    explanation: Optional[str] = None


class QuizForAnalysis(BaseModel):
    """Quiz object for analysis."""
    id: str
    questions: List[QuizQuestionForAnalysis]
    configuration: QuizConfiguration


class AnalyzeQuizRequest(BaseModel):
    """Request model for quiz analysis."""
    quiz: QuizForAnalysis
    answers: Dict[str, str] = Field(..., description="User's answers (questionId: answer mapping)")
    originalContent: Optional[str] = None
    userId: str = Field(..., description="User ID for tracking")


class QuizAnalysisResponse(BaseModel):
    """Response model for quiz analysis."""
    performanceReview: str = Field(..., description="Overall summary (2-3 sentences)")
    weakAreas: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    suggestions: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    strengths: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    improvementAreas: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    detailedAnalysis: str = Field(..., description="Comprehensive paragraph (4-6 sentences)")
    topicsToReview: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items, prioritized")


# ============================================
# Common Response Models
# ============================================

class SuccessResponse(BaseModel):
    """Standard success response."""
    success: bool = True
    data: Union[BaseModel, Dict[str, Any], List[Any], str, int, float, bool]


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: Dict[str, str] = Field(..., description="Error details with code, message, details")

