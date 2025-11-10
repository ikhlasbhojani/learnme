"""
Content Service - Handles content extraction and topic organization.
"""
from app.services.ai.agents.topic_organization import TopicOrganizationAgent
from app.services.ai.agents.content_extraction import ContentExtractionAgent
from app.core.gemini_client import gemini_client
from app.models.schemas import ExtractTopicsResponse, ExtractContentResponse
from typing import List


class ContentService:
    """Service for content-related operations."""
    
    def __init__(self):
        self.topic_agent = TopicOrganizationAgent(gemini_client)
        self.content_agent = ContentExtractionAgent(gemini_client)
    
    async def extract_topics(
        self,
        url: str,
        user_id: str
    ) -> ExtractTopicsResponse:
        """
        Extract and organize topics from documentation URL.
        
        Args:
            url: Documentation URL
            user_id: User ID for tracking
            
        Returns:
            ExtractTopicsResponse with organized topics
        """
        # Try to use Topic Organization Agent first
        try:
            result = await self.topic_agent.organize_topics(url, user_id)
        except Exception as e:
            # If agent fails, use tool directly
            result = None
        
        # If agent returned fewer topics than expected OR failed, use tool output directly
        # Tool typically extracts 80-100 topics, agent might filter them
        if result is None or (result and result.totalPages < 50):
            # Use tool directly to get all topics
            from app.services.ai.tools.url_extraction import _extract_urls_from_html, _organize_urls_to_topics
            
            # Extract URLs directly with titles
            urls_with_titles = await _extract_urls_from_html(url, None)
            tool_topics = _organize_urls_to_topics(urls_with_titles, url)
            
            # Use tool output if agent failed or has fewer topics
            if result is None or len(tool_topics) > len(result.topics):
                topics_dicts = [
                    {
                        "id": topic.id,
                        "title": topic.title,
                        "url": topic.url,
                        "description": topic.description,
                        "section": topic.section
                    }
                    for topic in tool_topics
                ]
                
                return ExtractTopicsResponse(
                    topics=topics_dicts,
                    mainUrl=url,
                    totalPages=len(tool_topics)
                )
        
        # Convert Topic objects to dicts for Pydantic
        topics_dicts = [
            {
                "id": topic.id,
                "title": topic.title,
                "url": topic.url,
                "description": topic.description,
                "section": topic.section
            }
            for topic in result.topics
        ]
        
        # Convert to response format
        return ExtractTopicsResponse(
            topics=topics_dicts,
            mainUrl=result.mainUrl,
            totalPages=result.totalPages
        )
    
    async def extract_content(
        self,
        url: str
    ) -> ExtractContentResponse:
        """
        Extract content from a single URL.
        
        Args:
            url: URL to extract content from
            
        Returns:
            ExtractContentResponse with extracted content
        """
        # Use Content Extraction Agent
        result = await self.content_agent.extract_content_from_single_url(url)
        
        # Convert to response format
        return ExtractContentResponse(
            content=result.content,
            pageTitle=result.pageTitle,
            source=result.source,
            extractedAt=result.extractedAt
        )
    
    async def extract_content_from_urls(
        self,
        urls: List[str]
    ) -> str:
        """
        Extract and combine content from multiple URLs.
        
        Args:
            urls: List of URLs to extract content from
            
        Returns:
            Combined, cleaned content text
        """
        return await self.content_agent.extract_content_from_urls(urls)

