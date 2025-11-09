.PHONY: install dev run test clean update upgrade check-versions

# Install dependencies (latest 2025 versions)
install:
	uv sync

# Install with dev dependencies
dev:
	uv sync --dev

# Run the service
run:
	uv run uvicorn app.main:app --reload --port 8000

# Run tests
test:
	uv run pytest

# Update all dependencies to latest
update:
	uv sync --upgrade

# Upgrade UV itself
upgrade-uv:
	pip install --upgrade uv

# Check for outdated packages
check-versions:
	uv pip list --outdated

# Clean build artifacts
clean:
	rm -rf __pycache__/
	rm -rf .pytest_cache/
	rm -rf dist/
	rm -rf build/
	find . -type d -name "*.egg-info" -exec rm -rf {} +

