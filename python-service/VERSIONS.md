# Package Versions (2025)

This document tracks the latest package versions used in this project as of 2025.

## Core Dependencies

### AI & Agents
- **openai-agents**: `>=0.5.0` - Latest OpenAI Agents SDK (2025)
- **openai**: `>=1.57.0` - Latest OpenAI Python SDK (2025)

### Web Framework
- **fastapi**: `>=0.115.6` - Latest FastAPI (2025)
- **uvicorn[standard]**: `>=0.32.1` - Latest Uvicorn with standard extras

### Database
- **motor**: `>=3.6.1` - Async MongoDB driver
- **pymongo**: `>=4.10.1` - MongoDB Python driver

### Data Validation
- **pydantic**: `>=2.10.4` - Latest Pydantic v2 (2025)
- **pydantic-settings**: `>=2.6.1` - Settings management

### Authentication
- **python-jose[cryptography]**: `>=3.3.0` - JWT handling
- **passlib[bcrypt]**: `>=1.7.4` - Password hashing

### HTTP & Web Scraping
- **httpx**: `>=0.28.1` - Async HTTP client (2025)
- **beautifulsoup4**: `>=4.12.3` - HTML parsing
- **lxml**: `>=5.3.0` - XML/HTML parser

### Utilities
- **python-multipart**: `>=0.0.20` - Form data parsing
- **python-dotenv**: `>=1.0.1` - Environment variables

## Development Dependencies

- **black**: `>=24.11.0` - Code formatter (2025)
- **ruff**: `>=0.8.4` - Fast linter (2025)
- **pytest**: `>=8.3.4` - Testing framework (2025)
- **pytest-asyncio**: `>=0.24.0` - Async test support (2025)

## Build System

- **hatchling**: `>=1.25.1` - Modern build backend

## Package Manager

- **uv**: Latest (installed separately) - Fast Python package manager (2025)

## Updating Versions

To update to the latest versions:

```bash
# Update all dependencies
uv sync --upgrade

# Update specific package
uv add package-name@latest

# Check for outdated packages
uv pip list --outdated
```

## Version Pinning

This project uses minimum version constraints (`>=`) to allow flexibility while ensuring compatibility. For production deployments, consider using `uv lock` to generate a `uv.lock` file with exact versions.

