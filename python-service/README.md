# LearnMe Python Service

Python service for AI agents and quiz management using **OpenAI Agents SDK** (official OpenAI Agents framework). This service handles:
- Quiz generation using AI agents
- Quiz analysis using AI agents
- Content extraction from URLs/documents

## Setup

### Prerequisites

Install the latest version of `uv` (2025):
```bash
# On Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or using pip:
```bash
pip install --upgrade uv
```

Verify installation:
```bash
uv --version
```

### Installation

1. **Install dependencies with uv:**
```bash
uv sync
```

This will:
- Create a virtual environment automatically (`.venv/`)
- Install all dependencies from `pyproject.toml`
- Generate `uv.lock` file for reproducible builds

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
# IMPORTANT: Set your OpenAI API key in .env file:
#   OPENAI_API_KEY=sk-your-key-here
#   OR
#   AI_API_KEY=sk-your-key-here
#   (Both work - OPENAI_API_KEY is preferred)
```

3. **Run the service:**
```bash
# Using uv run (recommended - automatically uses .venv)
uv run uvicorn app.main:app --reload --port 8000

# Or activate the environment first
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Common UV Commands

```bash
# Install/update dependencies
uv sync

# Add a new dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Remove a dependency
uv remove package-name

# Update all dependencies
uv sync --upgrade

# Run a command in the environment
uv run python script.py
uv run pytest
uv run black .

# Run with specific Python version
uv run --python 3.11 python script.py

# Show installed packages
uv pip list

# Lock dependencies (updates uv.lock)
uv lock
```

### Using uvx (for one-off scripts)

```bash
# Run a tool without installing globally
uvx black .
uvx pytest
uvx ruff check .
```

## Environment Variables

Create a `.env` file in the `python-service` directory with:

- `OPENAI_API_KEY` (required): Your OpenAI API key - **This is what the Agents SDK uses**
  - Alternative: You can also use `AI_API_KEY` (will be mapped to `OPENAI_API_KEY`)
- `AI_MODEL`: AI model name (default: gpt-4o-mini)
  - Options: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`, etc.
- `PORT`: Server port (default: 8000)
- `CORS_ORIGIN`: Frontend origin (default: http://localhost:5173)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret (must match TypeScript backend)
- `AI_PROVIDER`: AI provider (default: openai)
- `AI_BASE_URL`: Optional custom base URL for AI provider

**Important**: The OpenAI Agents SDK reads the API key from the `OPENAI_API_KEY` environment variable. The settings automatically map `AI_API_KEY` to `OPENAI_API_KEY` if provided.

## API Endpoints

### Quiz Generation
- `POST /api/quiz/generation/from-url` - Generate quiz from URL(s)
- `POST /api/quiz/generation/from-document` - Generate quiz from document

### Quiz Analysis
- `POST /api/quiz/analysis/` - Analyze quiz performance

### Health
- `GET /health` - Service health check

## Architecture

- **Agents**: AI agents using OpenAI Agents SDK
  - **ContentExtractionAgent**: Extracts content from URLs/documents
  - **QuizGenerationAgent**: Generates quiz questions with code detection tools
  - **OrchestratorAgent**: Coordinates extraction + generation
  - **QuizAnalysisAgent**: Analyzes quiz performance with stats tools
- **Services**: Business logic for quiz operations
- **Routers**: FastAPI routes for API endpoints
- **Config**: Settings and database configuration

## OpenAI Agents SDK (Latest 2025)

The agents use the official OpenAI Agents SDK (v0.5.0+) following the [official documentation](https://openai.github.io/openai-agents-python/):

### Key Components:
- **Agent**: Core agent class with `name`, `instructions`, `tools`, and `model`
- **Runner**: Executes agents with `Runner.run()` (async) or `Runner.run_sync()` (sync)
- **function_tool**: Decorator for defining agent tools
- **Result**: Agent results accessed via `result.final_output`

### Usage Pattern:
```python
from agents import Agent, Runner, function_tool

@function_tool
def my_tool(input: str) -> str:
    """Tool description."""
    return f"Processed: {input}"

agent = Agent(
    name="MyAgent",
    instructions="You are a helpful assistant.",
    tools=[my_tool],
    model="gpt-4o-mini"
)

result = await Runner.run(agent, "Hello!")
print(result.final_output)
```

### Key Features:
- Tools are defined with `@function_tool` decorator
- Agents can call tools during conversation automatically
- Tool results are automatically fed back to the agent
- Multi-turn conversations with tool execution
- Built-in support for handoffs, guardrails, and tracing
- Latest 2025 SDK features and improvements

### Package Versions (2025):
- `openai-agents>=0.5.0` - Latest OpenAI Agents SDK
- `openai>=1.57.0` - Latest OpenAI Python SDK
- All dependencies use latest 2025 versions

## Integration with TypeScript Backend

The TypeScript backend can call this service via HTTP:

```typescript
const response = await fetch('http://localhost:8000/api/quiz/generation/from-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    url: 'https://example.com/article',
    difficulty: 'medium',
    numberOfQuestions: 10
  })
})
```

## Development

### Code Formatting
```bash
uv run black .
uv run ruff check .
uv run ruff format .
```

### Running Tests
```bash
uv run pytest
```

### Project Structure
```
python-service/
├── app/
│   ├── main.py              # FastAPI app
│   ├── agents/              # AI agents
│   │   ├── base_agent.py    # Base agent using OpenAI Agents SDK
│   │   ├── content_extraction_agent.py
│   │   ├── quiz_generation_agent.py
│   │   ├── quiz_analysis_agent.py
│   │   └── orchestrator_agent.py
│   ├── config/              # Settings & database
│   ├── modules/              # Business logic modules
│   └── services/            # Shared services
├── pyproject.toml           # UV project config
├── uv.lock                  # Locked dependencies (generated)
└── README.md
```

## References

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [UV Package Manager](https://github.com/astral-sh/uv)
