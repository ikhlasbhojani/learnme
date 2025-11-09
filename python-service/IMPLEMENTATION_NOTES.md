# OpenAI Agents SDK Implementation Notes

This document describes how the OpenAI Agents SDK is properly implemented according to the [official documentation](https://openai.github.io/openai-agents-python/).

## Correct SDK Usage

### 1. Imports
```python
from agents import Agent, Runner, function_tool
```

### 2. Creating Agents
```python
agent = Agent(
    name="AgentName",
    instructions="Agent instructions...",
    tools=[tool1, tool2],  # Optional
    model="gpt-4o-mini"    # Optional, defaults to SDK default
)
```

**Note**: The SDK does NOT use `ModelSettings` - that was incorrect. The Agent constructor accepts:
- `name` (required)
- `instructions` (required)
- `tools` (optional list)
- `model` (optional string)

### 3. Running Agents
```python
# Async (recommended)
result = await Runner.run(agent, "User input")
output = result.final_output

# Sync (alternative)
result = Runner.run_sync(agent, "User input")
output = result.final_output
```

### 4. Creating Tools
```python
@function_tool
def my_tool(param: str) -> str:
    """Tool description for the agent."""
    return f"Processed: {param}"
```

### 5. API Key Configuration
The SDK reads from the `OPENAI_API_KEY` environment variable automatically. We set this in `settings.py`:
```python
os.environ["OPENAI_API_KEY"] = self.ai_api_key
```

## Implementation Details

### BaseAgent Class
- Uses `Agent()` constructor without `ModelSettings`
- Uses `Runner.run()` for async execution
- Accesses results via `result.final_output`
- Properly handles tool definitions with `@function_tool`

### All Agents Follow This Pattern:
1. Define tools with `@function_tool` decorator
2. Create agent with `Agent(name, instructions, tools, model)`
3. Run with `await Runner.run(agent, input)`
4. Extract result with `result.final_output`

## Package Versions

- `openai-agents>=0.5.0` - Latest 2025 version
- `openai>=1.57.0` - Latest OpenAI SDK
- All dependencies use latest 2025 versions

## References

- [Official Documentation](https://openai.github.io/openai-agents-python/)
- [Hello World Example](https://openai.github.io/openai-agents-python/#hello-world-example)
- [Agents API Reference](https://openai.github.io/openai-agents-python/api/agents/)

