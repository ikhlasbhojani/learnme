"""
Content Extraction Agent - Extracts and cleans content from URLs.
"""
from agents import Agent, Runner
from typing import List, Dict, Optional
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
import logging

# Setup logging
logger = logging.getLogger(__name__)


# Output Model for Content Extraction
class ContentExtractionOutput(BaseModel):
    """Output model for content extraction."""
    content: str  # Cleaned, summarized content text
    pageTitle: Optional[str] = None
    source: str  # Original URL
    extractedAt: str  # ISO 8601 timestamp


class ContentExtractionAgent:
    """
    Agent jo URLs se content extract karta hai aur AI se clean/summarize karta hai.
    """
    
    def __init__(self, gemini_client, model: str):
        """
        Initialize content extraction agent.
        
        Args:
            gemini_client: OpenAI-compatible client (AsyncOpenAI)
            model: User-selected model name (e.g., 'gemini-2.5-flash', 'gpt-4o', etc.)
        """
        self.client = gemini_client
        self.agent = Agent(
            name="Content Extraction Agent",
            instructions=self._get_instructions(),
            model=model,  # ALWAYS use user-selected model (no defaults)
            tools=[],  # No tools, but uses httpx/BeautifulSoup externally
            output_type=ContentExtractionOutput  # Structured output type
        )
    
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
- Preserve important technical details (but summarize if needed)
- Maintain logical flow
- Combine multiple pages into coherent content
- CRITICAL: Maximum content length in JSON response: 10,000 characters
- If content exceeds this limit, you MUST provide a concise summary with only key points
- Always ensure your JSON response is complete and properly formatted
- Never truncate the JSON structure itself - only summarize the content field
- Prioritize: main concepts > essential examples > key explanations > details
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
        # Use first URL as source
        source_url = urls[0] if urls else "unknown"
        cleaned_output = await self._clean_content(combined_content, source_url)
        
        return cleaned_output.content
    
    async def extract_content_from_single_url(
        self,
        url: str
    ) -> ContentExtractionOutput:
        """
        Extract content from a single URL.
        
        Args:
            url: URL to extract content from
            
        Returns:
            ContentExtractionOutput with cleaned content
        """
        # Fetch HTML
        html_contents = await self._fetch_urls([url])
        
        if url not in html_contents:
            raise Exception(f"Failed to fetch content from URL: {url}")
        
        # Extract raw text
        raw_content = self._extract_text_from_html(html_contents[url], url)
        
        # Clean with AI
        return await self._clean_content(raw_content, url)
    
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
        """Extract and clean text content from HTML using BeautifulSoup."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove all non-content elements
        for element in soup([
            'script', 'style', 'nav', 'footer', 'header', 'aside', 'ad',
            'noscript', 'iframe', 'embed', 'object', 'form', 'button',
            'input', 'select', 'textarea', 'svg', 'canvas', 'audio', 'video'
        ]):
            element.decompose()
        
        # Remove elements with common non-content classes/ids
        for element in soup.find_all(class_=lambda x: x and any(
            keyword in str(x).lower() for keyword in [
                'nav', 'menu', 'sidebar', 'footer', 'header', 'ad', 'advertisement',
                'cookie', 'banner', 'popup', 'modal', 'overlay', 'skip', 'breadcrumb',
                'toc', 'table-of-contents', 'social', 'share', 'comment', 'related'
            ]
        )):
            element.decompose()
        
        for element in soup.find_all(id=lambda x: x and any(
            keyword in str(x).lower() for keyword in [
                'nav', 'menu', 'sidebar', 'footer', 'header', 'ad', 'cookie',
                'banner', 'popup', 'modal', 'overlay', 'skip', 'breadcrumb',
                'toc', 'table-of-contents', 'social', 'share', 'comment'
            ]
        )):
            element.decompose()
        
        # Extract main content (try common selectors)
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find('div', class_=lambda x: x and 'content' in str(x).lower()) or
            soup.find('div', id=lambda x: x and 'content' in str(x).lower()) or
            soup.find('section') or
            soup.find('body')
        )
        
        if main_content:
            text = main_content.get_text(separator='\n', strip=True)
        else:
            text = soup.get_text(separator='\n', strip=True)
        
        # Clean up the extracted text
        text = self._clean_extracted_text(text)
        
        return text
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean extracted text by removing irrelevant content."""
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Skip very short lines (likely navigation items, buttons, etc.)
            if len(line) < 10:
                continue
            
            # Skip common navigation/UI text patterns
            skip_patterns = [
                'skip to', 'menu', 'navigation', 'home', 'about', 'contact',
                'privacy', 'terms', 'cookie', 'subscribe', 'follow us', 'share',
                'previous', 'next', 'back to top', 'scroll to', 'click here',
                'read more', 'learn more', 'view all', 'see all', 'show more',
                'sign up', 'log in', 'register', 'login', 'logout', 'search',
                'filter', 'sort', 'categories', 'tags', 'related', 'popular',
                'recent posts', 'archives', 'rss', 'feed', 'newsletter'
            ]
            
            line_lower = line.lower()
            if any(pattern in line_lower for pattern in skip_patterns):
                # Only skip if it's a short line (likely a button/link)
                if len(line) < 50:
                    continue
            
            # Skip lines that are mostly special characters or numbers
            if len(line.replace(' ', '').replace('.', '').replace(',', '').replace('-', '')) < 3:
                continue
            
            # Skip lines that look like URLs or email addresses
            if line.startswith('http://') or line.startswith('https://') or '@' in line and '.' in line:
                continue
            
            # Skip lines that are just repeated characters
            if len(set(line.replace(' ', ''))) < 3:
                continue
            
            cleaned_lines.append(line)
        
        # Join lines and clean up excessive whitespace
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Remove excessive blank lines (more than 2 consecutive)
        import re
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        
        # Remove excessive spaces
        cleaned_text = re.sub(r' {3,}', ' ', cleaned_text)
        
        return cleaned_text.strip()
    
    def _preprocess_content_for_llm(self, content: str) -> str:
        """Pre-process content to remove irrelevant parts before sending to LLM."""
        lines = content.split('\n')
        processed_lines = []
        
        # Remove common documentation noise
        skip_sections = [
            'table of contents', 'contents', 'on this page', 'quick links',
            'related articles', 'see also', 'references', 'external links',
            'navigation', 'breadcrumb', 'footer', 'header', 'sidebar'
        ]
        
        skip_section = False
        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()
            
            # Skip empty lines
            if not line_stripped:
                if not skip_section:
                    processed_lines.append('')
                continue
            
            # Check if this line starts a section to skip
            if any(section in line_lower for section in skip_sections):
                if len(line_stripped) < 50:  # Likely a section header
                    skip_section = True
                    continue
            
            # Check if we're in a code block or example that's too long
            if line_stripped.startswith('```') or line_stripped.startswith('`'):
                # Keep code blocks but limit their size
                if len(line_stripped) > 500:
                    # Truncate very long code lines
                    line_stripped = line_stripped[:500] + '...'
            
            # Skip lines that are just separators or decorative
            if all(c in '-=_*# ' for c in line_stripped) and len(line_stripped) > 10:
                continue
            
            # Skip lines that are just numbers or single characters
            if len(line_stripped.replace(' ', '').replace('.', '')) < 5:
                continue
            
            skip_section = False
            processed_lines.append(line_stripped)
        
        # Join and clean up
        processed_content = '\n'.join(processed_lines)
        
        # Remove excessive blank lines
        import re
        processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
        
        # Remove very short paragraphs (likely navigation or UI elements)
        paragraphs = processed_content.split('\n\n')
        meaningful_paragraphs = [
            p for p in paragraphs 
            if len(p.strip()) > 50  # Keep paragraphs with meaningful content
        ]
        
        processed_content = '\n\n'.join(meaningful_paragraphs)
        
        return processed_content.strip()
    
    async def _clean_content(self, content: str, url: str) -> ContentExtractionOutput:
        """Use AI agent to clean and summarize content."""
        current_time = datetime.utcnow().isoformat() + "Z"
        
        # Pre-process content: remove more irrelevant parts before sending to LLM
        content = self._preprocess_content_for_llm(content)
        
        # Limit content size more aggressively to avoid JSON truncation
        # Keep it under 12k chars to ensure JSON can be properly formatted (with room for JSON structure)
        max_content_length = 12000
        if len(content) > max_content_length:
            # Try to truncate at a sentence boundary
            truncated = content[:max_content_length]
            last_period = truncated.rfind('.')
            last_newline = truncated.rfind('\n')
            last_paragraph = truncated.rfind('\n\n')
            cut_point = max(last_period, last_newline, last_paragraph)
            if cut_point > max_content_length * 0.7:  # Only if we found a good break point
                content = content[:cut_point + 1] + "\n\n[Content truncated for processing - original was too long...]"
            else:
                content = truncated + "\n\n[Content truncated for processing - original was too long...]"
        
        prompt = f"""
Clean and format the following educational content extracted from documentation pages.

Source URL: {url}
Raw Content:
{content}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. The content field in your JSON response MUST be under 10,000 characters
2. If the input content is long, you MUST summarize it concisely
3. Keep only the most important information: key concepts, main points, essential examples
4. Remove redundant information, repeated explanations, and verbose descriptions
5. Preserve code snippets but keep them brief (only essential parts)
6. Extract page title if available in content
7. ALWAYS ensure your JSON response is complete - never truncate mid-JSON
8. If you cannot fit all content, prioritize: concepts > examples > explanations > details

Return a JSON object with:
- content: cleaned and SUMMARIZED content text (MUST be under 10,000 characters - this is critical!)
- pageTitle: extracted page title (if available, null otherwise)
- source: the source URL ({url})
- extractedAt: current timestamp in ISO 8601 format ({current_time})

IMPORTANT: Your JSON must be complete and valid. The content field should be a concise summary if the original was long.
"""
        
        result = await Runner.run(
            self.agent,
            prompt
        )
        
        # output_type automatically validates and parses JSON
        # result.final_output is already a ContentExtractionOutput instance
        try:
            return result.final_output_as(ContentExtractionOutput)
        except Exception as e:
            # If parsing fails, try to extract JSON from text
            import json
            import re
            
            # Get raw output text
            output_text = str(result.final_output) if hasattr(result, 'final_output') else str(result)
            
            logger.warning(f"JSON parsing failed, attempting recovery. Output length: {len(output_text)}")
            
            # Try to extract JSON from text
            # Remove markdown code blocks if present
            if "```json" in output_text:
                output_text = output_text.split("```json")[1].split("```")[0].strip()
            elif "```" in output_text:
                output_text = output_text.split("```")[1].split("```")[0].strip()
            
            # Try to find JSON object - look for the start
            json_start = output_text.find('{')
            if json_start == -1:
                raise ValueError(f"No JSON object found in output: {output_text[:200]}")
            
            # Find where the JSON might have been truncated
            # Look for incomplete content field
            json_str = output_text[json_start:]
            
            # Try to fix incomplete JSON by finding where content field ends
            # Pattern: "content": "..." 
            content_pattern = r'"content"\s*:\s*"'
            content_match = re.search(content_pattern, json_str)
            
            if content_match:
                content_start = content_match.end()
                # Find the end of content string - look for closing quote
                # But be careful of escaped quotes
                content_end = -1
                i = content_start
                max_search = min(len(json_str), content_start + 15000)  # Don't search too far
                while i < max_search:
                    if json_str[i] == '"' and (i == 0 or json_str[i-1] != '\\'):
                        # Found unescaped quote - might be end of content string
                        # Check if next char is comma or closing brace
                        if i + 1 < len(json_str) and json_str[i+1] in [',', '}', '\n']:
                            content_end = i + 1
                            break
                    i += 1
                
                if content_end > content_start:
                    # Truncate content if it's too long
                    content_value = json_str[content_start:content_end-1]
                    if len(content_value) > 10000:
                        # Truncate at a safe point
                        truncated_content = content_value[:10000]
                        # Find last complete sentence
                        last_period = truncated_content.rfind('.')
                        if last_period > 8000:
                            truncated_content = truncated_content[:last_period+1]
                        # Reconstruct JSON
                        json_str = (
                            json_str[:content_start] + 
                            truncated_content + 
                            '... [truncated]"' +
                            json_str[content_end:]
                        )
                elif content_end == -1:
                    # Content string was not closed - truncate and close it
                    content_value = json_str[content_start:]
                    if len(content_value) > 10000:
                        truncated_content = content_value[:10000]
                        last_period = truncated_content.rfind('.')
                        if last_period > 8000:
                            truncated_content = truncated_content[:last_period+1]
                        # Close the content string and add remaining JSON structure
                        json_str = json_str[:content_start] + truncated_content + '... [truncated]"'
                        # Try to add closing brace if missing
                        if json_str.count('{') > json_str.count('}'):
                            json_str += '}'
            
            # Try to fix incomplete JSON by closing brackets and strings
            open_braces = json_str.count('{')
            close_braces = json_str.count('}')
            if open_braces > close_braces:
                json_str += '}' * (open_braces - close_braces)
            
            # Try to fix incomplete strings - find last unclosed quote
            quote_count = json_str.count('"') - json_str.count('\\"')
            if quote_count % 2 != 0:
                # Find the last quote and ensure it's closed
                last_quote_idx = json_str.rfind('"')
                if last_quote_idx > 0 and json_str[last_quote_idx-1] != '\\':
                    # Check if we need to close it
                    after_quote = json_str[last_quote_idx+1:].strip()
                    if not after_quote.startswith((',', '}', ']')):
                        # String is not closed, try to close it
                        json_str = json_str[:last_quote_idx+1] + '"' + json_str[last_quote_idx+1:]
            
            try:
                output_dict = json.loads(json_str)
                
                # Ensure content is not too long
                if 'content' in output_dict:
                    content_val = str(output_dict['content'])
                    if len(content_val) > 10000:
                        output_dict['content'] = content_val[:10000] + "... [truncated]"
                
                return ContentExtractionOutput(**output_dict)
            except json.JSONDecodeError as json_err:
                # If JSON parsing still fails, create a fallback response
                logger.warning(f"Failed to parse JSON after recovery attempts: {json_err}")
                logger.warning(f"JSON string (first 500 chars): {json_str[:500]}")
                # Use truncated original content as fallback
                fallback_content = content[:10000] if len(content) > 10000 else content
                return ContentExtractionOutput(
                    content=fallback_content,
                    pageTitle=None,
                    source=url,
                    extractedAt=current_time
                )
            
            # If all else fails, raise original error
            raise ValueError(f"Failed to parse agent output: {e}")

