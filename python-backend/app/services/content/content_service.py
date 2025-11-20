"""
Content Service - Handles content extraction and topic organization.
"""
from app.models.schemas import ExtractTopicsResponse, ExtractContentResponse
from typing import List, Optional
from agents import AsyncOpenAI


class ContentService:
    """Service for content-related operations."""
    
    def __init__(self, ai_client: Optional[AsyncOpenAI] = None):
        """
        Initialize content service.
        
        Args:
            ai_client: Optional AI client for content extraction (provided per-request with user's API key)
        """
        # AI client is set per-request with user's API key
        self._ai_client = ai_client
        self._content_agent = None
    
    def set_ai_client(self, ai_client: AsyncOpenAI, model: str):
        """
        Set AI client for this request (with user's API key and model).
        
        Args:
            ai_client: OpenAI-compatible client (AsyncOpenAI)
            model: User-selected model name (REQUIRED - no defaults)
        """
        from app.services.ai.agents.content_extraction import ContentExtractionAgent
        self._ai_client = ai_client
        self._content_agent = ContentExtractionAgent(ai_client, model)
    
    @property
    def content_agent(self):
        """Get content agent (must be set via set_ai_client first)."""
        if self._content_agent is None:
            raise RuntimeError("AI client not configured. Call set_ai_client() first with user's API key.")
        return self._content_agent
    
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
        # DISABLED: AI agent generates fake topics
        # Skip agent completely and use only real extraction
        # try:
        #     result = await self.topic_agent.organize_topics(url, user_id)
        # except Exception as e:
        #     result = None
        
        result = None  # Force real extraction (no AI-generated topics)
        
        # Always use direct extraction to get real URLs from documentation
        if True:  # Always extract (was: result is None or result.totalPages < 50)
            # Import the extraction logic directly (bypass tool wrapper)
            from app.services.ai.tools.url_extraction import (
                URLExtractionContext,
                URLExtractionResult,
                _extract_urls_recursively_bfs,
                _organize_urls_to_topics_with_depth
            )
            import json
            
            try:
                # Create extraction context optimized for speed with validation
                context = URLExtractionContext(
                    userId=user_id,
                    mainUrl=url,
                    extraction_mode="http",  # Force HTTP mode
                    strict_mode=True,  # Validate URLs exist (HTTP HEAD requests)
                    max_depth=0,  # Only extract from main page (don't follow links)
                    max_urls_per_level=1000,  # Allow many URLs from main page
                    timeout=30  # Timeout for validation requests
                )
                
                # BROWSER MODE DISABLED: Not working reliably on Windows
                # Always use HTTP-based extraction (fast and reliable)
                print("🔗 Using HTTP-based extraction (browser mode disabled)...")
                
                # HTTP-based extraction
                extraction_payload = await _extract_urls_recursively_bfs(url, context)
                
                topics_payload = _organize_urls_to_topics_with_depth(
                    extraction_payload["records"],
                    url,
                    strict_mode=context.strict_mode,
                    skipped=extraction_payload["skipped"],
                    unverified=extraction_payload["unverified"],
                    metadata=extraction_payload["metadata"]
                )
                
                # Convert to Topic objects
                from app.services.ai.tools.url_extraction import Topic
                tool_topics = topics_payload["topics"]
                
            except Exception as e:
                # If extraction fails, raise with context
                raise Exception(
                    f"Failed to extract topics from URL: {url}\n"
                    f"Error: {str(e)}\n"
                    f"Please verify:\n"
                    f"  - The URL is correct and accessible\n"
                    f"  - You have internet connectivity\n"
                    f"  - The site is not behind authentication"
                )
            
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

