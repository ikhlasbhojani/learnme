"""Browser service for SPA-aware URL extraction."""

from app.services.browser.browser_service import (
    BrowserService,
    get_browser_service,
    cleanup_browser_service,
)

__all__ = [
    'BrowserService',
    'get_browser_service',
    'cleanup_browser_service',
]

