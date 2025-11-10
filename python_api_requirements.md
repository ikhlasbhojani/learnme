# Python FastAPI Service - API Requirements & Documentation

## 📋 Overview

Yeh document Python FastAPI service ki sabhi APIs ki complete documentation hai. Har API ke liye request parameters, response format, aur error handling details diye gaye hain.

---

## 🌐 Base Configuration

### Base URL
```
http://localhost:8000/api/ai
```

### Authentication
TypeScript backend se `X-User-Id` header me userId bheja jaega (internal service-to-service communication)

### Common Headers
```
Content-Type: application/json
X-User-Id: user-id-here
```

### Common Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

### Common Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": "Detailed error information"
  }
}
```

---

## 🔄 Complete Flow Overview

### Step 1: Topic Extraction (Mindmap Creation)
```
User → TypeScript Backend → Python Service
- User URL bhejega
- Python service URL se HTML fetch karega
- Sare URLs extract karega
- AI se topics organize karega
- Sare URLs (topics) ko TypeScript backend ko return karega
- Frontend pe topics show honge
```

### Step 2: Quiz Generation
```
User → TypeScript Backend → Python Service
- User selected topics (URLs) bhejega
- Python service selected URLs se content fetch karega
- AI se quiz questions generate karega
- Questions ko TypeScript backend ko return karega
- TypeScript backend quiz ko database me save karega
```

### Step 3: Quiz Attempt
```
User → TypeScript Backend (Database)
- User quiz attempt karega
- Answers save honge
- Analysis generate hoga
```

---

## 📡 API Endpoints

### 1. Topic Extraction API (Pehli API - Mindmap Creation)

#### 1.1 Extract Topics from Documentation URL

**Endpoint**: `POST /api/ai/content/extract-topics`

**Description**: 
Yeh **pehli API** hai jo user URL bhejega. Is API se:
1. User URL bhejega TypeScript backend ko
2. TypeScript backend URL ko Python service ko forward karega
3. Python service:
   - URL se HTML fetch karega (httpx)
   - HTML parse karega (beautifulsoup4)
   - **Sare URLs extract karega** (documentation ke sabhi links)
   - AI se URLs ko topics/sections me organize karega
   - **Sare topics with URLs ko TypeScript backend ko return karega**
4. TypeScript backend topics ko frontend ko bhejega
5. Frontend pe topics show honge (user select kar sake)

**Important**: 
- Yeh API **sirf topics extract karta hai**, quiz generate nahi karta
- Har topic me `url` field **mandatory** hai (quiz generation ke liye zaroori)
- Quiz generation alag API se hoga (selected topics ke URLs se)

**Request Headers**:
```
Content-Type: application/json
X-User-Id: user-123
```

**Request Body**:
```json
{
  "url": "https://example.com/documentation",
  "userId": "user-123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Documentation URL (must be valid HTTP/HTTPS URL) |
| `userId` | string | Yes | User ID for tracking |

**Success Response (200 OK)**:
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
        "title": "Getting Started",
        "url": "https://example.com/getting-started",
        "description": "Quick start guide",
        "section": "Basics"
      },
      {
        "id": "topic-3",
        "title": "Advanced Concepts",
        "url": "https://example.com/advanced",
        "description": "Advanced topics and concepts",
        "section": "Advanced"
      }
    ],
    "mainUrl": "https://example.com/documentation",
    "totalPages": 3
  }
}
```

**Topic Object Structure**:
```json
{
  "id": "string",
  "title": "string",
  "url": "string",  // MANDATORY - Quiz generation ke liye zaroori
  "description": "string (optional)",
  "section": "string (optional)"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `topics` | array | Array of topic objects (organized by sections) - **Har topic me URL hoga jo quiz generation ke liye use hoga** |
| `mainUrl` | string | Original documentation URL |
| `totalPages` | integer | Total number of topics found |

**Python Service Internal Process**:
1. **HTML Fetching**: URL se HTML content fetch karega (httpx)
2. **Link Extraction**: HTML se sabhi links extract karega (beautifulsoup4)
   - Navigation links
   - Documentation page links
   - Internal documentation links
3. **Link Filtering**: Relevant links filter karega
   - Same domain ke links
   - Documentation pages (not login, logout, etc.)
   - Valid HTML pages (not images, PDFs, etc.)
4. **AI Organization**: AI se links ko topics/sections me organize karega
   - Similar topics ko group karega
   - Sections me categorize karega
   - Descriptions generate karega
5. **Response**: Organized topics with URLs return karega

**Error Responses**:

**400 Bad Request** - Invalid URL:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL format",
    "details": "URL must be a valid HTTP or HTTPS URL"
  }
}
```

**400 Bad Request** - URL fetch failed:
```json
{
  "success": false,
  "error": {
    "code": "URL_FETCH_FAILED",
    "message": "Failed to fetch URL",
    "details": "Connection timeout after 30 seconds"
  }
}
```

**404 Not Found** - No topics found:
```json
{
  "success": false,
  "error": {
    "code": "NO_TOPICS_FOUND",
    "message": "No topics found in documentation",
    "details": "Could not extract any valid links from the page"
  }
}
```

**500 Internal Server Error** - Topic extraction failed:
```json
{
  "success": false,
  "error": {
    "code": "TOPIC_EXTRACTION_FAILED",
    "message": "Failed to extract topics",
    "details": "AI organization failed: Invalid response format"
  }
}
```

**Example Request (cURL)**:
```bash
curl -X POST http://localhost:8000/api/ai/content/extract-topics \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "url": "https://docs.python.org/3/tutorial/",
    "userId": "user-123"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "topic-1",
        "title": "Introduction",
        "url": "https://docs.python.org/3/tutorial/introduction.html",
        "description": "Introduction to Python programming",
        "section": "Basics"
      },
      {
        "id": "topic-2",
        "title": "Using Python Interpreter",
        "url": "https://docs.python.org/3/tutorial/interpreter.html",
        "description": "How to use Python interpreter",
        "section": "Basics"
      }
    ],
    "mainUrl": "https://docs.python.org/3/tutorial/",
    "totalPages": 15
  }
}
```

---

### 2. Quiz Generation APIs

#### 2.1 Generate Quiz from Selected Topics (URLs)

**Endpoint**: `POST /api/ai/quiz/generate-from-url`

**Description**: 
1. User selected topics (URLs) bhejega TypeScript backend ko
2. TypeScript backend selected topics ke URLs ko Python service ko bhejega
3. Python service:
   - **Selected URLs se content fetch karega** (har URL se)
   - Content ko combine karega
   - AI se quiz questions generate karega
   - Questions ko TypeScript backend ko return karega
4. TypeScript backend quiz ko database me save karega
5. User quiz attempt kar sakta hai

**Important**: Yeh API **selected topics (URLs) se quiz generate karta hai**. Topics extraction alag API se hota hai.

**Request Headers**:
```
Content-Type: application/json
X-User-Id: user-123
```

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
    },
    {
      "id": "topic-2",
      "title": "Advanced Concepts",
      "url": "https://example.com/advanced",
      "description": "Advanced topics",
      "section": "Advanced"
    }
  ],
  "difficulty": "easy",
  "numberOfQuestions": 10,
  "userId": "user-123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | No* | Single URL for quiz generation (*required if selectedTopics not provided) - **Direct URL se quiz generate karne ke liye** |
| `selectedTopics` | array | Yes* | Array of selected topics with URLs (*required if url not provided) - **User ne jo topics select kiye hain unke URLs** |
| `difficulty` | string | Yes | Difficulty level: `"easy"`, `"medium"`, or `"hard"` |
| `numberOfQuestions` | integer | Yes | Number of questions to generate (1-100) |
| `userId` | string | Yes | User ID for tracking |

**Note**: `selectedTopics` array me har topic ka `url` field **mandatory** hai kyunki Python service in URLs se content fetch karega.

**Selected Topic Object Structure**:
```json
{
  "id": "string",
  "title": "string",
  "url": "string",
  "description": "string (optional)",
  "section": "string (optional)"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q-1",
        "text": "What is the main purpose of...?",
        "options": [
          "Option A",
          "Option B",
          "Option C",
          "Option D"
        ],
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

**Question Object Structure**:
```json
{
  "id": "string",
  "text": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "string",
  "difficulty": "Easy" | "Normal" | "Hard" | "Master",
  "explanation": "string | null",
  "codeSnippet": "string | null",
  "imageReference": "string | null"
}
```

**Python Service Internal Process**:
1. **Content Extraction**: Selected topics ke URLs se content fetch karega
   - Har URL se HTML fetch (httpx)
   - Content extract (beautifulsoup4)
   - Content clean aur summarize (AI-powered)
   - Sabhi URLs ka content combine karega
2. **Quiz Generation**: Combined content se AI se questions generate karega
   - Difficulty level ke according questions
   - Requested number of questions
   - Code snippets, explanations, etc.

**Error Responses**:

**400 Bad Request** - Invalid input:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Either URL or selectedTopics must be provided",
    "details": "Both url and selectedTopics cannot be empty"
  }
}
```

**400 Bad Request** - Invalid topics (missing URLs):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOPICS",
    "message": "Selected topics must contain valid URLs",
    "details": "Topic 'topic-1' is missing URL field"
  }
}
```

**400 Bad Request** - URL fetch failed:
```json
{
  "success": false,
  "error": {
    "code": "URL_FETCH_FAILED",
    "message": "Failed to fetch content from selected URLs",
    "details": "URL 'https://example.com/topic1' returned 404"
  }
}
```

**400 Bad Request** - Invalid difficulty:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DIFFICULTY",
    "message": "Difficulty must be easy, medium, or hard",
    "details": "Received: invalid"
  }
}
```

**400 Bad Request** - Invalid question count:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUESTION_COUNT",
    "message": "Number of questions must be between 1 and 100",
    "details": "Received: 150"
  }
}
```

**500 Internal Server Error** - Quiz generation failed:
```json
{
  "success": false,
  "error": {
    "code": "QUIZ_GENERATION_FAILED",
    "message": "Failed to generate quiz",
    "details": "Content extraction failed: Connection timeout"
  }
}
```

---

#### 2.2 Generate Quiz from Document

**Endpoint**: `POST /api/ai/quiz/generate-from-document`

**Description**: Document text se directly quiz questions generate karta hai. Content extraction ki zarurat nahi.

**Request Headers**:
```
Content-Type: application/json
X-User-Id: user-123
```

**Request Body**:
```json
{
  "document": "Full document text content here... This can be any educational content, documentation, notes, etc.",
  "difficulty": "medium",
  "numberOfQuestions": 15,
  "userId": "user-123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | Yes | Full document text content (minimum 100 characters) |
| `difficulty` | string | Yes | Difficulty level: `"easy"`, `"medium"`, or `"hard"` |
| `numberOfQuestions` | integer | Yes | Number of questions to generate (1-100) |
| `userId` | string | Yes | User ID for tracking |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q-1",
        "text": "What is the main concept discussed in the document?",
        "options": [
          "Option A",
          "Option B",
          "Option C",
          "Option D"
        ],
        "correctAnswer": "Option A",
        "difficulty": "Normal",
        "explanation": "Explanation text here",
        "codeSnippet": null,
        "imageReference": null
      }
    ],
    "quizName": "Document-Based Quiz",
    "metadata": {
      "source": "document",
      "difficulty": "medium",
      "requestedQuestions": 15,
      "generatedQuestions": 15,
      "extractedAt": "2024-01-01T00:00:00Z",
      "generatedAt": "2024-01-01T00:00:01Z"
    }
  }
}
```

**Error Responses**:

**400 Bad Request** - Empty document:
```json
{
  "success": false,
  "error": {
    "code": "EMPTY_DOCUMENT",
    "message": "Document content cannot be empty",
    "details": "Document must contain at least 100 characters"
  }
}
```

**400 Bad Request** - Document too short:
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_TOO_SHORT",
    "message": "Document content is too short",
    "details": "Minimum 100 characters required, received: 50"
  }
}
```

---

### 3. Quiz Analysis API

#### 3.1 Analyze Quiz

**Endpoint**: `POST /api/ai/quiz/analyze`

**Description**: Completed quiz ka AI-powered analysis generate karta hai. Performance review, weak areas, suggestions, aur detailed analysis provide karta hai.

**Request Headers**:
```
Content-Type: application/json
X-User-Id: user-123
```

**Request Body**:
```json
{
  "quiz": {
    "id": "quiz-456",
    "questions": [
      {
        "id": "q-1",
        "text": "What is the output of print('Hello' + 'World')?",
        "options": ["HelloWorld", "Hello World", "Hello+World", "Error"],
        "correctAnswer": "HelloWorld",
        "difficulty": "Easy",
        "explanation": "String concatenation in Python"
      },
      {
        "id": "q-2",
        "text": "What is a list comprehension?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "difficulty": "Normal",
        "explanation": "List comprehension explanation"
      }
    ],
    "configuration": {
      "difficulty": "Easy",
      "numberOfQuestions": 10,
      "timeDuration": 3600
    }
  },
  "answers": {
    "q-1": "HelloWorld",
    "q-2": "Option A"
  },
  "originalContent": "Original content text if available...",
  "userId": "user-123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `quiz` | object | Yes | Complete quiz object with questions and configuration |
| `quiz.id` | string | Yes | Quiz ID |
| `quiz.questions` | array | Yes | Array of question objects |
| `quiz.configuration` | object | Yes | Quiz configuration (difficulty, numberOfQuestions, timeDuration) |
| `answers` | object | Yes | User's answers (questionId: answer mapping) |
| `originalContent` | string | No | Original content text (if available, helps in better analysis) |
| `userId` | string | Yes | User ID for tracking |

**Quiz Configuration Object**:
```json
{
  "difficulty": "Easy" | "Normal" | "Hard" | "Master",
  "numberOfQuestions": 10,
  "timeDuration": 3600
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "performanceReview": "You scored 70% which is above average. Your performance shows strong understanding of basic concepts, but there are areas that need improvement.",
    "weakAreas": [
      "List Comprehensions",
      "Error Handling",
      "Advanced Data Structures"
    ],
    "suggestions": [
      "Review list comprehensions and practice with examples",
      "Study exception handling and try-except blocks",
      "Practice with dictionaries and sets"
    ],
    "strengths": [
      "Basic Syntax",
      "Data Types",
      "String Operations"
    ],
    "improvementAreas": [
      "Advanced Concepts",
      "Best Practices",
      "Code Optimization"
    ],
    "detailedAnalysis": "Your performance analysis shows that you have a solid foundation in Python basics. You correctly answered 7 out of 10 questions. Your strengths include understanding of basic syntax and data types. However, you struggled with list comprehensions and error handling concepts. We recommend focusing on these areas for improvement.",
    "topicsToReview": [
      "Python List Comprehensions",
      "Exception Handling",
      "Dictionary Operations"
    ]
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `performanceReview` | string | Overall performance summary (2-3 sentences) |
| `weakAreas` | array | List of topics/concepts where user performed poorly |
| `suggestions` | array | Actionable suggestions for improvement |
| `strengths` | array | Topics/concepts where user performed well |
| `improvementAreas` | array | General areas that need improvement |
| `detailedAnalysis` | string | Detailed analysis paragraph (4-6 sentences) |
| `topicsToReview` | array | Specific topics user should review |

**Error Responses**:

**400 Bad Request** - Invalid quiz data:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUIZ_DATA",
    "message": "Quiz data is invalid",
    "details": "Questions array cannot be empty"
  }
}
```

**400 Bad Request** - Missing answers:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_ANSWERS",
    "message": "Answers are required for analysis",
    "details": "Answers object cannot be empty"
  }
}
```

**500 Internal Server Error** - Analysis failed:
```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "Failed to generate quiz analysis",
    "details": "AI service error: Rate limit exceeded"
  }
}
```

---

### 4. Content Extraction APIs

#### 4.1 Extract Content from URL (Single URL Content Extraction)

**Endpoint**: `POST /api/ai/content/extract`

**Description**: 
Single URL se content extract karta hai, clean karta hai, aur AI se summarize karta hai. Quiz generation ke liye use hota hai (direct URL se quiz generate karne ke liye).

**Note**: Yeh API **single URL se content extract karta hai**. Multiple URLs ke liye topic extraction API use karo, phir quiz generation API me selected topics bhejo.

**Request Headers**:
```
Content-Type: application/json
X-User-Id: user-123
```

**Request Body**:
```json
{
  "url": "https://example.com/page",
  "userId": "user-123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL to extract content from (must be valid HTTP/HTTPS URL) |
| `userId` | string | Yes | User ID for tracking |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "content": "Extracted and cleaned content text... This is the educational content that will be used for quiz generation. All irrelevant content like navigation, ads, and footers have been removed.",
    "pageTitle": "Page Title",
    "source": "https://example.com/page",
    "extractedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `content` | string | Extracted and cleaned content text (AI-summarized) |
| `pageTitle` | string | Page title extracted from HTML |
| `source` | string | Original URL |
| `extractedAt` | string | ISO 8601 timestamp of extraction |

**Error Responses**:

**400 Bad Request** - Invalid URL:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL format",
    "details": "URL must be a valid HTTP or HTTPS URL"
  }
}
```

**400 Bad Request** - Content extraction failed:
```json
{
  "success": false,
  "error": {
    "code": "CONTENT_EXTRACTION_FAILED",
    "message": "Failed to extract content from URL",
    "details": "No content found in the page"
  }
}
```

**500 Internal Server Error** - Processing failed:
```json
{
  "success": false,
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "Failed to process content",
    "details": "AI summarization failed: Rate limit exceeded"
  }
}
```

**Request Headers**:
```
Content-Type: application/json
X-User-Id: user-123
```

**Request Body**:
```json
{
  "url": "https://example.com/documentation",
  "userId": "user-123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Documentation URL (must be valid HTTP/HTTPS URL) |
| `userId` | string | Yes | User ID for tracking |

**Success Response (200 OK)**:
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
        "title": "Getting Started",
        "url": "https://example.com/getting-started",
        "description": "Quick start guide",
        "section": "Basics"
      },
      {
        "id": "topic-3",
        "title": "Advanced Concepts",
        "url": "https://example.com/advanced",
        "description": "Advanced topics and concepts",
        "section": "Advanced"
      }
    ],
    "mainUrl": "https://example.com/documentation",
    "totalPages": 3
  }
}
```

**Topic Object Structure**:
```json
{
  "id": "string",
  "title": "string",
  "url": "string",
  "description": "string (optional)",
  "section": "string (optional)"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `topics` | array | Array of topic objects (organized by sections) - **Har topic me URL hoga jo quiz generation ke liye use hoga** |
| `mainUrl` | string | Original documentation URL |
| `totalPages` | integer | Total number of topics found |

**Note**: Har topic object me `url` field **mandatory** hai kyunki yeh URL baad me quiz generation ke liye use hogi.

**Error Responses**:

**400 Bad Request** - Invalid URL:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL format",
    "details": "URL must be a valid HTTP or HTTPS URL"
  }
}
```

**400 Bad Request** - URL fetch failed:
```json
{
  "success": false,
  "error": {
    "code": "URL_FETCH_FAILED",
    "message": "Failed to fetch URL",
    "details": "Connection timeout after 30 seconds"
  }
}
```

**404 Not Found** - No topics found:
```json
{
  "success": false,
  "error": {
    "code": "NO_TOPICS_FOUND",
    "message": "No topics found in documentation",
    "details": "Could not extract any valid links from the page"
  }
}
```

**500 Internal Server Error** - Topic extraction failed:
```json
{
  "success": false,
  "error": {
    "code": "TOPIC_EXTRACTION_FAILED",
    "message": "Failed to extract topics",
    "details": "AI organization failed: Invalid response format"
  }
}
```

---

## 🔄 API Workflow Examples

### Example 1: Complete Quiz Generation Flow (with Topic Selection)

```
STEP 1: Topic Extraction (Mindmap Creation) - PEHLI API
1. User URL bhejega:
   Frontend → TypeScript: POST /api/content/extract-topics
   { url: "https://docs.example.com" }

2. TypeScript → Python: POST /api/ai/content/extract-topics (PEHLI API)
   { url: "https://docs.example.com", userId: "user-123" }

3. Python Service (PEHLI API):
   - URL se HTML fetch (httpx)
   - HTML parse (beautifulsoup4)
   - Sare URLs extract (documentation ke sabhi links)
   - AI se organize (topics/sections me)
   - Sare topics with URLs return

4. Python → TypeScript: 
   { 
     topics: [
       { id: "topic-1", title: "Intro", url: "https://docs.example.com/intro", ... },
       { id: "topic-2", title: "Basics", url: "https://docs.example.com/basics", ... }
     ],
     mainUrl: "https://docs.example.com",
     totalPages: 10
   }

5. TypeScript → Frontend: { topics: [...], mainUrl: "...", totalPages: 10 }

6. Frontend: Topics show honge (TopicSelector component)
   - User topics select karega
   - "Continue" click karega

STEP 2: Quiz Generation - DOOSRI API
7. User selected topics bhejega:
   Frontend → TypeScript: POST /api/quiz-generation/generate-from-url
   {
     selectedTopics: [
       { id: "topic-1", title: "Intro", url: "https://docs.example.com/intro", ... },
       { id: "topic-2", title: "Basics", url: "https://docs.example.com/basics", ... }
     ],
     difficulty: "medium",
     numberOfQuestions: 10,
     timeDuration: 3600
   }

8. TypeScript → Python: POST /api/ai/quiz/generate-from-url (DOOSRI API)
   {
     selectedTopics: [
       { id: "topic-1", url: "https://docs.example.com/intro", ... },
       { id: "topic-2", url: "https://docs.example.com/basics", ... }
     ],  // Selected topics with URLs (pehli API se aaye huye)
     difficulty: "medium",
     numberOfQuestions: 10,
     userId: "user-123"
   }

9. Python Service (DOOSRI API):
   - Selected topics ke URLs se content fetch
     * https://docs.example.com/intro → content fetch
     * https://docs.example.com/basics → content fetch
   - Content combine karega
   - AI se quiz questions generate karega

10. Python → TypeScript: { questions: [...], quizName: "...", metadata: {...} }

11. TypeScript:
    - Quiz database me save (MongoDB)
    - Quiz ID return

12. TypeScript → Frontend: { quizId: "...", questions: [...], metadata: {...} }

STEP 3: Quiz Attempt
13. User quiz attempt karega:
    Frontend → TypeScript: POST /api/quizzes/{quizId}/answer
    - Answers save honge
    - Quiz complete hoga
    - Analysis generate hoga
```

### Example 2: Direct Quiz Generation (without Topic Selection)

```
1. User direct URL bhejega:
   Frontend → TypeScript: POST /api/quiz-generation/generate-from-url
   { url: "https://docs.example.com", difficulty: "medium", numberOfQuestions: 10 }

2. TypeScript → Python: POST /api/ai/quiz/generate-from-url
   { url: "https://docs.example.com", difficulty: "medium", numberOfQuestions: 10, userId: "..." }

3. Python Service:
   - URL se content fetch
   - AI se quiz questions generate

4. Python → TypeScript: { questions: [...], quizName: "...", metadata: {...} }

5. TypeScript: Quiz database me save

6. TypeScript → Frontend: { quizId: "...", questions: [...] }
```

### Example 3: Document-Based Quiz

```
1. Generate Quiz from Document:
   POST /api/ai/quiz/generate-from-document
   → Returns questions
```

### Example 4: Quiz Analysis (After Quiz Attempt)

```
1. User quiz complete karta hai:
   Frontend → TypeScript: POST /api/quizzes/{quizId}/finish
   - Answers save hote hain
   - Quiz status: "completed"

2. TypeScript → Python: POST /api/ai/quiz/analyze
   {
     quiz: { questions: [...], configuration: {...} },
     answers: { "q-1": "A", "q-2": "B", ... },
     originalContent: "...",
     userId: "user-123"
   }

3. Python Service:
   - AI se analysis generate
   - Performance review, weak areas, suggestions

4. Python → TypeScript: { performanceReview: "...", weakAreas: [...], suggestions: [...], ... }

5. TypeScript:
   - Analysis database me save (quiz.analysis field me)
   - Response return

6. TypeScript → Frontend: { analysis: {...} }
```

---

## ⚠️ Error Codes Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_INPUT` | 400 | Invalid request parameters |
| `INVALID_DIFFICULTY` | 400 | Invalid difficulty level |
| `INVALID_QUESTION_COUNT` | 400 | Question count out of range |
| `INVALID_URL` | 400 | Invalid URL format |
| `EMPTY_DOCUMENT` | 400 | Document content is empty |
| `DOCUMENT_TOO_SHORT` | 400 | Document content too short |
| `INVALID_QUIZ_DATA` | 400 | Invalid quiz data structure |
| `MISSING_ANSWERS` | 400 | Answers not provided |
| `URL_FETCH_FAILED` | 400 | Failed to fetch URL |
| `NO_TOPICS_FOUND` | 404 | No topics found in documentation |
| `QUIZ_GENERATION_FAILED` | 500 | Quiz generation process failed |
| `ANALYSIS_FAILED` | 500 | Quiz analysis failed |
| `TOPIC_EXTRACTION_FAILED` | 500 | Topic extraction failed |
| `CONTENT_EXTRACTION_FAILED` | 500 | Content extraction failed |
| `PROCESSING_FAILED` | 500 | General processing error |

---

## 📝 Request/Response Validation Rules

### Topic Extraction (Pehli API)
- `url`: Must be valid HTTP/HTTPS URL
- Response me har topic me `url` field **mandatory** hai (quiz generation ke liye zaroori)
- **Pehli API se jo URLs aayengi, wahi URLs doosri API (quiz generation) me use hongi**

### Quiz Generation (Doosri API)
- `difficulty`: Must be exactly `"easy"`, `"medium"`, or `"hard"` (case-sensitive)
- `numberOfQuestions`: Must be integer between 1 and 100
- `url` OR `selectedTopics`: At least one must be provided
- `selectedTopics`: Must be non-empty array if provided
- **Each topic in `selectedTopics` must have `url` field** (mandatory - content fetch ke liye)
- **Selected topics ke URLs pehli API (topic extraction) se aayengi**
- Each topic in `selectedTopics` must have `id`, `title`, and `url` (minimum required fields)

### Quiz Analysis (Teesri API)
- `quiz.questions`: Must be non-empty array
- `answers`: Must be non-empty object
- Each question must have `id`, `text`, `options`, `correctAnswer`, `difficulty`
- `options` array must have exactly 4 elements
- `correctAnswer` must be one of the options

### Content Extraction (Chauthi API)
- `url`: Must be valid HTTP/HTTPS URL
- URL must be accessible (not return 404, 500, etc.)
- URL must return HTML content (not binary files)
- **Pehli API (Topic Extraction)**: Returns topics with URLs - yeh URLs baad me quiz generation ke liye use hongi
- **Doosri API (Quiz Generation)**: Selected topics ke URLs se content fetch karega - har URL valid aur accessible honi chahiye

---

## 🔐 Security Considerations

1. **User ID Validation**: Always validate `X-User-Id` header
2. **URL Validation**: Validate URLs to prevent SSRF attacks
3. **Rate Limiting**: Implement rate limiting per user
4. **Content Size Limits**: Limit document size and URL content size
5. **Timeout Handling**: Set appropriate timeouts for external requests

---

## 📊 Response Time Expectations

| API Endpoint | Expected Response Time | Notes |
|--------------|----------------------|-------|
| Extract Topics (Pehli API) | 10-30 seconds | URL se HTML fetch + links extract + AI organization |
| Extract Content | 5-15 seconds | Single URL se content extract |
| Generate Quiz (Selected Topics - Doosri API) | 30-90 seconds | Multiple URLs se content fetch + combine + quiz generation (pehli API se aaye huye URLs se) |
| Generate Quiz (Single URL) | 20-60 seconds | Single URL se content fetch + quiz generation |
| Generate Quiz (Document) | 15-45 seconds | Direct document text se quiz generation |
| Analyze Quiz | 10-30 seconds | AI analysis generation |

**Note**: Response times depend on:
- Content size
- **Number of selected topics/URLs** (more URLs = more time)
- AI provider response time
- Network latency
- **Quiz Generation with multiple selected topics takes longer** (har URL se content fetch karna padta hai)

---

## 🧪 Testing Examples

### cURL Examples

#### Extract Topics
```bash
curl -X POST http://localhost:8000/api/ai/content/extract-topics \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "url": "https://docs.python.org/3/tutorial/",
    "userId": "user-123"
  }'
```

#### Generate Quiz from URL
```bash
curl -X POST http://localhost:8000/api/ai/quiz/generate-from-url \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "url": "https://docs.python.org/3/tutorial/",
    "difficulty": "medium",
    "numberOfQuestions": 10,
    "userId": "user-123"
  }'
```

#### Analyze Quiz
```bash
curl -X POST http://localhost:8000/api/ai/quiz/analyze \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "quiz": { ... },
    "answers": { ... },
    "userId": "user-123"
  }'
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-01  
**Author**: Development Team

