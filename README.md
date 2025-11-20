# 🎓 LearnMe - AI-Powered Learning Platform

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)

**Transform any web content into personalized, AI-generated quizzes**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 📖 Overview

LearnMe is an open-source, AI-powered learning platform that transforms documentation, articles, and web content into interactive quizzes. Built with modern web technologies and powered by cutting-edge AI models (Gemini, OpenAI), LearnMe helps developers and learners test their knowledge and track their progress.

### 🎯 Key Highlights

- ✅ **BYOK (Bring Your Own Key)**: Use your own AI API keys (Gemini/OpenAI) - no vendor lock-in
- 🔒 **Privacy-First**: API keys stored locally in your browser, you control your data
- 🌐 **Smart Content Extraction**: Automatically extracts topics from documentation websites
- 🤖 **AI-Powered**: Generates intelligent quiz questions from any web content
- 📊 **Performance Analytics**: Track your learning progress with detailed insights
- 🎨 **Beautiful UI**: Modern, responsive interface with dark/light mode
- 🚀 **Easy Setup**: Quick local development setup with comprehensive documentation

---

## ✨ Features

### 🎯 Quiz Generation
- **From URLs**: Paste any web link to generate quizzes instantly
- **Topic Selection**: Extract and select specific topics from documentation
- **Customizable Difficulty**: Easy, Medium, or Hard questions
- **Flexible Quiz Size**: 1-100 questions per quiz
- **Timed Quizzes**: Set custom time limits for assessments

### 🤖 AI Integration
- **Multi-Provider Support**: Gemini (free tier available) and OpenAI
- **API Key Validation**: Real-time validation with quota checking
- **Model Selection**: Choose from latest models (GPT-4o, Gemini 2.5, etc.)
- **Custom Endpoints**: Support for custom API base URLs

### 📊 Learning Analytics
- **Performance Tracking**: Detailed quiz history and statistics
- **Progress Insights**: Visual charts and analytics
- **Weak Areas Identification**: AI-powered analysis of your answers
- **Personalized Feedback**: Explanations for correct/incorrect answers

### 🎨 Modern UI/UX
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Dark/Light Mode**: Easy on the eyes, day or night
- **Smooth Animations**: Framer Motion powered transitions
- **Glassmorphism**: Modern, sleek aesthetic
- **Accessible**: WCAG compliant interface

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

> **Note**: Python and uv will be installed automatically during setup!

### Quick Installation (Recommended)

**One-command setup** - Clone, install everything, and you're ready to go:

```bash
git clone https://github.com/ikhlasbhojani/learnme.git && cd learnme && npm run setup
```

This single command will:
- ✅ Check Node.js version
- ✅ Auto-install uv (Python package manager)
- ✅ Auto-install Python 3.13+ (via uv)
- ✅ Install all frontend dependencies
- ✅ Install all Node.js backend dependencies
- ✅ Install all Python dependencies
- ✅ Install Playwright browsers

**Then start all services:**

```bash
npm start
```

**Access the Application:**
- 🎨 Frontend: http://localhost:5173
- 🔧 Node.js API: http://localhost:5000
- 🤖 Python API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

> **Important**: Configure your AI API keys (Gemini/OpenAI) in the frontend on first launch!

---

### Manual Installation (Alternative)

If you prefer manual control:

<details>
<summary>Click to expand manual installation steps</summary>

1. **Clone the repository**
```bash
git clone https://github.com/ikhlasbhojani/learnme.git
cd learnme
```

2. **Install uv (if not already installed)**
```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

3. **Install Frontend**
```bash
cd frontend
npm install
cd ..
```

4. **Install Node.js Backend**
```bash
cd nodejs-backend
npm install
cd ..
```

5. **Install Python Backend**
```bash
cd python-backend
uv sync
uv run playwright install
cd ..
```

6. **Start all services** (from root directory)
```bash
npm start
```

</details>

---

## 🏗️ Architecture

```
LearnMe/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API clients
│   │   ├── hooks/        # Custom React hooks
│   │   └── contexts/     # React contexts
│   └── package.json
│
├── nodejs-backend/        # Express.js + SQLite
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── middlewares/  # Express middleware
│   └── package.json
│
└── python-backend/        # FastAPI + AI Integration
    ├── app/
    │   ├── api/          # API endpoints
    │   ├── services/     # Business logic
    │   │   └── ai/       # AI agents & tools
    │   └── config/       # Configuration
    └── pyproject.toml
```

---

## 📚 Documentation

### For Users
- [Getting Started Guide](docs/getting-started.md)
- [User Manual](docs/user-guide.md)
- [FAQ](docs/faq.md)

### For Developers
- [Backend API Documentation](nodejs-backend/README.md)
- [Python AI Service Documentation](python-backend/README.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [API Reference](docs/api-reference.md)

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context + Hooks
- **Routing**: React Router v6

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT
- **Validation**: Joi
- **HTTP Client**: Axios

### Backend (Python)
- **Framework**: FastAPI
- **AI SDK**: OpenAI Agents SDK
- **HTTP Client**: httpx
- **HTML Parsing**: BeautifulSoup4
- **Browser Automation**: Playwright
- **Package Manager**: uv

---

## 🔧 Troubleshooting

### Setup Issues

**Problem: `npm run setup` fails**
- Ensure Node.js 16+ is installed: `node --version`
- Try running with administrator/sudo privileges
- Check your internet connection
- Clear npm cache: `npm cache clean --force`

**Problem: uv installation fails**
- Install manually: Visit [uv Installation Guide](https://docs.astral.sh/uv/)
- Windows: Use PowerShell as Administrator
- macOS/Linux: Check file permissions in `~/.cargo/bin/`

**Problem: Python dependencies fail to install**
- Ensure uv is in PATH: `uv --version`
- Try manual installation: `cd python-backend && uv sync`
- Check Python version: `uv python list`

**Problem: Playwright installation fails**
- Install manually: `cd python-backend && uv run playwright install`
- May require additional system dependencies on Linux
- Check [Playwright System Requirements](https://playwright.dev/docs/intro)

### Runtime Issues

**Problem: Services won't start**
- Check if ports are already in use (5173, 5000, 8000)
- Check logs for specific error messages
- Ensure all dependencies are installed

**Problem: Database errors**
- SQLite database will be created automatically
- Check write permissions in project directory
- Delete and recreate database if corrupted

**Problem: AI API errors**
- Verify API keys are entered in the frontend settings
- Check API key validity and quota
- Ensure correct model names are selected

### Common Commands

```bash
# Reinstall all dependencies
npm run setup

# Start only frontend
cd frontend && npm run dev

# Start only Node.js backend
cd nodejs-backend && npm run dev

# Start only Python backend
cd python-backend && uv run uvicorn app.main:app --reload

# View Python backend logs
cd python-backend && uv run uvicorn app.main:app --reload --log-level debug

# Clear all node_modules and reinstall
rm -rf node_modules frontend/node_modules nodejs-backend/node_modules
npm run setup
```

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, or documentation improvements, every contribution helps make LearnMe better.

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Show Your Support

If you find LearnMe helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation
- 🔀 Submitting pull requests

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/ikhlasbhojani/learnme/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ikhlasbhojani/learnme/discussions)
- **Email**: your.email@example.com

---

## 👥 Authors

LearnMe was created by:

- **[Ikhlas Bhojani](https://github.com/ikhlasbhojani)** - Co-creator and developer
  - 🔗 [LinkedIn](https://www.linkedin.com/in/ikhlas-bhojani/)
  - 💻 [GitHub](https://github.com/ikhlasbhojani)

- **[Talal Ahmed](https://github.com/Demolinator)** - Co-creator and developer
  - 🔗 [LinkedIn](https://www.linkedin.com/in/talal--ahmed/)
  - 💻 [GitHub](https://github.com/Demolinator)

- **[Muhammad Qasim](https://github.com/EnggQasim)** - Co-creator and developer
  - 🔗 [LinkedIn](https://www.linkedin.com/in/sirqasim/)
  - 💻 [GitHub](https://github.com/EnggQasim)

We're passionate about making learning accessible and engaging through AI-powered technology.

---

<div align="center">

**Built with ❤️ by the LearnMe Community**

**Created by [Ikhlas Bhojani](https://github.com/ikhlasbhojani), [Talal Ahmed](https://github.com/Demolinator), and [Muhammad Qasim](https://github.com/EnggQasim)**

[⬆ Back to Top](#-learnme---ai-powered-learning-platform)

</div>

