"""
Main entry point for the FastAPI application.
"""
import uvicorn
from app.core.app import app
from app.config.settings import settings


def main():
    """Run the FastAPI application."""
    uvicorn.run(
        "app.core.app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    )


if __name__ == "__main__":
    main()
