# Content Extraction Agent

## Purpose

Selected topic URLs se content extract karta hai, clean karta hai, aur AI se summarize karta hai. Quiz generation ke liye clean, relevant content provide karta hai.

## Use Case

**API**: `POST /api/ai/quiz/generate-from-url`

**Input**: 
- Selected topic URLs (array)
- Main URL (optional)

**Output**:
- Cleaned, summarized content text
- Combined content from all URLs

## Agent Structure

```python
from agents import Agent, Runner
from agents.agent_output import AgentOutputSchema
from typing import List, Dict
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup

# Output Model for Content Extraction
class ContentExtractionOutput(BaseModel):
    content: str  # Cleaned, summarized content text
    pageTitle: Optional[str] = None
    source: str  # Original URL
    extractedAt: str  # ISO 8601 timestamp

class ContentExtractionAgent:
    """
    Agent jo URLs se content extract karta hai aur AI se clean/summarize karta hai.
    """
    
    def __init__(self, gemini_client):
        # Create output schema for structured output
        output_schema = AgentOutputSchema(output_type=ContentExtractionOutput)
        
        self.agent = Agent(
            name="Content Extraction Agent",
            instructions=self._get_instructions(),
            model="gemini-2.0-flash",
            tools=[],  # No tools, but uses httpx/BeautifulSoup externally
            output_schema=output_schema  # Structured output schema
        )
        self.client = gemini_client
    
    def _get_instructions(self) -> str:
        return """
You are an expert at extracting and cleaning educational content from web pages.

Your task:
1. Receive raw HTML content from documentation pages
2. Extract only the educational/relevant content
3. Remove navigation, ads, footers, headers, and other non-content elements
4. Clean and format the text
5. Summarize if content is too long (maintain key information)
6. Combine content from multiple URLs into coherent text

Content Extraction Guidelines:
- Extract main article/content body
- Preserve code snippets, examples, and important details
- Remove navigation menus, sidebars, footers, headers
- Remove ads and promotional content
- Keep section headings and structure
- Maintain readability and flow

Output Requirements:
- Clean, readable text
- Preserve important technical details
- Maintain logical flow
- Combine multiple pages into coherent content
- Maximum length: 10,000 words (summarize if longer)
"""
    
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
        # Step 1: Fetch HTML from all URLs
        html_contents = await self._fetch_urls(urls)
        
        # Step 2: Extract raw text from HTML
        raw_contents = []
        for url, html in html_contents.items():
            text = self._extract_text_from_html(html, url)
            raw_contents.append(text)
        
        # Step 3: Combine all content
        combined_content = "\n\n---\n\n".join(raw_contents)
        
        # Step 4: Use AI to clean and summarize
        cleaned_content = await self._clean_content(combined_content)
        
        return cleaned_content
    
    async def _fetch_urls(self, urls: List[str]) -> Dict[str, str]:
        """Fetch HTML content from URLs using httpx."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            results = {}
            for url in urls:
                try:
                    response = await client.get(url)
                    response.raise_for_status()
                    results[url] = response.text
                except Exception as e:
                    # Log error, continue with other URLs
                    print(f"Error fetching {url}: {e}")
            return results
    
    def _extract_text_from_html(self, html: str, url: str) -> str:
        """Extract text content from HTML using BeautifulSoup."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script, style, nav, footer, header, ads
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'ad']):
            element.decompose()
        
        # Extract main content (try common selectors)
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find('div', class_='content') or
            soup.find('body')
        )
        
        if main_content:
            text = main_content.get_text(separator='\n', strip=True)
        else:
            text = soup.get_text(separator='\n', strip=True)
        
        return text
    
    async def _clean_content(self, content: str, url: str) -> ContentExtractionOutput:
        """Use AI agent to clean and summarize content."""
        from datetime import datetime
        
        prompt = f"""
Clean and format the following educational content extracted from documentation pages.

Source URL: {url}
Raw Content:
{content[:50000]}  # Limit to 50k chars for prompt

Tasks:
1. Remove any remaining navigation, ads, or irrelevant text
2. Clean up formatting (remove excessive whitespace, fix line breaks)
3. Maintain logical structure and flow
4. Preserve code snippets, examples, and technical details
5. If content is very long (>10,000 words), summarize while keeping key information
6. Ensure content is readable and well-formatted
7. Extract page title if available in content

Return a JSON object with:
- content: cleaned content text
- pageTitle: extracted page title (if available, null otherwise)
- source: the source URL
- extractedAt: current timestamp in ISO 8601 format
"""
        
        result = Runner.run_sync(
            self.agent,
            prompt
        )
        
        # AgentOutputSchema automatically validates and parses JSON
        # result.final_output is already a ContentExtractionOutput instance
        return result.final_output
```

## Input Format

```python
urls = [
    "https://docs.example.com/intro",
    "https://docs.example.com/getting-started",
    "https://docs.example.com/advanced/concepts",
]
```

## Output Format

```python
"""
Introduction to the Documentation

This documentation provides a comprehensive guide to...

Getting Started

To get started with this framework, you need to:

1. Install the package
2. Configure your environment
3. Run your first example

Advanced Concepts

For advanced users, here are some key concepts:

- Concept 1: Explanation...
- Concept 2: Explanation...

[Clean, readable, combined content from all URLs]
"""
```

## Key Requirements

1. **Content Extraction**: HTML se only relevant content extract karo
2. **Cleaning**: Navigation, ads, footers remove karo
3. **Preservation**: Code snippets, examples, technical details preserve karo
4. **Combination**: Multiple URLs ka content combine karo
5. **Summarization**: Agar content bahut lamba hai to summarize karo (key info maintain karke)

## Error Handling

- URL fetch failure: Skip that URL, continue with others
- HTML parsing error: Use fallback text extraction
- Content too large: Summarize automatically
- Empty content: Return error or skip URL

## Dependencies

- `httpx`: HTTP requests for fetching URLs
- `beautifulsoup4`: HTML parsing and content extraction
- `gemini-2.0-flash`: AI content cleaning and summarization

