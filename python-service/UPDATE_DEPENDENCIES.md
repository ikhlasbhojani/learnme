# Update Dependencies to Latest 2025 Versions

This guide shows how to update all dependencies to their latest 2025 versions using UV.

## Quick Update (All Dependencies)

```bash
cd python-service

# Update all dependencies to latest versions
uv sync --upgrade

# Or update specific packages
uv add --upgrade fastapi uvicorn pydantic openai openai-agents
```

## Step-by-Step Update Commands

### 1. Update UV itself (if needed)
```bash
pip install --upgrade uv
# or
uv self update
```

### 2. Update Core Dependencies

```bash
cd python-service

# Update FastAPI and Uvicorn
uv add --upgrade fastapi uvicorn[standard]

# Update Pydantic
uv add --upgrade pydantic pydantic-settings

# Update OpenAI packages
uv add --upgrade openai openai-agents

# Update HTTP client
uv add --upgrade httpx

# Update MongoDB drivers
uv add --upgrade motor pymongo

# Update other dependencies
uv add --upgrade python-jose[cryptography] passlib[bcrypt] python-multipart
uv add --upgrade beautifulsoup4 lxml python-dotenv
```

### 3. Update Dev Dependencies

```bash
uv add --dev --upgrade black ruff pytest pytest-asyncio
```

### 4. Update All at Once

```bash
# This will update all packages in pyproject.toml to latest compatible versions
uv sync --upgrade
```

### 5. Check for Outdated Packages

```bash
# List all packages and their versions
uv pip list

# Check which packages can be updated
uv pip list --outdated
```

## Update Specific Package to Latest

```bash
# Update a single package
uv add --upgrade package-name

# Examples:
uv add --upgrade fastapi
uv add --upgrade openai-agents
uv add --upgrade pydantic
```

## Verify Updates

```bash
# Show all installed packages
uv pip list

# Show package versions
uv pip show package-name
```

## Lock File

After updating, the `uv.lock` file will be automatically updated:

```bash
# Manually update lock file
uv lock

# Sync with updated lock file
uv sync
```

## Current Latest Versions (2025)

- **fastapi**: >=0.116.0
- **uvicorn[standard]**: >=0.34.0
- **pydantic**: >=2.10.4
- **pydantic-settings**: >=2.6.1
- **openai**: >=1.58.0
- **openai-agents**: >=0.5.0
- **httpx**: >=0.28.1
- **motor**: >=3.6.1
- **pymongo**: >=4.10.1
- **black**: >=24.12.0
- **ruff**: >=0.8.4
- **pytest**: >=8.3.4

## Troubleshooting

If you encounter dependency conflicts:

```bash
# Resolve conflicts
uv sync --resolution=highest

# Or use specific versions
uv add package-name==x.y.z
```

## Notes

- `uv sync --upgrade` updates all packages to latest compatible versions
- `uv add --upgrade` updates specific packages
- The `uv.lock` file ensures reproducible builds
- Always test after updating dependencies

