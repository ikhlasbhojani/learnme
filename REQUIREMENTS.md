# Python Backend Separation - Requirements & Implementation Plan

## 📋 Overview

TypeScript backend se AI-related operations ko alag karke ek separate Python FastAPI service banaya jaega. TypeScript backend authentication aur user data management ke liye rahega, jabki Python service sirf AI operations handle karega.

---

## 🎯 Objectives

1. **Separation of Concerns**: AI logic ko TypeScript se Python me move karna
2. **Microservices Architecture**: TypeScript aur Python dono independent services
3. **API Communication**: TypeScript backend Python service ko HTTP calls karega
4. **Data Flow**: User data TypeScript me, AI processing Python me

---

## 🔍 Current TypeScript Backend Analysis

### Complete User Flow (Step by Step)

#### **Step 1: URL/Document Upload**
- User URL ya document upload karta hai
- **Frontend**: `Home.tsx` → URL submit → `/documentation-topics?url=...` navigate karta hai
- **Alternative**: Direct `/generate-quiz` page pe URL enter kar sakta hai

#### **Step 2: Topic Extraction (Mindmap Creation)**
- **Frontend Page**: `DocumentationTopicSelection.tsx` 
- **Backend API**: `POST /api/content/extract-topics` (TypeScript)
- **Backend Service**: `extractTopicsFromDocumentation()` in `content.service.ts`
- **Process**:
  1. TypeScript backend URL ko Python service ko bhejega
  2. **Python service**:
     - URL se documentation fetch karta hai (httpx + beautifulsoup4)
     - HTML se links extract karta hai
     - **AI se links ko topics/sections me organize karta hai**
     - Topics list return karta hai (sections me grouped)
  3. TypeScript backend response ko frontend ko forward karta hai
- **Response**: Topics array with `id`, `title`, `url`, `description`, `section`
- **Note**: Pura topic extraction process (link extraction + AI organization) Python me hoga

#### **Step 3: Topic Selection UI (Mindmap View)**
- **Frontend Component**: `TopicSelector.tsx`
- Topics sections me grouped dikhaye jate hain (e.g., "Basics", "Advanced", "API Reference")
- User interactions:
  - Individual topics select/deselect kar sakta hai (checkbox)
  - **"Select All"** button se sab topics select kar sakta hai
  - **"Deselect All"** button se sab topics deselect kar sakta hai
- Selected topics state me store hote hain
- Visual feedback: Selected topics highlighted hote hain

#### **Step 4: Navigate to Quiz Configuration**
- User **"Continue with Selected Topics"** button click karta hai
- **Frontend**: `/generate-quiz?url=...&topics=...` navigate karta hai
- Selected topics URL query params me JSON-encoded hote hain
- **Alternative**: User "Use Main Page Instead" click kare to sirf main URL use hota hai

#### **Step 5: Quiz Configuration**
- **Frontend Page**: `GenerateQuiz.tsx`
- User configure karta hai:
  - **Difficulty Level**: Easy / Medium / Hard (radio buttons)
  - **Number of Questions**: 1-100 (number input)
  - **Time Duration**: seconds, minimum 60 (number input)
- Selected topics already loaded hote hain (URL params se)
- User selected topics ko dekh sakta hai (read-only view)

#### **Step 6: Quiz Generation**
- User **"Generate Quiz"** button click karta hai
- **Frontend Service**: `quizGenerationService.generateQuizFromUrl()`
- **Backend API**: `POST /api/quiz-generation/generate-from-url` (TypeScript)
- **Backend Service**: `generateQuizFromUrl()` in `quiz-generation.service.ts`
- **Process**:
  1. Selected topics ke URLs extract karta hai (ya single URL use karta hai)
  2. **OrchestratorAgent** initialize karta hai
  3. **ContentExtractionAgent** se content extract karta hai (multiple URLs se)
  4. **QuizGenerationAgent** se AI se questions generate karta hai
  5. Quiz database me save karta hai (MongoDB)
  6. ContentInput create/update karta hai
  7. Quiz ID return karta hai
- **Frontend**: Quiz page pe redirect (`/quiz/{quizId}`)

---

### AI-Related Operations (Python me move honge)

#### 1. **Quiz Generation Module**

- **Location**: `backend/src/modules/quiz-generation/`
- **Components**:
  - `OrchestratorAgent` - Content extraction aur quiz generation ko coordinate karta hai
  - `ContentExtractionAgent` - URLs/document se content extract karta hai
  - `QuizGenerationAgent` - AI se quiz questions generate karta hai
  - `BaseAgent` - Common AI provider logic

#### 2. **Quiz Analysis Module**

- **Location**: `backend/src/modules/quiz-analysis/`
- **Components**:
  - `QuizAnalysisAgent` - Completed quiz ka AI-based analysis karta hai
  - Performance review, weak areas, suggestions generate karta hai

#### 3. **Content Module (Complete Migration to Python)**

- **Location**: `backend/src/modules/content/content.service.ts`
- **Function**: `extractTopicsFromDocumentation()` - Documentation se topics extract karta hai
- **Current Implementation**: 
  - Link extraction (cheerio, axios) - TypeScript me hai
  - AI organization - TypeScript me hai
- **New Flow (Python me move hoga)**:
  1. URL se HTML fetch (httpx + beautifulsoup4) - Python me
  2. HTML se links extract (beautifulsoup4) - Python me
  3. AI se links ko topics/sections me organize - Python me
- **Note**: Pura topic extraction process (link extraction + AI organization) Python me move hoga

#### 4. **AI Provider Services**

- **Location**: `backend/src/services/ai/`
- **Components**:
  - `ai-provider.factory.ts` - AI provider factory
  - `ai-provider.interface.ts` - AI provider interface
  - `providers/openai.provider.ts` - OpenAI provider implementation

### Non-AI Operations (TypeScript me rahenge)

1. **Authentication Module** - User signup, login, logout
2. **User Management** - User profile, preferences
3. **Quiz CRUD** - Quiz create, read, update, delete
4. **Quiz State Management** - Start, pause, resume, finish quiz
5. **Answer Submission** - User answers save karna
6. **Database Operations** - MongoDB operations
7. **Content Input Management** - ContentInput CRUD operations
8. **API Routing** - Python service ko forward karna (proxy-like behavior)

---

## 🏗️ Architecture Design

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend   │────────▶│ TypeScript  │────────▶│   Python    │
│   (React)    │         │   Backend   │         │   Service   │
│             │         │  (Express)  │         │  (FastAPI)  │
└─────────────┘         └─────────────┘         └─────────────┘
                              │                         │
                              ▼                         ▼
                        ┌─────────────┐         ┌─────────────┐
                        │  MongoDB    │         │  AI APIs    │
                        │  Database   │         │ (OpenAI,    │
                        │             │         │  Gemini,    │
                        └─────────────┘         │  etc.)      │
                                                └─────────────┘
```

---

## 📡 Python FastAPI Service - API Specifications

### Base URL

```
http://localhost:8000/api/ai
```

### Authentication

TypeScript backend se `X-User-Id` header me userId bheja jaega (internal service-to-service communication)

---

### 1. Quiz Generation APIs

#### 1.1 Generate Quiz from URL

**Endpoint**: `POST /api/ai/quiz/generate-from-url`

**Request Body**:

```json
{
  "url": "https://example.com/documentation",
  "selectedTopics": [
    {
      "id": "topic-1",
      "title": "Introduction",
      "url": "https://example.com/intro",
      "description": "Introduction section",
      "section": "Basics"
    }
  ],
  "difficulty": "easy" | "medium" | "hard",
  "numberOfQuestions": 10,
  "userId": "user-id-here"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q-1",
        "text": "What is the main purpose of...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "difficulty": "Easy",
        "explanation": "Explanation text here",
        "codeSnippet": null,
        "imageReference": null
      }
    ],
    "quizName": "Generated Quiz Title",
    "metadata": {
      "source": "https://example.com/documentation",
      "difficulty": "easy",
      "requestedQuestions": 10,
      "generatedQuestions": 10,
      "extractedAt": "2024-01-01T00:00:00Z",
      "generatedAt": "2024-01-01T00:00:01Z"
    }
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "QUIZ_GENERATION_FAILED",
    "message": "Failed to generate quiz",
    "details": "Error details here"
  }
}
```

---

#### 1.2 Generate Quiz from Document

**Endpoint**: `POST /api/ai/quiz/generate-from-document`

**Request Body**:

```json
{
  "document": "Full document text content here...",
  "difficulty": "medium",
  "numberOfQuestions": 15,
  "userId": "user-id-here"
}
```

**Response**: Same as above

---

### 2. Quiz Analysis API

#### 2.1 Analyze Quiz

**Endpoint**: `POST /api/ai/quiz/analyze`

**Request Body**:

```json
{
  "quiz": {
    "id": "quiz-id",
    "questions": [
      {
        "id": "q-1",
        "text": "Question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "difficulty": "Easy",
        "explanation": "Explanation"
      }
    ],
    "configuration": {
      "difficulty": "Easy",
      "numberOfQuestions": 10,
      "timeDuration": 3600
    }
  },
  "answers": {
    "q-1": "A",
    "q-2": "B"
  },
  "originalContent": "Original content text if available",
  "userId": "user-id-here"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "performanceReview": "Overall performance review text...",
    "weakAreas": ["Topic 1", "Topic 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "strengths": ["Strength 1", "Strength 2"],
    "improvementAreas": ["Area 1", "Area 2"],
    "detailedAnalysis": "Detailed analysis text...",
    "topicsToReview": ["Topic A", "Topic B"]
  }
}
```

---

### 3. Content Extraction APIs

#### 3.1 Extract Topics from Documentation (Complete Process)

**Endpoint**: `POST /api/ai/content/extract-topics`

**Description**: Python service URL se HTML fetch karega, links extract karega, aur AI se organize karega. Pura process Python me hoga.

**Request Body**:

```json
{
  "url": "https://example.com/documentation",
  "userId": "user-id-here"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "topic-1",
        "title": "Introduction",
        "url": "https://example.com/intro",
        "description": "Introduction to the topic",
        "section": "Basics"
      },
      {
        "id": "topic-2",
        "title": "Basic Concepts",
        "url": "https://example.com/basics",
        "description": "Learn the fundamentals",
        "section": "Basics"
      }
    ],
    "mainUrl": "https://example.com/documentation",
    "totalPages": 10
  }
}
```

**Python Service Process**:
1. URL se HTML fetch karega (httpx)
2. HTML parse karega (beautifulsoup4)
3. Links extract karega (beautifulsoup4 selectors)
4. AI se links ko topics/sections me organize karega
5. Organized topics return karega

**TypeScript Backend**: 
- Sirf proxy karega - URL ko Python service ko forward karega
- Python se response ko frontend ko forward karega

---

#### 3.2 Extract Content from URL

**Endpoint**: `POST /api/ai/content/extract`

**Request Body**:

```json
{
  "url": "https://example.com/page",
  "userId": "user-id-here"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "content": "Extracted and cleaned content text...",
    "pageTitle": "Page Title",
    "source": "https://example.com/page",
    "extractedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 🔄 Data Flow

### Complete Quiz Generation Flow (with Topic Selection)

```
STEP 1: Topic Extraction (Mindmap Creation)
1. Frontend → TypeScript: POST /api/content/extract-topics
   {
     url: "https://docs.example.com"
   }

2. TypeScript:
   - URL ko Python service ko forward karega (proxy)

3. TypeScript → Python: POST /api/ai/content/extract-topics
   {
     url: "https://docs.example.com",
     userId: "..."
   }

4. Python:
   - URL se HTML fetch (httpx)
   - HTML parse (beautifulsoup4)
   - Links extract (beautifulsoup4 selectors)
   - AI se links ko topics/sections me organize karna
   - Response return karna

5. Python → TypeScript:
   {
     topics: [...],
     mainUrl: "...",
     totalPages: 10
   }

6. TypeScript → Frontend:
   {
     topics: [...], mainUrl: "...", totalPages: 10
   }

STEP 2: Topic Selection (Frontend)
7. Frontend:
   - Topics list show karta hai (TopicSelector component)
   - User topics select karta hai (Select All / Deselect All)
   - "Continue with Selected Topics" click karta hai
   - Navigate: /generate-quiz?url=...&topics=...

STEP 3: Quiz Configuration (Frontend)
8. Frontend:
   - Difficulty select (Easy/Medium/Hard)
   - Number of questions input (1-100)
   - Time duration input (seconds)
   - "Generate Quiz" click karta hai

STEP 4: Quiz Generation
9. Frontend → TypeScript: POST /api/quiz-generation/generate-from-url
   {
     selectedTopics: [...],  // OR url: "..."
     difficulty: "medium",
     numberOfQuestions: 10,
     timeDuration: 3600
   }

10. TypeScript:
    - Selected topics ke URLs extract
    - Python service ko call karega

11. TypeScript → Python: POST /api/ai/quiz/generate-from-url
    {
      urls: [...],  // Selected topics ke URLs
      difficulty: "medium",
      numberOfQuestions: 10,
      userId: "..."
    }

12. Python:
    - Content extraction (multiple URLs se)
    - AI se quiz questions generate
    - Quiz name generate
    - Response return

13. Python → TypeScript:
    {
      questions: [...],
      quizName: "...",
      metadata: {...}
    }

14. TypeScript:
    - Quiz database me save (MongoDB)
    - ContentInput create/update
    - Response return

15. TypeScript → Frontend:
    {
      quizId: "...",
      questions: [...],
      metadata: {...}
    }

16. Frontend:
    - Quiz page pe redirect (/quiz/{quizId})
```

### Quiz Analysis Flow

```
1. Frontend → TypeScript: POST /api/quizzes/:id/analyze
   (Quiz ID)

2. TypeScript:
   - Quiz database se fetch karna
   - Answers aur original content prepare karna
   - Python service ko call karna

3. TypeScript → Python: POST /api/ai/quiz/analyze
   {
     quiz, answers, originalContent, userId
   }

4. Python:
   - AI se analysis generate karna
   - Performance review, suggestions, etc.

5. Python → TypeScript:
   {
     performanceReview, weakAreas, suggestions, ...
   }

6. TypeScript:
   - Analysis database me save karna (quiz.analysis field me)
   - Response return karna

7. TypeScript → Frontend:
   {
     analysis data
   }
```

---

## 📦 Python Service Structure

```
python-service/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── config/
│   │   ├── settings.py        # Environment variables
│   │   └── ai_config.py       # AI provider configuration
│   ├── modules/
│   │   ├── quiz_generation/
│   │   │   ├── router.py      # FastAPI routes
│   │   │   ├── service.py     # Business logic
│   │   │   └── agents/
│   │   │       ├── orchestrator_agent.py
│   │   │       ├── content_extraction_agent.py
│   │   │       └── quiz_generation_agent.py
│   │   ├── quiz_analysis/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── agents/
│   │   │       └── quiz_analysis_agent.py
│   │   └── content/
│   │       ├── router.py
│   │       └── service.py
│   ├── services/
│   │   └── ai/
│   │       ├── provider_factory.py
│   │       ├── providers/
│   │       │   ├── openai_provider.py
│   │       │   ├── gemini_provider.py
│   │       │   └── ...
│   │       └── base_provider.py
│   └── utils/
│       ├── errors.py
│       └── validators.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔐 Security & Authentication

### Internal Service Communication

- TypeScript backend se Python service ko calls me `X-User-Id` header me userId bheja jaega
- Python service internal network me accessible hoga (not public)
- CORS settings: Only TypeScript backend origin allow karega

### Environment Variables (Python)

```env
# AI Configuration
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
AI_API_KEY=your-api-key-here
AI_BASE_URL=https://api.example.com  # Optional

# Service Configuration
PORT=8000
CORS_ORIGIN=http://localhost:5000  # TypeScript backend URL

# Logging
LOG_LEVEL=INFO
```

---

## 📝 User Stories

### User Story 1: Generate Quiz from URL

**As a** user
**I want to** generate a quiz from a documentation URL
**So that** I can test my knowledge on that topic

**Acceptance Criteria**:

- User URL submit kare
- TypeScript backend Python service ko call kare
- Python service content extract kare aur AI se questions generate kare
- Generated quiz database me save ho
- User ko quiz ID aur questions mil jaye

**API Flow**:

1. `POST /api/quiz-generation/generate-from-url` (TypeScript)
2. `POST /api/ai/quiz/generate-from-url` (Python)
3. Response with questions

---

### User Story 2: Generate Quiz from Document

**As a** user
**I want to** upload a document and generate quiz from it
**So that** I can create quizzes from my own content

**Acceptance Criteria**:

- User document text submit kare
- TypeScript backend Python service ko call kare
- Python service AI se questions generate kare
- Generated quiz save ho
- User ko quiz mil jaye

---

### User Story 3: Analyze Completed Quiz

**As a** user
**I want to** get AI-powered analysis of my quiz performance
**So that** I can understand my strengths and weaknesses

**Acceptance Criteria**:

- User quiz complete kare
- TypeScript backend Python service ko analysis request bheje
- Python service AI se detailed analysis generate kare
- Analysis database me save ho
- User ko performance review, suggestions, weak areas mil jaye

---

### User Story 4: Extract Topics from Documentation (Mindmap Creation)

**As a** user  
**I want to** extract topics from a documentation website  
**So that** I can select specific topics for quiz generation

**Acceptance Criteria**:

- User documentation URL submit kare
- TypeScript backend URL ko Python service ko forward kare
- Python service URL se HTML fetch kare
- Python service HTML se links extract kare
- Python service AI se links ko topics/sections me organize kare
- User ko organized topics list mil jaye (sections me grouped)
- User topics select kar sake (Select All / Deselect All)
- Selected topics se quiz generate ho

**Detailed Flow**:
1. User URL enter karta hai → `/documentation-topics?url=...`
2. TypeScript backend URL ko Python service ko forward karta hai
3. Python service:
   - URL se HTML fetch karta hai (httpx)
   - HTML parse karta hai (beautifulsoup4)
   - Links extract karta hai
   - AI se organize karta hai
4. Topics list show hota hai (TopicSelector component)
5. User topics select karta hai
6. "Continue" click → `/generate-quiz?url=...&topics=...`
7. Quiz configuration page
8. Quiz generate hota hai

---

## 🚀 Implementation Phases

### Phase 1: Python Service Setup

- [ ] FastAPI project structure create karna
- [ ] AI provider factory implement karna
- [ ] Environment configuration setup
- [ ] Basic health check endpoint

### Phase 2: Quiz Generation Migration

- [ ] Content extraction agent (Python)
- [ ] Quiz generation agent (Python)
- [ ] Orchestrator agent (Python)
- [ ] API endpoints create karna
- [ ] TypeScript se integration

### Phase 3: Quiz Analysis Migration

- [ ] Quiz analysis agent (Python)
- [ ] API endpoint create karna
- [ ] TypeScript se integration

### Phase 4: Content Extraction Migration

- [ ] Complete topic extraction service (Python)
  - HTML fetching (httpx)
  - Link extraction (beautifulsoup4)
  - AI-powered topic organization
- [ ] Content extraction service (Python) - AI-powered content cleaning/summarization
- [ ] API endpoints create karna
  - `POST /api/ai/content/extract-topics` - Complete process (fetch + extract + organize)
  - `POST /api/ai/content/extract` - Content extract aur clean
- [ ] TypeScript se integration
- [ ] TypeScript backend sirf proxy karega (URL forward karega)

### Phase 5: Testing & Optimization

- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Error handling improvements

### Phase 6: Cleanup

- [ ] TypeScript se AI code remove karna
- [ ] Documentation update
- [ ] Deployment configuration

---

## 🔧 Technical Details

### Python Dependencies

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
httpx>=0.25.0
beautifulsoup4>=4.12.0
lxml>=5.1.0
openai>=1.3.0
python-dotenv>=1.0.0
```

**Note**: `beautifulsoup4` aur `httpx` HTML fetching aur link extraction ke liye use honge (TypeScript ke `cheerio` aur `axios` ki jagah)

### TypeScript Changes Required

1. **New Service Client**: Python service ko call karne ke liye HTTP client
2. **Remove AI Code**:

   - `backend/src/services/ai/` folder remove
   - `backend/src/modules/quiz-generation/agents/` remove
   - `backend/src/modules/quiz-analysis/agents/` remove
   - Content service se AI logic remove
3. **Update Services**:

   - `quiz-generation.service.ts` - Python API call karega
   - `quiz-analysis.service.ts` - Python API call karega
   - `content.service.ts` - Pura topic extraction Python API call karega (URL forward karega)
   
4. **New Python Service Client**:
   - `backend/src/services/python-api-client.ts` - Python service ko call karne ke liye HTTP client
   - Environment variable: `PYTHON_SERVICE_URL=http://localhost:8000`

---

## 📊 API Request/Response Examples

### Example 1: Generate Quiz from URL

**TypeScript → Python Request**:

```http
POST /api/ai/quiz/generate-from-url
Content-Type: application/json
X-User-Id: user-123

{
  "url": "https://docs.python.org/3/tutorial/",
  "difficulty": "medium",
  "numberOfQuestions": 10,
  "userId": "user-123"
}
```

**Python Response**:

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q-1",
        "text": "What is the output of print('Hello' + 'World')?",
        "options": [
          "HelloWorld",
          "Hello World",
          "Hello+World",
          "Error"
        ],
        "correctAnswer": "HelloWorld",
        "difficulty": "Normal",
        "explanation": "String concatenation in Python...",
        "codeSnippet": "print('Hello' + 'World')",
        "imageReference": null
      }
    ],
    "quizName": "Python Tutorial Basics",
    "metadata": {
      "source": "https://docs.python.org/3/tutorial/",
      "difficulty": "medium",
      "requestedQuestions": 10,
      "generatedQuestions": 10,
      "extractedAt": "2024-01-01T12:00:00Z",
      "generatedAt": "2024-01-01T12:00:05Z"
    }
  }
}
```

---

### Example 2: Analyze Quiz

**TypeScript → Python Request**:

```http
POST /api/ai/quiz/analyze
Content-Type: application/json
X-User-Id: user-123

{
  "quiz": {
    "id": "quiz-456",
    "questions": [...],
    "configuration": {...}
  },
  "answers": {
    "q-1": "A",
    "q-2": "B",
    "q-3": "C"
  },
  "originalContent": "Original content text...",
  "userId": "user-123"
}
```

**Python Response**:

```json
{
  "success": true,
  "data": {
    "performanceReview": "You scored 70% which is above average...",
    "weakAreas": ["Functions", "Error Handling"],
    "suggestions": [
      "Review function definitions and parameters",
      "Practice exception handling"
    ],
    "strengths": ["Basic Syntax", "Data Types"],
    "improvementAreas": ["Advanced Concepts", "Best Practices"],
    "detailedAnalysis": "Your performance shows strong understanding...",
    "topicsToReview": ["Python Functions", "Exception Handling"]
  }
}
```

---

## ✅ Success Criteria

1. ✅ All AI operations Python service me move ho jaye
2. ✅ TypeScript backend Python service ko successfully call kare
3. ✅ Quiz generation kaam kare (URL aur document dono se)
4. ✅ Quiz analysis kaam kare
5. ✅ Topic extraction kaam kare
6. ✅ Error handling proper ho
7. ✅ Response times acceptable ho (< 30 seconds for quiz generation)
8. ✅ Code maintainable aur scalable ho

---

## 📚 Additional Notes

- Python service independent deployable hoga
- TypeScript backend Python service ke bina kaam nahi karega (dependency)
- Health check endpoint Python service me hoga
- Logging proper setup karni hogi
- Rate limiting consider karna (AI API costs ke liye)
- Caching strategy consider karna (same content se multiple quizzes)

---

**Document Version**: 1.0
**Last Updated**: 2024-01-01
**Author**: Development Team
