"""
URL Extraction Tool - Function tool for extracting URLs from documentation.
"""
from agents import function_tool, RunContextWrapper
from agents.tool_context import ToolContext
from typing import List, Set, Dict
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
from datetime import datetime
from collections import deque
import asyncio


# Context Model for Tool
class URLExtractionContext(BaseModel):
    """Context passed to URL extraction tool."""
    userId: str
    mainUrl: str
    timeout: int = 60  # seconds - increased for deep crawling
    max_depth: int = 5  # Maximum recursion depth for nested URLs (increased)
    max_urls_per_level: int = 200  # Maximum URLs to process per level (increased)


# Output Model
class Topic(BaseModel):
    """Topic model for URL extraction."""
    id: str
    title: str
    url: str  # MANDATORY
    description: str | None = None
    section: str | None = None
    depth: int = 0  # Depth level of this URL


class URLExtractionResult(BaseModel):
    """Result model for URL extraction."""
    topics: List[Topic]
    mainUrl: str
    totalPages: int
    maxDepth: int  # Maximum depth reached


@function_tool
async def extract_urls_from_documentation(
    ctx: RunContextWrapper[ToolContext],
    url: str
) -> str:
    """
    Extract and organize URLs from a documentation page with NESTED URL extraction.
    
    This tool uses BFS (Breadth-First Search) to:
    1. Start from main URL (Level 0)
    2. Extract all URLs from Level 0
    3. Go into each Level 1 URL and extract their nested URLs (Level 2)
    4. Continue step-by-step until max_depth is reached
    5. Track visited URLs to avoid duplicates and infinite loops
    
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
                    "section": "Basics",
                    "depth": 1
                }
            ],
            "mainUrl": "https://example.com",
            "totalPages": 50,
            "maxDepth": 3
        }
    """
    try:
        # Get context - ToolContext might not have custom_data attribute
        context_data = None
        try:
            # Try to get custom_data from context if available
            if hasattr(ctx.context, 'custom_data'):
                context_data = ctx.context.custom_data
            elif hasattr(ctx, 'context') and isinstance(ctx.context, dict):
                context_data = ctx.context.get('custom_data')
        except:
            pass  # Use default if context not available
        
        # Extract URLs recursively using BFS
        all_urls_with_depth = await _extract_urls_recursively_bfs(url, context_data)
        
        # Organize URLs into topics
        topics = _organize_urls_to_topics_with_depth(all_urls_with_depth, url)
        
        # Calculate max depth reached
        max_depth_reached = max([t.depth for t in topics], default=0)
        
        # Create result
        result = URLExtractionResult(
            topics=topics,
            mainUrl=url,
            totalPages=len(topics),
            maxDepth=max_depth_reached
        )
        
        # Return as JSON string
        return result.model_dump_json(indent=2)
        
    except Exception as e:
        # Return error in JSON format
        return json.dumps({
            "error": str(e),
            "topics": [],
            "mainUrl": url,
            "totalPages": 0,
            "maxDepth": 0
        })


async def _extract_urls_recursively_bfs(
    main_url: str,
    context: URLExtractionContext | None
) -> List[tuple[str, str, int]]:
    """
    Extract URLs recursively using BFS (Breadth-First Search).
    
    This ensures step-by-step exploration:
    - Level 0: Main URL
    - Level 1: All URLs found in main URL
    - Level 2: All URLs found in Level 1 URLs
    - And so on...
    
    Args:
        main_url: Starting URL
        context: Tool context with timeout and depth settings
        
    Returns:
        List of tuples (url, title, depth) where depth indicates nesting level
    """
    # Configuration - INCREASED for deeper crawling
    max_depth = context.max_depth if context and hasattr(context, 'max_depth') else 5
    max_urls_per_level = context.max_urls_per_level if context and hasattr(context, 'max_urls_per_level') else 200
    
    # BFS Queue: (url, depth)
    queue = deque([(main_url, 0)])
    
    # Track visited URLs to avoid infinite loops
    visited: Set[str] = set()
    visited.add(main_url)
    
    # Store all found URLs with their depth: (url, title, depth)
    all_urls_with_depth: List[tuple[str, str, int]] = []
    
    # Track URLs at each level for progress logging
    level_counts: Dict[int, int] = {}
    
    print(f"🔍 Starting BFS URL extraction from: {main_url}")
    print(f"⚙️  Max Depth: {max_depth}, Max URLs per level: {max_urls_per_level}")
    
    # Track progress
    processed_count = 0
    error_count = 0
    
    # BFS Loop
    while queue:
        current_url, current_depth = queue.popleft()
        processed_count += 1
        
        # Stop if we've reached max depth
        if current_depth > max_depth:
            continue
        
        print(f"\n📍 Level {current_depth} | Page {processed_count}/{processed_count + len(queue)}: {current_url}")
        
        try:
            # Extract URLs from current page
            urls_with_titles = await _extract_urls_from_html(current_url, context)
            
            # Count URLs at this level
            level_counts[current_depth] = level_counts.get(current_depth, 0) + len(urls_with_titles)
            
            print(f"✅ Found {len(urls_with_titles)} URLs at Level {current_depth} from this page")
            
            # Process URLs in batches if too many
            urls_to_process = urls_with_titles[:max_urls_per_level]
            
            if len(urls_with_titles) > max_urls_per_level:
                print(f"⚠️  Limited to first {max_urls_per_level} URLs (found {len(urls_with_titles)} total)")
            
            # Track new URLs added
            new_urls_count = 0
            
            # Process each found URL
            for found_url, title in urls_to_process:
                # Skip if already visited
                if found_url in visited:
                    continue
                
                visited.add(found_url)
                new_urls_count += 1
                
                # Add to results
                all_urls_with_depth.append((found_url, title, current_depth + 1))
                
                # Add to queue for next level exploration (if not at max depth)
                if current_depth + 1 <= max_depth:
                    queue.append((found_url, current_depth + 1))
            
            if new_urls_count > 0:
                print(f"➕ Added {new_urls_count} new URLs to crawl queue")
            else:
                print(f"ℹ️  No new URLs (all were duplicates)")
        
        except Exception as e:
            error_count += 1
            print(f"❌ Error processing {current_url}: {str(e)}")
            # Continue with next URL in queue
            continue
    
    # Summary
    print(f"\n✨ BFS Complete!")
    print(f"📊 Total pages processed: {processed_count}")
    print(f"📊 Total URLs found: {len(all_urls_with_depth)}")
    print(f"📊 Errors encountered: {error_count}")
    print(f"📊 URLs per level: {level_counts}")
    print(f"📊 Total unique pages visited: {len(visited)}")
    
    return all_urls_with_depth


async def _extract_urls_from_html(
    url: str,
    context: URLExtractionContext | None
) -> List[tuple[str, str]]:
    """
    Extract URLs from HTML content along with their page titles.
    Optimized to avoid timeouts by using anchor text first.
    
    Args:
        url: URL to fetch HTML from
        context: Tool context with timeout settings
        
    Returns:
        List of tuples (url, title) where title is extracted from page heading
    """
    timeout = min(context.timeout if context else 60, 30)  # Max 30 seconds for page fetch (increased)
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            html = response.text
        except httpx.TimeoutException:
            raise Exception(f"Timeout while fetching URL: {url}")
        except Exception as e:
            raise Exception(f"Failed to fetch URL: {str(e)}")
    
    # Parse HTML
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract all links with their titles
    links_with_titles = []
    seen_urls = set()
    
    # REMOVED LIMIT - Process ALL links found on page (no [:200] limit)
    # This ensures we don't miss any nested URLs
    anchors = soup.find_all('a', href=True)
    
    for anchor in anchors:
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
        # This is now optimized to use anchor text first
        try:
            title = await _extract_title_from_url(absolute_url, anchor, soup, url)
            links_with_titles.append((absolute_url, title))
        except Exception:
            # If title extraction fails, use anchor text or URL-based title
            anchor_text = anchor.get_text(strip=True)
            if anchor_text:
                links_with_titles.append((absolute_url, anchor_text))
            else:
                # Generate from URL
                parsed = urlparse(absolute_url)
                path_parts = [p for p in parsed.path.split('/') if p]
                if path_parts:
                    title = path_parts[-1].replace('-', ' ').replace('_', ' ').title()
                else:
                    title = "Home"
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
    Optimized to avoid slow HTTP requests - uses anchor text first.
    
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
        # Use anchor text as title (most reliable and fastest)
        return anchor_text.strip()
    
    # Try to fetch the page and get its actual heading (with short timeout)
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
        
        # For different pages, ONLY fetch if anchor text is not available
        # Use very short timeout to avoid hanging (5 seconds max - increased)
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(url, follow_redirects=True)
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
                        
            except (httpx.TimeoutException, httpx.RequestError, Exception):
                # If fetch fails or times out, fall back to anchor text or URL
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
    Check if a link is relevant for documentation - RELAXED filtering for more coverage.
    
    Filters out ONLY:
    - External domains (different base domain)
    - Non-HTTP/HTTPS links
    - Login/auth pages
    - File downloads (images, PDFs, etc.)
    - Anchor-only links (same page hash fragments)
    """
    try:
        parsed_link = urlparse(link_url)
        parsed_main = urlparse(main_url)
        
        # Must be HTTP/HTTPS
        if parsed_link.scheme not in ['http', 'https']:
            return False
        
        # Must be same domain OR subdomain (relaxed from exact match)
        # Example: docs.example.com and api.example.com both allowed if main is example.com
        link_domain_parts = parsed_link.netloc.split('.')
        main_domain_parts = parsed_main.netloc.split('.')
        
        # Get base domain (last 2 parts: example.com)
        if len(link_domain_parts) >= 2 and len(main_domain_parts) >= 2:
            link_base = '.'.join(link_domain_parts[-2:])
            main_base = '.'.join(main_domain_parts[-2:])
            if link_base != main_base:
                return False
        elif parsed_link.netloc != parsed_main.netloc:
            # Exact match if we can't extract base domain
            return False
        
        # Filter out anchor-only links (hash fragments on same page)
        if parsed_link.path == parsed_main.path and parsed_link.fragment:
            return False
        
        # REMOVED: Language redirect filtering - we want to explore all pages now
        
        # Filter out ONLY critical non-content pages (minimal filtering)
        excluded_paths = [
            '/login', '/logout', '/signup', '/register', '/sign-in', '/sign-out',
            '/_next/', '/static/', '/assets/', '/images/', '/css/', '/js/'
        ]
        
        path_lower = parsed_link.path.lower()
        for excluded in excluded_paths:
            if excluded in path_lower:
                return False
        
        # Filter out file extensions
        excluded_extensions = [
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
            '.zip', '.tar', '.gz', '.exe', '.dmg', '.css', '.js',
            '.woff', '.woff2', '.ttf', '.eot'
        ]
        
        if any(path_lower.endswith(ext) for ext in excluded_extensions):
            return False
        
        return True
        
    except Exception:
        return False


def _organize_urls_to_topics_with_depth(
    urls_with_depth: List[tuple[str, str, int]], 
    main_url: str
) -> List[Topic]:
    """
    Organize URLs into topics with depth information.
    
    This includes depth level to show the nesting structure.
    
    Args:
        urls_with_depth: List of tuples (url, title, depth) where depth is nesting level
        main_url: Main documentation URL
        
    Returns:
        List of Topic objects with depth information
    """
    topics = []
    seen_urls = set()  # Track URLs to avoid duplicates
    
    for url, extracted_title, depth in urls_with_depth:
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
        
        # Add depth prefix to show nesting level
        description = f"[Level {depth}] Documentation page: {title}"
        
        topic = Topic(
            id=topic_id,
            title=title,
            url=url,
            description=description,
            section=section,
            depth=depth
        )
        topics.append(topic)
    
    # Sort by depth first, then by URL (to show hierarchical structure)
    topics.sort(key=lambda t: (t.depth, t.url))
    
    return topics


def _organize_urls_to_topics(urls_with_titles: List[tuple[str, str]], main_url: str) -> List[Topic]:
    """
    DEPRECATED: Use _organize_urls_to_topics_with_depth instead.
    
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
            section=section,
            depth=0
        )
        topics.append(topic)
    
    return topics
