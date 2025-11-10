# AI Agents Design & Structure

## Overview

Yeh document Python backend me use hone wale sabhi AI agents ki design aur structure define karta hai. Har agent OpenAI Agents SDK use karega aur Gemini API ke through kaam karega.

---

## 🔧 Common Setup

Sabhi agents ke liye common Gemini API configuration:

```python
from agents import Agent, Runner, AsyncOpenAI, set_default_openai_client, set_tracing_disabled, set_default_openai_api
from agents.agent_output import AgentOutputSchema
import os
from typing import List, Dict, Optional
from pydantic import BaseModel

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Disable tracing for production
set_tracing_disabled(True)

# Set default OpenAI API format (Gemini uses OpenAI-compatible format)
set_default_openai_api("chat_completions")

# Create Gemini client
external_client = AsyncOpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

# Set as default client
set_default_openai_client(external_client)

# Default model for all agents
DEFAULT_MODEL = "gemini-2.0-flash"
```

## 📤 Agent Output Schema

Sabhi agents **structured output** ke liye `AgentOutputSchema` use karte hain. Yeh ensure karta hai ki:
- Output format consistent rahe
- JSON validation automatically ho
- Type safety maintain rahe

**Reference**: [AgentOutputSchema Documentation](https://openai.github.io/openai-agents-python/ref/agent_output/#agents.agent_output.AgentOutputSchema.output_type)

### Usage Pattern

```python
from agents.agent_output import AgentOutputSchema
from pydantic import BaseModel

# Define output model
class MyOutput(BaseModel):
    field1: str
    field2: int

# Create output schema
output_schema = AgentOutputSchema(output_type=MyOutput)

# Use in agent
agent = Agent(
    name="My Agent",
    instructions="...",
    model="gemini-2.0-flash",
    output_schema=output_schema  # Structured output
)
```

---

## 📋 Agents List

1. **TopicOrganizationAgent** - Documentation URLs ko topics/sections me organize karta hai
2. **ContentExtractionAgent** - URLs se content extract aur clean karta hai
3. **QuizGenerationAgent** - Content se quiz questions generate karta hai
4. **QuizAnalysisAgent** - Completed quiz ka analysis generate karta hai

---

## 🔄 Agent Workflow

```
User URL → TopicOrganizationAgent → Topics with URLs
Selected Topics → ContentExtractionAgent → Cleaned Content
Cleaned Content → QuizGenerationAgent → Quiz Questions
Quiz + Answers → QuizAnalysisAgent → Performance Analysis
```

---

## 🛠️ Tools

### URL Extraction Tool

**Tool Name**: `extract_urls_from_documentation`

Yeh ek function tool hai jo agent call karega URLs extract karne ke liye. Tool:
- HTML se links extract karta hai
- Links filter karta hai (same domain, valid pages)
- Organized topics return karta hai (JSON format)
- `ToolContext` use karke context receive karta hai

**Reference**:
- [Tools Documentation](https://openai.github.io/openai-agents-python/tools/)
- [Tool Context Documentation](https://openai.github.io/openai-agents-python/ref/tool_context/)

Detailed implementation: See `URL_EXTRACTION_TOOL.md`

## 📝 Agent Details

Har agent ki detailed design alag MD files me:
- `URL_EXTRACTION_TOOL.md` - URL extraction function tool
- `TOPIC_ORGANIZATION_AGENT.md` - Topic extraction agent (uses URL extraction tool)
- `CONTENT_EXTRACTION_AGENT.md` - Content extraction agent
- `QUIZ_GENERATION_AGENT.md` - Quiz generation agent
- `QUIZ_ANALYSIS_AGENT.md` - Quiz analysis agent

