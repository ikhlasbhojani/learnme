# Python Backend - LearnMe AI Service

FastAPI-based Python backend service for AI-powered quiz generation and content extraction.

## 📋 Overview

Yeh Python backend service LearnMe application ke liye AI operations handle karta hai:
- Topic extraction from documentation URLs
- Content extraction and cleaning
- Quiz question generation
- Quiz performance analysis

## 🛠️ Technology Stack

- **Framework**: FastAPI
- **Python Version**: 3.13+ (managed by uv)
- **Package Manager**: [uv](https://docs.astral.sh/uv/) - Fast Python package installer and resolver
- **AI SDK**: OpenAI Agents SDK (with Gemini API)
- **HTTP Client**: httpx
- **HTML Parsing**: beautifulsoup4

## 📦 Project Management with uv

Yeh project **uv** use karta hai for Python version management aur package installation.

### uv Installation

uv install karne ke liye, refer to: [uv Installation Guide](https://docs.astral.sh/uv/)

### Python Version Management

uv automatically Python versions manage karta hai. Python install karne ke liye:

```bash
# Latest Python version install karein
uv python install

# Specific version install karein
uv python install 3.13

# Multiple versions install karein
uv python install 3.12 3.13
```

**Important**: Sabhi Python-related commands uv ke documentation ko follow karengi. Detailed documentation: [uv Python Installation Guide](https://docs.astral.sh/uv/guides/install-python/)

### uv Features

- **Automatic Python Downloads**: uv automatically missing Python versions download karta hai
- **Version Management**: Multiple Python versions manage kar sakte hain
- **Fast Package Installation**: uv is significantly faster than pip
- **Project Management**: Dependencies aur virtual environments manage karta hai

### Common uv Commands

```bash
# Python version list karein
uv python list

# Virtual environment create karein
uv venv

# Dependencies install karein
uv pip install -r requirements.txt

# Project run karein
uv run python main.py
```

## 📁 Project Structure

```
python-backend/
├── app/
│   ├── api/                    # API Routes
│   │   ├── content/           # Content extraction routes
│   │   └── quiz/              # Quiz generation & analysis routes
│   ├── services/               # Business Logic
│   │   ├── ai/                # AI provider services
│   │   ├── content/            # Content extraction services
│   │   └── quiz/              # Quiz services
│   ├── models/                # Pydantic Models/Schemas
│   ├── utils/                 # Utility Functions
│   ├── config/                # Configuration
│   └── core/                  # Core Settings
├── main.py                    # Entry point
└── pyproject.toml             # Project config
```

## 🔧 Setup Instructions

1. **uv Install karein** (if not already installed):
   - Follow: [uv Installation Guide](https://docs.astral.sh/uv/)

2. **Python Version Install karein**:
   ```bash
   uv python install 3.13
   ```

3. **Virtual Environment Create karein**:
   ```bash
   uv venv
   ```

4. **Dependencies Install karein**:
   ```bash
   uv pip install -r requirements.txt
   ```

5. **Environment Variables Setup karein**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

6. **Server Start karein**:
   ```bash
   uv run uvicorn app.core.app:app --reload --host 0.0.0.0 --port 8000
   ```
   
   Ya phir:
   ```bash
   uv run python main.py
   ```

## 🌐 API Endpoints

Base URL: `http://localhost:8000/api/ai`

### Content APIs
- `POST /api/ai/content/extract-topics` - Extract topics from documentation URL
- `POST /api/ai/content/extract` - Extract content from single URL

### Quiz APIs
- `POST /api/ai/quiz/generate-from-url` - Generate quiz from selected topics/URLs
- `POST /api/ai/quiz/generate-from-document` - Generate quiz from document text
- `POST /api/ai/quiz/analyze` - Analyze completed quiz

## 📚 Documentation

- **API Requirements**: See `python_api_requirements.md` in project root
- **Agent Design**: See `app/services/ai/AGENTS_DESIGN.md`
- **URL Extraction Tool**: See `app/services/ai/URL_EXTRACTION_TOOL.md`
- **uv Documentation**: [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)
- **Python Installation with uv**: [https://docs.astral.sh/uv/guides/install-python/](https://docs.astral.sh/uv/guides/install-python/)
- **OpenAI Agents SDK Tools**: [https://openai.github.io/openai-agents-python/tools/](https://openai.github.io/openai-agents-python/tools/)
- **Tool Context**: [https://openai.github.io/openai-agents-python/ref/tool_context/](https://openai.github.io/openai-agents-python/ref/tool_context/)

## 🔑 Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
PYTHON_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

## 🚀 Development

Development mode me run karne ke liye:

```bash
uv run uvicorn app.core.app:app --reload --host 0.0.0.0 --port 8000
```

Ya phir:

```bash
uv run python main.py
```

## 📝 Notes

- **uv Required**: Yeh project uv use karta hai, isliye sabhi commands uv ke documentation ke mutabik hongi
- **Python Version**: uv automatically Python versions manage karta hai
- **Fast Installation**: uv pip se significantly faster hai
- **Automatic Downloads**: uv missing Python versions automatically download karta hai

## 🔧 Tools & Agents

### URL Extraction Tool

Yeh project me ek **function tool** hai jo agent call karega URLs extract karne ke liye:

- **Tool Name**: `extract_urls_from_documentation`
- **Purpose**: HTML se links extract karna, filter karna, aur organized topics return karna
- **Context**: `ToolContext` use karke userId aur configuration pass hoti hai
- **Output**: JSON format me organized topics

**Reference Documentation**:
- [Tools Documentation](https://openai.github.io/openai-agents-python/tools/)
- [Tool Context Documentation](https://openai.github.io/openai-agents-python/ref/tool_context/)

**Tool Features**:
- HTML fetching with httpx
- Link extraction with BeautifulSoup
- Smart link filtering (same domain, valid pages only)
- Basic topic organization
- JSON output format

Detailed implementation: See `app/services/ai/URL_EXTRACTION_TOOL.md`

## 🔗 Useful Links

- [uv Documentation](https://docs.astral.sh/uv/)
- [uv Python Installation Guide](https://docs.astral.sh/uv/guides/install-python/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI Agents SDK](https://github.com/openai/agents)
- [OpenAI Agents SDK Tools](https://openai.github.io/openai-agents-python/tools/)
- [Tool Context Reference](https://openai.github.io/openai-agents-python/ref/tool_context/)

