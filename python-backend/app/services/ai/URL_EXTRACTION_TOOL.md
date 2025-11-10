# URL Extraction Tool

## Purpose

Yeh ek **function tool** hai jo agent call karega URLs extract karne ke liye. Tool HTML se links extract karega, filter karega, aur organized topics ke format me return karega.

## Use Case

**API**: `POST /api/ai/content/extract-topics`

**Flow**:
1. User URL bhejega
2. Agent tool ko call karega with user URL
3. Tool HTML fetch karega (httpx)
4. Tool links extract karega (beautifulsoup4)
5. Tool links filter karega
6. Tool organized topics return karega (JSON format)

## Tool Structure

```python
from agents import function_tool, RunContextWrapper
from agents.tool_context import ToolContext
from typing import Any, List, Dict
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json

# Context Model for Tool
class URLExtractionContext(BaseModel):
    """Context passed to URL extraction tool."""
    userId: str
    mainUrl: str
    timeout: int = 30  # seconds

# Output Model
class Topic(BaseModel):
    id: str
    title: str
    url: str  # MANDATORY
    description: str | None = None
    section: str | None = None

class URLExtractionResult(BaseModel):
    topics: List[Topic]
    mainUrl: str
    totalPages: int

@function_tool
async def extract_urls_from_documentation(
    ctx: RunContextWrapper[ToolContext[URLExtractionContext]],
    url: str
) -> str:
    """
    Extract and organize URLs from a documentation page.
    
    This tool:
    1. Fetches HTML content from the provided URL
    2. Extracts all links from the HTML
    3. Filters relevant documentation links
    4. Organizes links into topics with sections
    5. Returns organized topics in JSON format
    
    Args:
        ctx: Tool context containing userId and configuration
        url: The documentation URL to extract links from
        
    Returns:
        JSON string containing organized topics with structure:
        {
            "topics": [
                {
                    "id": "topic-1",
                    "title": "Introduction",
                    "url": "https://example.com/intro",
                    "description": "Introduction section",
                    "section": "Basics"
                }
            ],
            "mainUrl": "https://example.com",
            "totalPages": 10
        }
    """
    try:
        # Get context
        context = ctx.context.custom_data if hasattr(ctx.context, 'custom_data') else None
        
        # Extract URLs from HTML
        urls = await _extract_urls_from_html(url, context)
        
        # Organize URLs into topics
        topics = _organize_urls_to_topics(urls, url)
        
        # Create result
        result = URLExtractionResult(
            topics=topics,
            mainUrl=url,
            totalPages=len(topics)
        )
        
        # Return as JSON string
        return result.model_dump_json(indent=2)
        
    except Exception as e:
        # Return error in JSON format
        return json.dumps({
            "error": str(e),
            "topics": [],
            "mainUrl": url,
            "totalPages": 0
        })


async def _extract_urls_from_html(
    url: str,
    context: URLExtractionContext | None
) -> List[str]:
    """
    Extract URLs from HTML content.
    
    Args:
        url: URL to fetch HTML from
        context: Tool context with timeout settings
        
    Returns:
        List of extracted URLs
    """
    timeout = context.timeout if context else 30
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            html = response.text
        except Exception as e:
            raise Exception(f"Failed to fetch URL: {str(e)}")
    
    # Parse HTML
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract all links
    links = []
    for anchor in soup.find_all('a', href=True):
        href = anchor.get('href')
        if not href:
            continue
        
        # Convert relative URLs to absolute
        absolute_url = urljoin(url, href)
        
        # Filter relevant links
        if _is_relevant_link(absolute_url, url):
            links.append(absolute_url)
    
    # Remove duplicates and sort
    unique_links = list(set(links))
    unique_links.sort()
    
    return unique_links


def _is_relevant_link(link_url: str, main_url: str) -> bool:
    """
    Check if a link is relevant for documentation.
    
    Filters out:
    - External domains (different domain)
    - Non-HTTP/HTTPS links
    - Common non-content pages (login, logout, etc.)
    - File downloads (PDF, images, etc.)
    """
    try:
        parsed_link = urlparse(link_url)
        parsed_main = urlparse(main_url)
        
        # Must be HTTP/HTTPS
        if parsed_link.scheme not in ['http', 'https']:
            return False
        
        # Must be same domain
        if parsed_link.netloc != parsed_main.netloc:
            return False
        
        # Filter out common non-content pages
        excluded_paths = [
            '/login', '/logout', '/signup', '/register',
            '/api/', '/admin/', '/_next/', '/static/',
            '/assets/', '/images/', '/css/', '/js/'
        ]
        
        for excluded in excluded_paths:
            if excluded in parsed_link.path.lower():
                return False
        
        # Filter out file extensions
        excluded_extensions = [
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg',
            '.zip', '.tar', '.gz', '.exe', '.dmg'
        ]
        
        path_lower = parsed_link.path.lower()
        if any(path_lower.endswith(ext) for ext in excluded_extensions):
            return False
        
        return True
        
    except Exception:
        return False


def _organize_urls_to_topics(urls: List[str], main_url: str) -> List[Topic]:
    """
    Organize URLs into topics with basic structure.
    
    This is a simple organization - the agent will further refine this.
    
    Args:
        urls: List of extracted URLs
        main_url: Main documentation URL
        
    Returns:
        List of Topic objects
    """
    topics = []
    
    for idx, url in enumerate(urls, 1):
        # Extract title from URL path
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split('/') if p]
        
        # Generate title from URL
        if path_parts:
            title = path_parts[-1].replace('-', ' ').replace('_', ' ').title()
        else:
            title = "Home"
        
        # Determine section from path
        section = None
        if len(path_parts) > 1:
            section = path_parts[0].replace('-', ' ').replace('_', ' ').title()
        elif 'api' in url.lower():
            section = "API Reference"
        elif 'guide' in url.lower() or 'tutorial' in url.lower():
            section = "Guides"
        else:
            section = "General"
        
        topic = Topic(
            id=f"topic-{idx}",
            title=title,
            url=url,
            description=f"Documentation page: {title}",
            section=section
        )
        topics.append(topic)
    
    return topics
```

## Agent Integration

Tool ko agent me use karne ke liye:

```python
from agents import Agent, Runner
from agents.agent_output import AgentOutputSchema
from agents.tool_context import ToolContext
from pydantic import BaseModel

# Output Model
class TopicOrganizationOutput(BaseModel):
    topics: List[Topic]
    mainUrl: str
    totalPages: int

class TopicOrganizationAgent:
    def __init__(self, gemini_client):
        # Create output schema
        output_schema = AgentOutputSchema(output_type=TopicOrganizationOutput)
        
        self.agent = Agent(
            name="Topic Organization Agent",
            instructions=self._get_instructions(),
            model="gemini-2.0-flash",
            tools=[extract_urls_from_documentation],  # Tool added here
            output_schema=output_schema
        )
        self.client = gemini_client
    
    def _get_instructions(self) -> str:
        return """
You are an expert at organizing documentation links into logical topics and sections.

Your task:
1. Use the extract_urls_from_documentation tool to extract URLs from the user's documentation URL
2. Analyze the extracted URLs
3. Organize them into logical topics and sections
4. Generate meaningful titles and descriptions
5. Return organized topics in the required format

When using the tool:
- Pass the user's URL to extract_urls_from_documentation
- The tool will return JSON with extracted URLs organized as topics
- You can further refine the organization if needed
- Ensure each topic has a valid URL (mandatory for quiz generation)
"""
    
    async def organize_topics(
        self,
        url: str,
        user_id: str
    ) -> TopicOrganizationOutput:
        """Organize topics from URL."""
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

Use the extract_urls_from_documentation tool to get all URLs, then organize them into logical topics and sections.
"""
        
        result = Runner.run_sync(
            self.agent,
            prompt,
            context=context
        )
        
        return result.final_output
```

## Tool Context Usage

Tool me context pass karne ke liye `ToolContext` use karte hain:

**Reference**: [ToolContext Documentation](https://openai.github.io/openai-agents-python/ref/tool_context/)

```python
from agents.tool_context import ToolContext

# Create context
context = ToolContext(
    custom_data=URLExtractionContext(
        userId="user-123",
        mainUrl="https://docs.example.com",
        timeout=30
    )
)

# Use in Runner
result = Runner.run_sync(
    agent,
    prompt,
    context=context
)
```

## Tool Features

1. **HTML Fetching**: httpx se HTML fetch karta hai
2. **Link Extraction**: BeautifulSoup se sabhi links extract karta hai
3. **Link Filtering**: 
   - Same domain ke links
   - Documentation pages (not login, logout, etc.)
   - Valid HTML pages (not PDFs, images, etc.)
4. **URL Organization**: Basic topic structure create karta hai
5. **JSON Output**: Structured JSON format me return karta hai

## Error Handling

Tool me error handling:

```python
@function_tool(failure_error_function=custom_error_handler)
async def extract_urls_from_documentation(...):
    # Tool implementation
    pass

def custom_error_handler(ctx: RunContextWrapper, error: Exception) -> str:
    """Custom error handler for tool."""
    return json.dumps({
        "error": f"URL extraction failed: {str(error)}",
        "topics": [],
        "mainUrl": "",
        "totalPages": 0
    })
```

## Output Format

Tool JSON string return karta hai:

```json
{
  "topics": [
    {
      "id": "topic-1",
      "title": "Introduction",
      "url": "https://docs.example.com/intro",
      "description": "Introduction section",
      "section": "Basics"
    }
  ],
  "mainUrl": "https://docs.example.com",
  "totalPages": 10
}
```

## Key Requirements

1. **Tool Context**: `ToolContext` use karke userId aur configuration pass karo
2. **Error Handling**: Proper error handling with JSON error response
3. **URL Validation**: Valid URLs hi extract karo
4. **Filtering**: Irrelevant links filter karo
5. **JSON Output**: Structured JSON format me return karo

