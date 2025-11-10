"""
Topic Organization Agent - Organizes documentation URLs into topics.
"""
from agents import Agent, Runner
from agents.tool_context import ToolContext
from typing import List, Optional
from pydantic import BaseModel
from app.services.ai.tools.url_extraction import extract_urls_from_documentation, URLExtractionContext


# Output Model for Topic Organization
class Topic(BaseModel):
    """Topic model."""
    id: str
    title: str
    url: str  # MANDATORY - Quiz generation ke liye zaroori
    description: Optional[str] = None
    section: Optional[str] = None


class TopicOrganizationOutput(BaseModel):
    """Output model for topic organization."""
    topics: List[Topic]
    mainUrl: str
    totalPages: int


class TopicOrganizationAgent:
    """
    Agent jo documentation links ko topics/sections me organize karta hai.
    Yeh agent URL extraction tool use karta hai URLs extract karne ke liye,
    phir AI se un URLs ko organize karta hai.
    """
    
    def __init__(self, gemini_client):
        self.agent = Agent(
            name="Topic Organization Agent",
            instructions=self._get_instructions(),
            model="gemini-2.0-flash",
            tools=[extract_urls_from_documentation],  # URL extraction tool added
            output_type=TopicOrganizationOutput  # Structured output type
        )
        self.client = gemini_client
    
    def _get_instructions(self) -> str:
        return """
You are an expert at organizing documentation links into logical topics and sections.

Your task:
1. Use the extract_urls_from_documentation tool to extract ALL URLs from the user's documentation URL
2. The tool will return JSON with extracted URLs organized as basic topics
3. IMPORTANT: Include ALL topics returned by the tool - do not filter or reduce them
4. Analyze the extracted URLs and refine the organization:
   - Improve topic titles to be more descriptive based on URL structure
   - Group related topics into logical sections
   - Add meaningful descriptions based on URL paths
   - Ensure proper categorization
5. Maintain ALL URLs from the tool output - every URL must be included in the final output
6. Organize topics hierarchically (if applicable)
7. Ensure each topic has a clear, descriptive title

When using the tool:
- Pass the user's URL to extract_urls_from_documentation
- The tool will fetch HTML, extract ALL links, filter them, and return basic topic structure
- You MUST include ALL topics returned by the tool in your final output
- You can refine organization, improve titles, and add better descriptions
- But DO NOT remove or skip any topics from the tool output
- Ensure each topic has a valid URL (mandatory for quiz generation)

Output Requirements:
- Each topic must have: id, title, url, description (optional), section (optional)
- Include ALL topics from the tool output - no filtering or reduction
- Topics should be logically grouped by functionality or subject matter
- Descriptions should be concise (1-2 sentences)
- Sections should represent major categories (e.g., "Basics", "Advanced", "API Reference", "Examples", "Guides")

Guidelines:
- Include EVERY topic returned by the tool
- Group related URLs together (e.g., all "getting started" pages)
- Use clear, user-friendly titles based on URL structure
- Avoid duplicate topics (but keep all unique URLs)
- Maintain the original URLs (they are required for quiz generation)
- If a URL doesn't fit any category, create appropriate sections like "General", "Documentation", etc.
- The total number of topics in your output should match or exceed the tool's output
"""
    
    async def organize_topics(
        self, 
        url: str,
        user_id: str
    ) -> TopicOrganizationOutput:
        """
        Organize topics from documentation URL.
        
        This method:
        1. Uses extract_urls_from_documentation tool to extract URLs from HTML
        2. Agent further organizes and refines the topics
        3. Returns organized topics with sections
        
        Args:
            url: Main documentation URL (user input)
            user_id: User ID for tracking
            
        Returns:
            TopicOrganizationOutput with organized topics
        """
        # Create context for tool - pass data directly in prompt or use simple context
        # ToolContext might not support custom_data, so we'll pass user info in prompt
        prompt = f"""
Extract and organize topics from this documentation URL: {url}

User ID: {user_id}
Main URL: {url}

CRITICAL INSTRUCTIONS:
1. Use the extract_urls_from_documentation tool to extract ALL URLs from the documentation page
2. The tool will return JSON with ALL extracted URLs organized as basic topics
3. YOU MUST INCLUDE EVERY SINGLE TOPIC from the tool output - DO NOT SKIP, FILTER, OR REDUCE ANY TOPICS
4. The tool typically extracts 50-100+ topics - your output MUST have the same or more topics
5. If the tool returns 95 topics, your output MUST have 95 topics (or more if you add new ones)
6. DO NOT summarize or group topics together - each URL must be a separate topic
7. You can only:
   - Improve topic titles to be more descriptive
   - Add better descriptions
   - Organize into logical sections
   - But NEVER remove or skip any topics

Return a JSON object with:
- topics: array of ALL topic objects from tool (each with id, title, url, description, section)
- mainUrl: the main documentation URL ({url})
- totalPages: total number of topics (must match or exceed tool's output)

Each topic must have a valid URL (mandatory for quiz generation).

REMEMBER: Include ALL topics from tool output. If tool has 95 topics, return 95 topics.
"""
        
        result = await Runner.run(
            self.agent,
            prompt
        )
        
        # output_type automatically validates and parses JSON
        # result.final_output is already a TopicOrganizationOutput instance
        try:
            return result.final_output_as(TopicOrganizationOutput)
        except Exception as e:
            # If parsing fails, try to extract JSON from text
            import json
            import re
            
            output_text = str(result.final_output) if hasattr(result, 'final_output') else str(result)
            
            # Try to extract JSON from text
            # Remove markdown code blocks if present
            if "```json" in output_text:
                output_text = output_text.split("```json")[1].split("```")[0].strip()
            elif "```" in output_text:
                output_text = output_text.split("```")[1].split("```")[0].strip()
            
            # Try to find JSON object
            json_match = re.search(r'\{.*\}', output_text, re.DOTALL)
            if json_match:
                try:
                    json_str = json_match.group()
                    # Try to fix incomplete JSON by closing brackets
                    open_braces = json_str.count('{')
                    close_braces = json_str.count('}')
                    if open_braces > close_braces:
                        json_str += '}' * (open_braces - close_braces)
                    
                    output_dict = json.loads(json_str)
                    return TopicOrganizationOutput(**output_dict)
                except json.JSONDecodeError:
                    pass
            
            # If all else fails, raise original error
            raise ValueError(f"Failed to parse agent output: {e}")

