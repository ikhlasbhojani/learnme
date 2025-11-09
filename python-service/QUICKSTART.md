# Quick Start Guide

## First Time Setup

1. **Install Latest UV (2025):**
```bash
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or upgrade existing installation
pip install --upgrade uv

# Verify
uv --version
```

2. **Install dependencies:**
```bash
cd python-service
uv sync
```

This will:
- Create `.venv/` automatically
- Install all latest 2025 package versions
- Generate `uv.lock` for reproducible builds

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. **Run the service:**
```bash
uv run uvicorn app.main:app --reload --port 8000
```

## Daily Development

```bash
# Start the service
uv run uvicorn app.main:app --reload --port 8000

# Or use the run script
uv run python run.py
```

## Managing Dependencies

```bash
# Add a package (latest version)
uv add package-name

# Add a specific version
uv add package-name==1.2.3

# Add a dev package
uv add --dev package-name

# Remove a package
uv remove package-name

# Update all dependencies to latest
uv sync --upgrade

# Update specific package
uv add package-name@latest
```

## Running Commands

```bash
# Run any Python command
uv run python script.py

# Run tests
uv run pytest

# Format code
uv run black .

# Lint code
uv run ruff check .

# Type check (if mypy is added)
uv run mypy app/
```

## Using uvx (for one-off tools)

```bash
# Run tools without installing globally
uvx black .
uvx pytest
uvx ruff check .
uvx mypy app/
```

## Package Versions

This project uses the latest 2025 versions:
- **OpenAI Agents SDK**: >=0.5.0
- **OpenAI SDK**: >=1.57.0
- **FastAPI**: >=0.115.6
- **UV**: Latest (installed separately)

To check installed versions:
```bash
uv pip list
```
