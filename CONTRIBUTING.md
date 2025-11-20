# Contributing to LearnMe

First off, thank you for considering contributing to LearnMe! 🎉 It's people like you that make LearnMe such a great tool for learners worldwide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. By participating, you are expected to uphold this code:

- **Be Respectful**: Treat everyone with respect. Harassment and abuse are never tolerated.
- **Be Constructive**: Provide constructive feedback and be open to receiving it.
- **Be Collaborative**: Work together with other contributors.
- **Be Professional**: Keep discussions focused on the project.

---

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., Windows 11, macOS 14]
 - Browser: [e.g., Chrome 120, Firefox 121]
 - Node.js version: [e.g., 18.17.0]
 - Python version: [e.g., 3.13.0]

**Additional context**
Any other context about the problem.
```

### 💡 Suggesting Features

Feature suggestions are welcome! Please:
1. Check if the feature already exists or is planned
2. Provide a clear use case
3. Explain why this feature would be useful to most users
4. Include mockups or examples if applicable

**Feature Request Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.
```

### 🔨 Contributing Code

1. **Find an Issue**: Look for issues labeled `good first issue` or `help wanted`
2. **Comment**: Let others know you're working on it
3. **Fork & Create Branch**: Fork the repo and create a feature branch
4. **Make Changes**: Implement your changes following our coding standards
5. **Test**: Ensure all tests pass and add new tests if needed
6. **Submit PR**: Create a pull request with a clear description

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 16+ and npm
- **Git**

> **Note**: Python, uv, and other dependencies will be installed automatically!

### Quick Setup (Recommended)

1. **Fork and Clone**
```bash
git clone https://github.com/YOUR_USERNAME/LearnMe.git
cd LearnMe
```

2. **One-Command Setup**
```bash
npm run setup
```

This will automatically:
- Check Node.js version
- Install uv (Python package manager)
- Install Python 3.13+
- Install all dependencies (frontend, Node.js backend, Python backend)
- Install Playwright browsers

3. **Start Development**
```bash
npm start
```

This starts all three services concurrently:
- Frontend: http://localhost:5173
- Node.js Backend: http://localhost:5000
- Python Backend: http://localhost:8000

### Manual Setup (Alternative)

<details>
<summary>Click to expand manual setup instructions</summary>

If you prefer manual control over each step:

1. **Fork and Clone**
```bash
git clone https://github.com/YOUR_USERNAME/LearnMe.git
cd LearnMe
```

2. **Install uv** (if not installed)
```bash
# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

3. **Install Dependencies**
```bash
# Frontend
npm run install:frontend

# Node.js Backend
npm run install:nodejs

# Python Backend
npm run install:python

# Playwright Browsers
npm run playwright:install
```

4. **Start Services**
```bash
npm start
```

</details>

### Running Tests

**Frontend:**
```bash
cd frontend
npm test
npm run test:coverage
```

**Node.js Backend:**
```bash
cd nodejs-backend
npm test
```

**Python Backend:**
```bash
cd python-backend
uv run pytest
uv run pytest --cov=app tests/
```

### Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes thoroughly
4. Run linters: `npm run lint` (frontend/nodejs) or `uv run ruff check .` (python)
5. Commit your changes: `git commit -m "feat: add amazing feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated (if applicable)
- [ ] No console.log or debug statements left in code
- [ ] Commit messages follow conventional commits
- [ ] Branch is up to date with main

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add user profile page`
- `fix: resolve API timeout issue`
- `docs: update installation guide`
- `style: format code with prettier`
- `refactor: reorganize component structure`
- `test: add quiz generation tests`
- `chore: update dependencies`

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran.

## Screenshots (if applicable)
Add screenshots to demonstrate the changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer will review your PR
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, a maintainer will merge your PR

---

## 📏 Coding Standards

### Frontend (React/TypeScript)

- **Style Guide**: Follow Airbnb React/TypeScript style guide
- **Formatting**: Use Prettier with project config
- **Linting**: ESLint with project rules
- **Naming**:
  - Components: PascalCase (`UserProfile.tsx`)
  - Hooks: camelCase with `use` prefix (`useAuth.ts`)
  - Utilities: camelCase (`formatDate.ts`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

**Example:**
```typescript
// Good
export function UserProfile({ userId }: UserProfileProps) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  
  return <div className="user-profile">{user.name}</div>
}

// Bad
export function userprofile(props: any) {
  const user = useAuth().user
  return <div>{user.name}</div>
}
```

### Backend (Node.js)

- **Style Guide**: JavaScript Standard Style
- **Async/Await**: Prefer over callbacks/promises chains
- **Error Handling**: Always handle errors gracefully
- **Naming**:
  - Files: kebab-case (`user-controller.js`)
  - Functions: camelCase (`getUserById`)
  - Classes: PascalCase (`UserService`)

**Example:**
```javascript
// Good
async function getUserById(userId) {
  try {
    const user = await userModel.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }
    return user
  } catch (error) {
    logger.error('Error fetching user:', error)
    throw error
  }
}

// Bad
function getUserById(userId, callback) {
  userModel.findById(userId).then(user => {
    callback(null, user)
  }).catch(err => callback(err))
}
```

### Backend (Python/FastAPI)

- **Style Guide**: PEP 8
- **Type Hints**: Always use type hints
- **Docstrings**: Use Google-style docstrings
- **Naming**:
  - Files: snake_case (`quiz_service.py`)
  - Functions: snake_case (`generate_quiz`)
  - Classes: PascalCase (`QuizService`)

**Example:**
```python
# Good
async def generate_quiz(
    url: str,
    difficulty: str,
    num_questions: int
) -> QuizResponse:
    """Generate a quiz from a URL.
    
    Args:
        url: The URL to generate quiz from
        difficulty: Quiz difficulty level
        num_questions: Number of questions to generate
        
    Returns:
        QuizResponse: Generated quiz data
        
    Raises:
        ValueError: If parameters are invalid
    """
    if num_questions < 1 or num_questions > 100:
        raise ValueError("Number of questions must be between 1 and 100")
    
    # Implementation
    pass

# Bad
def generateQuiz(url, difficulty, num):
    # No type hints, no docstring, inconsistent naming
    return quiz
```

---

## 🧪 Testing Guidelines

### Test Coverage

- **Minimum Coverage**: 70% overall
- **Critical Paths**: 90%+ coverage
- **New Features**: Must include tests

### Writing Tests

**Frontend (Vitest/React Testing Library):**
```typescript
describe('UserProfile', () => {
  it('should render user name', () => {
    render(<UserProfile userId="123" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
  
  it('should show loading state', () => {
    render(<UserProfile userId="123" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
```

**Backend (Jest/Pytest):**
```python
def test_generate_quiz_success():
    """Test successful quiz generation."""
    result = generate_quiz(
        url="https://example.com",
        difficulty="medium",
        num_questions=10
    )
    
    assert result.questions
    assert len(result.questions) == 10
    assert result.difficulty == "medium"

def test_generate_quiz_invalid_url():
    """Test quiz generation with invalid URL."""
    with pytest.raises(ValueError, match="Invalid URL"):
        generate_quiz(url="not-a-url", difficulty="easy", num_questions=5)
```

---

## 📖 Documentation

### Code Comments

- **What to Comment**: Complex logic, workarounds, TODOs
- **What NOT to Comment**: Obvious code, redundant explanations
- **Style**: Clear, concise, professional

```typescript
// Good
// Debounce API calls to prevent excessive requests during typing
const debouncedSearch = useMemo(
  () => debounce(searchAPI, 300),
  []
)

// Bad
// This function adds two numbers
function add(a, b) {
  return a + b // Return the sum
}
```

### README Updates

When adding new features:
- Update relevant README files
- Add usage examples
- Update configuration documentation
- Include screenshots if UI changes

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error responses
- Update OpenAPI/Swagger specs

---

## 🌐 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code contributions and reviews

### Getting Help

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Be specific about your problem
- Provide context and examples

### Recognition

Contributors are recognized in:
- Project README
- Release notes
- Contributors list
- Special thanks section

---

## 🎯 Priority Areas

We especially welcome contributions in:

- 🐛 **Bug Fixes**: Any and all bug fixes
- 📱 **Mobile Responsiveness**: Improving mobile experience
- ♿ **Accessibility**: Making the app more accessible
- 🌍 **Internationalization**: Adding multi-language support
- 📊 **Analytics Features**: Enhanced learning analytics
- 🎨 **UI/UX Improvements**: Better user experience
- 📚 **Documentation**: Clearer, more comprehensive docs
- 🧪 **Test Coverage**: Increasing test coverage
- ⚡ **Performance**: Speed and optimization improvements

---

## 📝 License

By contributing to LearnMe, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Your contributions make LearnMe better for everyone. We appreciate your time and effort in making this project great!

**Happy Coding! 🚀**

---

<div align="center">

For questions about contributing, feel free to reach out via [GitHub Discussions](https://github.com/yourusername/LearnMe/discussions).

</div>

