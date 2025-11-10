"""
Quiz Service - Handles quiz generation and analysis.
"""
from app.services.ai.agents.quiz_generation import QuizGenerationAgent
from app.services.ai.agents.quiz_analysis import QuizAnalysisAgent
from app.services.content.content_service import ContentService
from app.core.gemini_client import gemini_client
from app.models.schemas import (
    GenerateQuizFromUrlRequest,
    GenerateQuizFromDocumentRequest,
    QuizGenerationResponse,
    QuizAnalysisResponse,
    SelectedTopic
)
from typing import Dict, Optional


class QuizService:
    """Service for quiz-related operations."""
    
    def __init__(self):
        self.quiz_agent = QuizGenerationAgent(gemini_client)
        self.analysis_agent = QuizAnalysisAgent(gemini_client)
        self.content_service = ContentService()
    
    async def generate_quiz_from_url(
        self,
        request: GenerateQuizFromUrlRequest
    ) -> QuizGenerationResponse:
        """
        Generate quiz from selected topics or single URL.
        
        Args:
            request: GenerateQuizFromUrlRequest with selectedTopics or url
            
        Returns:
            QuizGenerationResponse with generated questions
        """
        # Determine source URLs
        urls = []
        source_url = "unknown"
        
        if request.selectedTopics:
            # Extract URLs from selected topics
            urls = [topic.url for topic in request.selectedTopics]
            source_url = request.selectedTopics[0].url if request.selectedTopics else "unknown"
        elif request.url:
            urls = [str(request.url)]
            source_url = str(request.url)
        else:
            raise ValueError("Either url or selectedTopics must be provided")
        
        # Extract content from URLs
        content = await self.content_service.extract_content_from_urls(urls)
        
        # Generate quiz from content
        result = await self.quiz_agent.generate_quiz(
            content=content,
            difficulty=request.difficulty,
            number_of_questions=request.numberOfQuestions,
            source_url=source_url
        )
        
        # Convert agent output to dictionaries, then to response format
        # Agent returns QuizGenerationOutput with Question/QuizMetadata instances
        # We need to convert them to dicts for QuizGenerationResponse
        questions_dicts = [q.model_dump() for q in result.questions]
        metadata_dict = result.metadata.model_dump()
        
        return QuizGenerationResponse(
            questions=questions_dicts,
            quizName=result.quizName,
            metadata=metadata_dict
        )
    
    async def generate_quiz_from_document(
        self,
        request: GenerateQuizFromDocumentRequest
    ) -> QuizGenerationResponse:
        """
        Generate quiz from document text.
        
        Args:
            request: GenerateQuizFromDocumentRequest with document text
            
        Returns:
            QuizGenerationResponse with generated questions
        """
        # Generate quiz directly from document
        result = await self.quiz_agent.generate_quiz(
            content=request.document,
            difficulty=request.difficulty,
            number_of_questions=request.numberOfQuestions,
            source_url="document"
        )
        
        # Convert agent output to dictionaries, then to response format
        # Agent returns QuizGenerationOutput with Question/QuizMetadata instances
        # We need to convert them to dicts for QuizGenerationResponse
        questions_dicts = [q.model_dump() for q in result.questions]
        metadata_dict = result.metadata.model_dump()
        
        return QuizGenerationResponse(
            questions=questions_dicts,
            quizName=result.quizName,
            metadata=metadata_dict
        )
    
    async def analyze_quiz(
        self,
        quiz: Dict,
        answers: Dict[str, str],
        original_content: Optional[str] = None
    ) -> QuizAnalysisResponse:
        """
        Analyze completed quiz and generate feedback.
        
        Args:
            quiz: Quiz object with questions and configuration
            answers: User's answers (questionId: answer mapping)
            original_content: Original content text (optional)
            
        Returns:
            QuizAnalysisResponse with analysis
        """
        # Use Quiz Analysis Agent
        result = await self.analysis_agent.analyze_quiz(
            quiz=quiz,
            answers=answers,
            original_content=original_content
        )
        
        # Convert to response format
        return QuizAnalysisResponse(
            performanceReview=result.performanceReview,
            weakAreas=result.weakAreas,
            suggestions=result.suggestions,
            strengths=result.strengths,
            improvementAreas=result.improvementAreas,
            detailedAnalysis=result.detailedAnalysis,
            topicsToReview=result.topicsToReview
        )

