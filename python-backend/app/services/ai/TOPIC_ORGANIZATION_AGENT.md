# Topic Organization Agent

## Purpose

Documentation URL se extract kiye gaye links ko AI se organize karta hai - topics, sections, aur descriptions generate karta hai.

## Use Case

**API**: `POST /api/ai/content/extract-topics`

**Input**: 
- Raw URLs list (documentation ke sabhi links)
- Main documentation URL

**Output**:
- Organized topics with sections
- Har topic me: id, title, url, description, section

## Agent Structure

```python
from agents import Agent, Runner
from agents.agent_output import AgentOutputSchema
from agents.tool_context import ToolContext
from typing import List, Dict, Optional
from pydantic import BaseModel

# Import URL extraction tool
from app.services.ai.tools.url_extraction import extract_urls_from_documentation, URLExtractionContext

# Output Model for Topic Organization
class Topic(BaseModel):
    id: str
    title: str
    url: str  # MANDATORY - Quiz generation ke liye zaroori
    description: Optional[str] = None
    section: Optional[str] = None

class TopicOrganizationOutput(BaseModel):
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
        # Create output schema for structured output
        output_schema = AgentOutputSchema(output_type=TopicOrganizationOutput)
        
        self.agent = Agent(
            name="Topic Organization Agent",
            instructions=self._get_instructions(),
            model="gemini-2.0-flash",
            tools=[extract_urls_from_documentation],  # URL extraction tool added
            output_schema=output_schema  # Structured output schema
        )
        self.client = gemini_client
    
    def _get_instructions(self) -> str:
        return """
You are an expert at organizing documentation links into logical topics and sections.

Your task:
1. Use the extract_urls_from_documentation tool to extract URLs from the user's documentation URL
2. The tool will return JSON with extracted URLs organized as basic topics
3. Analyze the extracted URLs and further refine the organization
4. Group similar URLs into logical topics/sections
5. Generate meaningful titles and descriptions for each topic
6. Organize topics hierarchically (if applicable)
7. Ensure each topic has a clear, descriptive title

When using the tool:
- Pass the user's URL to extract_urls_from_documentation
- The tool will fetch HTML, extract links, filter them, and return basic topic structure
- You can further refine the organization, improve titles, and add better descriptions
- Ensure each topic has a valid URL (mandatory for quiz generation)

Output Requirements:
- Each topic must have: id, title, url, description (optional), section (optional)
- Topics should be logically grouped by functionality or subject matter
- Descriptions should be concise (1-2 sentences)
- Sections should represent major categories (e.g., "Basics", "Advanced", "API Reference")

Guidelines:
- Group related URLs together (e.g., all "getting started" pages)
- Use clear, user-friendly titles
- Avoid duplicate topics
- Maintain the original URLs (they are required for quiz generation)
- If a URL doesn't fit any category, create a "General" or "Miscellaneous" section
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
        # Create context for tool
        context = ToolContext(
            custom_data=URLExtractionContext(
                userId=user_id,
                mainUrl=url,
                timeout=30
            )
        )
        
        prompt = f"""
Extract and organize topics from this documentation URL: {url}

Process:
1. Use the extract_urls_from_documentation tool to extract all URLs from the documentation page
2. The tool will return JSON with basic topic structure
3. Analyze and further refine the organization:
   - Improve topic titles to be more descriptive
   - Group related topics into logical sections
   - Add meaningful descriptions
   - Ensure proper categorization

Return a JSON object with:
- topics: array of topic objects (each with id, title, url, description, section)
- mainUrl: the main documentation URL ({url})
- totalPages: total number of topics found

Each topic must have a valid URL (mandatory for quiz generation).
"""
        
        result = Runner.run_sync(
            self.agent,
            prompt,
            context=context
        )
        
        # AgentOutputSchema automatically validates and parses JSON
        # result.final_output is already a TopicOrganizationOutput instance
        return result.final_output
```

## Input Format

```python
# Agent ko sirf URL aur user_id chahiye
url = "https://docs.example.com"
user_id = "user-123"

# Agent internally:
# 1. Tool ko call karega (extract_urls_from_documentation)
# 2. Tool HTML fetch karega, links extract karega
# 3. Agent tool output ko refine karega
# 4. Final organized topics return karega
```

## Output Format

```python
[
    {
        "id": "topic-1",
        "title": "Introduction",
        "url": "https://docs.example.com/intro",
        "description": "Introduction to the documentation",
        "section": "Basics"
    },
    {
        "id": "topic-2",
        "title": "Getting Started",
        "url": "https://docs.example.com/getting-started",
        "description": "Quick start guide for beginners",
        "section": "Basics"
    },
    {
        "id": "topic-3",
        "title": "Advanced Concepts",
        "url": "https://docs.example.com/advanced/concepts",
        "description": "Advanced topics and concepts",
        "section": "Advanced"
    }
]
```

## Key Requirements

1. **Tool Integration**: Agent **must** use `extract_urls_from_documentation` tool to extract URLs
2. **URL Preservation**: Har topic me original URL **mandatory** hai (quiz generation ke liye)
3. **Logical Grouping**: Similar topics ko sections me group karo
4. **Clear Titles**: User-friendly, descriptive titles
5. **Descriptions**: Optional but helpful (1-2 sentences)
6. **Sections**: Optional categories (Basics, Advanced, API Reference, etc.)
7. **Tool Context**: `ToolContext` use karke userId aur configuration pass karo

## Error Handling

- Tool failure: If URL extraction tool fails, return error
- Invalid URLs: Tool will filter invalid URLs
- Empty URL list: Tool returns empty topics, agent should handle gracefully
- AI parsing failure: Retry with simpler prompt
- Invalid response format: AgentOutputSchema automatically validates

## Tool Dependency

Yeh agent **requires** `extract_urls_from_documentation` tool. Tool:
- HTML fetch karta hai (httpx)
- Links extract karta hai (beautifulsoup4)
- Links filter karta hai
- Basic topic structure return karta hai

Agent tool output ko further refine karta hai aur better organization provide karta hai.

