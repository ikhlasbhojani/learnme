"""
Browser-based URL extraction service for handling SPA documentation sites.

This service uses Playwright to render pages in a headless browser, enabling
extraction of content from single-page applications where navigation links
don't correspond to actual server routes.
"""

import asyncio
import re
import sys
from typing import List, Tuple, Dict, Set
from urllib.parse import urlparse, urljoin
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import threading

from playwright.sync_api import sync_playwright, Page as SyncPage, Browser as SyncBrowser, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
import httpx

from app.services.ai.tools.url_extraction import (
    URLExtractionContext,
    SkippedLink,
)


class BrowserService:
    """Service for browser-based URL extraction and validation using sync API in thread pool."""
    
    def __init__(self):
        self._browser: SyncBrowser | None = None
        self._playwright = None
        self._executor = ThreadPoolExecutor(max_workers=1)
        self._lock = threading.Lock()
        
    async def __aenter__(self):
        """Context manager entry."""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.close()
    
    async def initialize(self):
        """Initialize browser instance in a separate thread (Windows-compatible)."""
        if not self._playwright:
            try:
                # Run synchronous playwright in thread pool to avoid Windows subprocess issues
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(self._executor, self._init_browser_sync)
                print("Browser initialized successfully (sync mode)")
            except Exception as e:
                print(f"WARNING: Failed to initialize browser: {e}")
                print("WARNING: Browser mode will not be available. Falling back to HTTP mode.")
                raise
    
    def _init_browser_sync(self):
        """Synchronous browser initialization (runs in thread pool)."""
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(
            headless=True,
            args=['--disable-dev-shm-usage', '--no-sandbox']
        )
    
    async def close(self):
        """Close browser instance."""
        if self._browser or self._playwright:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(self._executor, self._close_browser_sync)
        self._executor.shutdown(wait=False)
    
    def _close_browser_sync(self):
        """Synchronous browser cleanup (runs in thread pool)."""
        if self._browser:
            self._browser.close()
            self._browser = None
        if self._playwright:
            self._playwright.stop()
            self._playwright = None
    
    async def is_browser_available(self) -> bool:
        """Check if browser is available and initialized."""
        try:
            if not self._browser:
                await self.initialize()
            return self._browser is not None
        except Exception:
            return False
    
    async def detect_spa_architecture(self, url: str, timeout: int = 30) -> bool:
        """
        Detect if a documentation site uses SPA architecture.
        
        Indicators:
        1. Framework indicators: React, Vue, Angular, Next.js
        2. Client-side routing patterns
        3. Navigation links that don't work via direct HTTP
        
        Args:
            url: The URL to check
            timeout: Request timeout in seconds
            
        Returns:
            True if SPA detected, False otherwise
        """
        try:
            # Fetch HTML content
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url, follow_redirects=True)
                html = response.text
            
            # Check for framework indicators
            spa_indicators = [
                # React
                r'react',
                r'_next',
                r'__NEXT_DATA__',
                # Vue
                r'vue',
                r'v-app',
                # Angular
                r'ng-app',
                r'angular',
                # Docusaurus (common for docs)
                r'docusaurus',
                r'data-theme=',
                # General SPA indicators
                r'<div id="root"',
                r'<div id="app"',
                r'<div id="__docusaurus"',
                r'<script.*type="module"',
                # Bundlers
                r'webpack',
                r'vite',
            ]
            
            html_lower = html.lower()
            for indicator in spa_indicators:
                if re.search(indicator, html_lower):
                    print(f"SPA indicator found: {indicator}")
                    return True
            
            # Check if main URL returns 500 error (common for SPA internal routes)
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(url, follow_redirects=True)
                    if response.status_code == 500:
                        print(f"Main URL returns 500 - likely SPA with client-side routing")
                        return True
            except Exception:
                pass
            
            # Check if navigation links work via HTTP
            soup = BeautifulSoup(html, 'html.parser')
            nav_links = soup.select('nav a[href], aside a[href], .sidebar a[href]')
            
            if len(nav_links) > 3:
                # Test a few navigation links
                test_links = [urljoin(url, link.get('href', '')) for link in nav_links[:3]]
                
                async with httpx.AsyncClient(timeout=10) as client:
                    for link in test_links:
                        if link != url:  # Don't test the same URL
                            try:
                                response = await client.head(link, follow_redirects=True)
                                if response.status_code >= 400:
                                    print(f"Navigation link returns {response.status_code}: {link}")
                                    return True  # Links don't work directly = likely SPA
                            except Exception:
                                continue
            
            return False
            
        except Exception as e:
            print(f"WARNING: SPA detection error: {e}")
            return False  # Default to HTTP mode on error
    
    async def extract_urls_with_browser(
        self,
        main_url: str,
        context: URLExtractionContext
    ) -> Tuple[List[Tuple[str, str, int]], List[SkippedLink], List[SkippedLink], int]:
        """Async wrapper that runs sync browser extraction in thread pool."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self._extract_urls_sync,
            main_url,
            context
        )
    
    def _extract_urls_sync(
        self,
        main_url: str,
        context: URLExtractionContext
    ) -> Tuple[List[Tuple[str, str, int]], List[SkippedLink], List[SkippedLink], int]:
        """
        Extract URLs using sync headless browser for SPA support (Windows-compatible).
        
        Args:
            main_url: The main documentation URL
            context: Extraction context with configuration
            
        Returns:
            Tuple of (urls_with_titles_and_depth, skipped_links, unverified_links, total_found)
        """
        all_urls_with_depth: List[Tuple[str, str, int]] = []
        skipped_links: List[SkippedLink] = []
        unverified_links: List[SkippedLink] = []
        
        page = self._browser.new_page()
        
        try:
            print(f"Loading page in browser: {main_url}")
            
            # Navigate to main URL (SYNC API)
            page.goto(
                main_url,
                wait_until="networkidle",
                timeout=context.timeout * 1000
            )
            
            # Wait for navigation to render (SPA needs time)
            page.wait_for_timeout((context.wait_for_navigation if hasattr(context, 'wait_for_navigation') else 3) * 1000)
            
            # Extract all navigation links from the rendered page
            print("Extracting navigation links from rendered page...")
            
            nav_links = page.evaluate("""
                () => {
                    const links = [];
                    const seen = new Set();
                    
                    // Comprehensive selectors for different documentation site structures
                    const selectors = [
                        // Standard navigation
                        'nav a[href]',
                        'aside a[href]',
                        '.sidebar a[href]',
                        '[class*="nav"] a[href]',
                        '[class*="menu"] a[href]',
                        '[class*="toc"] a[href]',
                        '[class*="table-of-contents"] a[href]',
                        // Next.js/React docs specific
                        '[data-sidebar] a[href]',
                        '[role="navigation"] a[href]',
                        '[aria-label*="navigation"] a[href]',
                        '[aria-label*="menu"] a[href]',
                        // Common doc site patterns
                        'ul[class*="nav"] a[href]',
                        'ul[class*="menu"] a[href]',
                        'div[class*="sidebar"] a[href]',
                        'div[class*="nav"] a[href]',
                        // MDX/Nextra style
                        'nav > ul a[href]',
                        'aside > ul a[href]',
                        // Generic fallback - all links in sidebar-like containers
                        'aside a[href]',
                        'nav a[href]'
                    ];
                    
                    // Try each selector
                    selectors.forEach(selector => {
                        try {
                            document.querySelectorAll(selector).forEach(el => {
                                const href = el.href;
                                let text = el.innerText.trim();
                                
                                // If link is a hash fragment and has no/empty text, try to get heading text
                                if (href && href.includes('#') && (!text || text.length < 2)) {
                                    const hashId = href.split('#')[1];
                                    if (hashId) {
                                        // Try to find the heading with this ID
                                        const heading = document.getElementById(hashId);
                                        if (heading) {
                                            text = heading.innerText.trim();
                                        }
                                    }
                                }
                                
                                if (href && !seen.has(href)) {
                                    seen.add(href);
                                    links.push({ href, text: text || 'Untitled' });
                                }
                            });
                        } catch (e) {
                            // Ignore selector errors
                        }
                    });
                    
                    // Also try to find all links and filter by location (left sidebar)
                    // This is a fallback if specific selectors don't work
                    if (links.length < 5) {
                        const allLinks = document.querySelectorAll('a[href]');
                        allLinks.forEach(el => {
                            const rect = el.getBoundingClientRect();
                            const href = el.href;
                            let text = el.innerText.trim();
                            
                            // If link is a hash fragment and has no/empty text, try to get heading text
                            if (href && href.includes('#') && (!text || text.length < 2)) {
                                const hashId = href.split('#')[1];
                                if (hashId) {
                                    const heading = document.getElementById(hashId);
                                    if (heading) {
                                        text = heading.innerText.trim();
                                    }
                                }
                            }
                            
                            // If link is in left 30% of screen (likely sidebar)
                            if (rect.left < window.innerWidth * 0.3 && 
                                href && 
                                !seen.has(href) &&
                                href.includes(window.location.hostname)) {
                                seen.add(href);
                                links.push({ href, text: text || 'Untitled' });
                            }
                        });
                    }
                    
                    return links;
                }
            """)
            
            visited: Set[str] = set()
            total_links_found = len(nav_links)
            
            print(f"Found {total_links_found} navigation links")
            
            # Limit URLs to process
            max_urls = context.max_urls_per_level if hasattr(context, 'max_urls_per_level') else 200
            nav_links_to_process = nav_links[:max_urls]
            
            if len(nav_links) > max_urls:
                print(f"WARNING: Limited to first {max_urls} URLs (found {len(nav_links)} total)")
            
            # Extract links without validation (they're from rendered page, so they exist)
            # Browser validation is too slow (2+ minutes for 72 URLs)
            for idx, link_data in enumerate(nav_links_to_process, 1):
                href = link_data['href']
                text = link_data['text']
                
                if href in visited:
                    continue
                
                visited.add(href)
                title = text or "Untitled"
                all_urls_with_depth.append((href, title, 1))
                
                if idx % 10 == 0:  # Progress every 10 links
                    print(f"Extracted {idx}/{len(nav_links_to_process)} links...")
            
            print(f"\nBrowser extraction complete:")
            print(f"  Valid URLs: {len(all_urls_with_depth)}")
            print(f"  Skipped URLs: {len(skipped_links)}")
            
            return all_urls_with_depth, skipped_links, unverified_links, total_links_found
            
        finally:
            page.close()
    
    def _validate_url_in_browser_sync(
        self,
        page: SyncPage,
        url: str,
        context: URLExtractionContext
    ) -> Tuple[bool, str | None, str | None, int | None]:
        """
        Navigate to URL in browser and validate it's not a 404 (SYNC version for Windows).
        
        Args:
            page: Playwright page instance (sync)
            url: URL to validate
            context: Extraction context
            
        Returns:
            Tuple of (is_valid, page_title, error_reason, status_code)
        """
        import time
        
        max_retries = context.max_retries if hasattr(context, 'max_retries') else 2
        browser_timeout = context.browser_timeout if hasattr(context, 'browser_timeout') else 30
        
        for attempt in range(max_retries + 1):
            try:
                # Navigate to URL (SYNC)
                response = page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=browser_timeout * 1000
                )
                
                # Check HTTP status
                status_code = response.status if response else None
                if status_code and status_code >= 400:
                    if attempt < max_retries:
                        time.sleep(0.5 * (attempt + 1))
                        continue
                    return False, None, f"HTTP {status_code}", status_code
                
                # Wait a bit for content to load
                page.wait_for_timeout(1000)
                
                # Get page title
                page_title = page.title()
                
                # Check for 404 indicators in title
                title_lower = page_title.lower()
                not_found_indicators = ['404', 'not found', 'page not found', 'does not exist']
                
                if any(indicator in title_lower for indicator in not_found_indicators):
                    return False, page_title, "404 indicator in title", status_code
                
                # Check for 404 indicators in page content
                body_text = page.inner_text('body')
                body_text_lower = body_text.lower()
                body_preview = body_text_lower[:1000]  # First 1KB
                
                # Common 404 patterns
                if '404' in body_preview and 'not found' in body_preview:
                    return False, page_title, "404 indicator in content", status_code
                
                # Check if page has substantial content (not just error page)
                if len(body_text.strip()) < 100:
                    return False, page_title, "Insufficient content", status_code
                
                # Valid page with content
                return True, page_title, None, status_code
                
            except PlaywrightTimeout:
                if attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                return False, None, "Navigation timeout", None
            
            except Exception as e:
                if attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                return False, None, f"Error: {str(e)}", None
        
        return False, None, "Unknown error", None


# Global browser service instance
_browser_service: BrowserService | None = None


async def get_browser_service() -> BrowserService:
    """Get or create global browser service instance."""
    global _browser_service
    if _browser_service is None:
        _browser_service = BrowserService()
        await _browser_service.initialize()
    return _browser_service


async def cleanup_browser_service():
    """Cleanup global browser service instance."""
    global _browser_service
    if _browser_service:
        await _browser_service.close()
        _browser_service = None

