"""
URL Extraction Tool - Function tool for extracting URLs from documentation.
"""
from agents import function_tool, RunContextWrapper
from agents.tool_context import ToolContext
from typing import List
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
from datetime import datetime


# Context Model for Tool
class URLExtractionContext(BaseModel):
    """Context passed to URL extraction tool."""
    userId: str
    mainUrl: str
    timeout: int = 30  # seconds


# Output Model
class Topic(BaseModel):
    """Topic model for URL extraction."""
    id: str
    title: str
    url: str  # MANDATORY
    description: str | None = None
    section: str | None = None


class URLExtractionResult(BaseModel):
    """Result model for URL extraction."""
    topics: List[Topic]
    mainUrl: str
    totalPages: int


@function_tool
async def extract_urls_from_documentation(
    ctx: RunContextWrapper[ToolContext],
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
        # Get context - ToolContext might not have custom_data attribute
        # Use default timeout if context not available
        context_data = None
        try:
            # Try to get custom_data from context if available
            if hasattr(ctx.context, 'custom_data'):
                context_data = ctx.context.custom_data
            elif hasattr(ctx, 'context') and isinstance(ctx.context, dict):
                context_data = ctx.context.get('custom_data')
        except:
            pass  # Use default if context not available
        
        # Extract URLs from HTML with titles
        urls_with_titles = await _extract_urls_from_html(url, context_data)
        
        # Organize URLs into topics
        topics = _organize_urls_to_topics(urls_with_titles, url)
        
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
) -> List[tuple[str, str]]:
    """
    Extract URLs from HTML content along with their page titles.
    
    Args:
        url: URL to fetch HTML from
        context: Tool context with timeout settings
        
    Returns:
        List of tuples (url, title) where title is extracted from page heading
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
    
    # Extract all links with their titles
    links_with_titles = []
    seen_urls = set()
    
    for anchor in soup.find_all('a', href=True):
        href = anchor.get('href')
        if not href:
            continue
        
        # Convert relative URLs to absolute
        absolute_url = urljoin(url, href)
        
        # Filter relevant links
        if not _is_relevant_link(absolute_url, url):
            continue
        
        # Skip duplicates
        if absolute_url in seen_urls:
            continue
        seen_urls.add(absolute_url)
        
        # Extract title from anchor text or page heading (async)
        title = await _extract_title_from_url(absolute_url, anchor, soup, url)
        
        links_with_titles.append((absolute_url, title))
    
    # Sort by URL
    links_with_titles.sort(key=lambda x: x[0])
    
    return links_with_titles


async def _extract_title_from_url(
    url: str,
    anchor: BeautifulSoup,
    main_soup: BeautifulSoup,
    main_url: str
) -> str:
    """
    Extract title from URL's page heading or anchor text.
    Fetches the actual page to get its heading (h1, h2, etc.).
    
    Args:
        url: The URL to extract title for
        anchor: The anchor tag element
        main_soup: BeautifulSoup object of the main page
        main_url: Main documentation URL
        
    Returns:
        Extracted title
    """
    # First, try to get title from anchor text (fast, no network call)
    anchor_text = anchor.get_text(strip=True)
    if anchor_text and len(anchor_text) > 0 and len(anchor_text) < 100:
        # Clean anchor text
        title = anchor_text.strip()
        if title:
            # Use anchor text as initial title, but try to fetch page heading too
            pass
    
    # Try to fetch the page and get its actual heading
    try:
        parsed_url = urlparse(url)
        parsed_main = urlparse(main_url)
        
        # Check if it's the same page (hash fragment)
        if parsed_url.path == parsed_main.path and parsed_url.fragment:
            # Same page with hash - try to find heading with that ID
            heading = main_soup.find(id=parsed_url.fragment)
            if heading:
                return heading.get_text(strip=True)
            
            # Try to find heading by text matching
            headings = main_soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for h in headings:
                if parsed_url.fragment.lower() in h.get('id', '').lower():
                    return h.get_text(strip=True)
        
        # For different pages, fetch the page to get its heading
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                page_html = response.text
                page_soup = BeautifulSoup(page_html, 'html.parser')
                
                # Try to find h1 first (main heading)
                h1 = page_soup.find('h1')
                if h1:
                    title = h1.get_text(strip=True)
                    if title and len(title) > 0:
                        return title
                
                # If no h1, try h2
                h2 = page_soup.find('h2')
                if h2:
                    title = h2.get_text(strip=True)
                    if title and len(title) > 0:
                        return title
                
                # If no h1/h2, try title tag
                title_tag = page_soup.find('title')
                if title_tag:
                    title = title_tag.get_text(strip=True)
                    if title and len(title) > 0:
                        # Clean title (remove common suffixes like " - Documentation")
                        title = title.split(' - ')[0].split(' | ')[0].strip()
                        return title
                        
            except Exception:
                # If fetch fails, fall back to anchor text or URL
                pass
        
        # Fallback: use anchor text if available
        if anchor_text and len(anchor_text.strip()) > 0:
            return anchor_text.strip()
        
        # Final fallback: generate from URL path
        path_parts = [p for p in parsed_url.path.split('/') if p]
        if path_parts:
            last_part = path_parts[-1]
            return last_part.replace('-', ' ').replace('_', ' ').title()
        else:
            return "Home"
            
    except Exception:
        # Fallback to anchor text or URL-based title
        if anchor_text and len(anchor_text.strip()) > 0:
            return anchor_text.strip()
        
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split('/') if p]
        if path_parts:
            last_part = path_parts[-1]
            return last_part.replace('-', ' ').replace('_', ' ').title()
        return "Home"


def _is_relevant_link(link_url: str, main_url: str) -> bool:
    """
    Check if a link is relevant for documentation.
    
    Filters out:
    - External domains (different domain)
    - Non-HTTP/HTTPS links
    - Common non-content pages (login, logout, etc.)
    - File downloads (PDF, images, etc.)
    - Anchor links (hash fragments only)
    - Language redirects (ja/, ko/, zh/)
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
        
        # Filter out anchor-only links (hash fragments)
        if parsed_link.path == parsed_main.path and parsed_link.fragment:
            # Skip ALL hash fragments on the same page (anchor links)
            return False
        
        # Filter out language redirects
        path_parts = [p for p in parsed_link.path.split('/') if p]
        if path_parts and path_parts[0] in ['ja', 'ko', 'zh']:
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


def _organize_urls_to_topics(urls_with_titles: List[tuple[str, str]], main_url: str) -> List[Topic]:
    """
    Organize URLs into topics with basic structure.
    
    This is a simple organization - the agent will further refine this.
    
    Args:
        urls_with_titles: List of tuples (url, title) where title is from page heading
        main_url: Main documentation URL
        
    Returns:
        List of Topic objects
    """
    topics = []
    seen_urls = set()  # Track URLs to avoid duplicates
    
    for idx, (url, extracted_title) in enumerate(urls_with_titles, 1):
        # Skip duplicates
        if url in seen_urls:
            continue
        seen_urls.add(url)
        
        # Extract title from URL path (fallback if extracted_title is not good)
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split('/') if p]
        
        # Skip if it's just the main URL (already included)
        if not path_parts and url == main_url:
            continue
        
        # Use extracted title if available and meaningful, otherwise generate from URL
        if extracted_title and len(extracted_title.strip()) > 0:
            title = extracted_title.strip()
        else:
            # Generate title from URL as fallback
            if path_parts:
                last_part = path_parts[-1]
                title = last_part.replace('-', ' ').replace('_', ' ').title()
            else:
                title = "Home"
        
        # Determine section from path
        section = None
        if len(path_parts) > 0:
            # Use first part as section
            first_part = path_parts[0]
            section = first_part.replace('-', ' ').replace('_', ' ').title()
        elif 'ref/' in url.lower() or 'reference/' in url.lower():
            section = "API Reference"
        elif 'examples/' in url.lower():
            section = "Examples"
        elif 'guide/' in url.lower() or 'tutorial/' in url.lower() or 'guides/' in url.lower():
            section = "Guides"
        elif 'quickstart' in url.lower() or 'getting_started' in url.lower():
            section = "Getting Started"
        elif 'overview' in url.lower():
            section = "Overview"
        else:
            section = "Documentation"
        
        # Generate unique ID from URL path
        topic_id = '-'.join(path_parts) if path_parts else 'home'
        topic_id = topic_id.replace('/', '-').lower()
        
        topic = Topic(
            id=topic_id,
            title=title,
            url=url,
            description=f"Documentation page: {title}",
            section=section
        )
        topics.append(topic)
    
    return topics

