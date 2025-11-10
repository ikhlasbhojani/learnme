# Node.js Backend API Requirements & Documentation

## 📋 Overview

Yeh document Node.js backend ki sabhi APIs ki complete documentation hai. Har API ke liye request parameters, response format, authentication requirements, aur error handling details diye gaye hain.

**Note**: Yeh backend **Node.js me banega** (TypeScript nahi). Express.js framework use hoga.

---

## 🌐 Base Configuration

### Base URL
```
http://localhost:5000/api
```

### Authentication
- JWT tokens use honge
- Token HTTP-only cookie me store hoga
- Alternative: `Authorization: Bearer <token>` header
- Protected routes me `authenticate` middleware use hoga

### Common Headers
```
Content-Type: application/json
Cookie: token=<jwt-token>  // For authenticated requests
// OR
Authorization: Bearer <jwt-token>
```

### Common Response Format
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Common Error Format
```json
{
  "message": "Error message",
  "error": "Error details"
}
```

---

## 📡 API Endpoints

### 1. Authentication APIs

#### 1.1 User Signup

**Endpoint**: `POST /api/auth/signup`

**Description**: New user account create karta hai aur authentication token return karta hai.

**Authentication**: Not required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "themePreference": "dark"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Valid email address (unique) |
| `password` | string | Yes | Password (min 8 chars, 1 uppercase, 1 number) |
| `themePreference` | string | No | Theme preference: `"light"`, `"dark"`, `"blue"`, or `"green"` |

**Success Response (201 Created)**:
```json
{
  "message": "Signup successful",
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "themePreference": "dark",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `user.id` | string | User unique ID |
| `user.email` | string | User email address |
| `user.themePreference` | string \| null | User theme preference |
| `user.createdAt` | string | Account creation timestamp |
| `user.updatedAt` | string | Last update timestamp |
| `token` | string | JWT authentication token |

**Cookie Set**: HTTP-only cookie `token` set hoga (7 days expiry)

**Error Responses**:

**400 Bad Request** - Invalid input:
```json
{
  "message": "Invalid input",
  "error": "Password must be at least 8 characters"
}
```

**400 Bad Request** - Email already exists:
```json
{
  "message": "Email already registered",
  "error": "User with this email already exists"
}
```

**500 Internal Server Error**:
```json
{
  "message": "Signup failed",
  "error": "Internal server error"
}
```

---

#### 1.2 User Login

**Endpoint**: `POST /api/auth/login`

**Description**: Existing user ko authenticate karta hai aur token return karta hai.

**Authentication**: Not required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |

**Success Response (200 OK)**:
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "themePreference": "dark",
      "lastLoginAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookie Set**: HTTP-only cookie `token` set hoga (7 days expiry)

**Error Responses**:

**401 Unauthorized** - Invalid credentials:
```json
{
  "message": "Invalid credentials",
  "error": "Email or password is incorrect"
}
```

**400 Bad Request** - Missing fields:
```json
{
  "message": "Invalid input",
  "error": "Email is required"
}
```

---

#### 1.3 User Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: User ko logout karta hai aur authentication cookie clear karta hai.

**Authentication**: Not required (public endpoint, but cookie clear karega)

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

**Cookie Cleared**: HTTP-only cookie `token` clear hoga

---

#### 1.4 Get Current User

**Endpoint**: `GET /api/auth/me`

**Description**: Current authenticated user ka profile fetch karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
// OR
Authorization: Bearer <jwt-token>
```

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "themePreference": "dark",
    "lastLoginAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:

**401 Unauthorized** - Invalid or missing token:
```json
{
  "message": "Authentication required",
  "error": "Invalid or expired token"
}
```

**404 Not Found** - User not found:
```json
{
  "message": "User not found",
  "error": "User account does not exist"
}
```

---

#### 1.5 Update User Profile

**Endpoint**: `PATCH /api/auth/me`

**Description**: Current user ka profile update karta hai (currently sirf theme preference).

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "themePreference": "light"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `themePreference` | string | No | Theme preference: `"light"`, `"dark"`, `"blue"`, or `"green"` |

**Success Response (200 OK)**:
```json
{
  "message": "Profile updated",
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "themePreference": "light",
    "lastLoginAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:01Z"
  }
}
```

**Error Responses**:

**401 Unauthorized** - Authentication required:
```json
{
  "message": "Authentication required",
  "error": "Invalid or expired token"
}
```

**400 Bad Request** - Invalid theme preference:
```json
{
  "message": "Invalid input",
  "error": "Theme preference must be light, dark, blue, or green"
}
```

---

### 2. Content Management APIs

#### 2.1 Extract Topics from Documentation (Proxy to Python)

**Endpoint**: `POST /api/content/extract-topics`

**Description**: 
- User URL bhejega
- Node.js backend URL ko Python service ko forward karega
- Python service se topics receive karega
- Topics ko frontend ko return karega

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "url": "https://docs.example.com/documentation"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Documentation URL (must be valid HTTP/HTTPS URL) |

**Internal Flow**:
1. Node.js backend URL validate karega
2. Node.js backend → Python Service: `POST /api/ai/content/extract-topics`
   ```json
   {
     "url": "https://docs.example.com/documentation",
     "userId": "user-123"
   }
   ```
3. Python service se response receive karega
4. Response ko frontend ko forward karega

**Success Response (200 OK)**:
```json
{
  "message": "Topics extracted successfully",
  "data": {
    "topics": [
      {
        "id": "topic-1",
        "title": "Introduction",
        "url": "https://docs.example.com/intro",
        "description": "Introduction to the topic",
        "section": "Basics"
      },
      {
        "id": "topic-2",
        "title": "Getting Started",
        "url": "https://docs.example.com/getting-started",
        "description": "Quick start guide",
        "section": "Basics"
      }
    ],
    "mainUrl": "https://docs.example.com/documentation",
    "totalPages": 10
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid URL:
```json
{
  "message": "Invalid URL format",
  "error": "URL must be a valid HTTP or HTTPS URL"
}
```

**500 Internal Server Error** - Python service error:
```json
{
  "message": "Failed to extract topics",
  "error": "Python service error: Connection timeout"
}
```

---

#### 2.2 List Content Inputs

**Endpoint**: `GET /api/content`

**Description**: User ke saare content inputs list karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**Request Body**: None

**Query Parameters**: None

**Success Response (200 OK)**:
```json
{
  "message": "Content retrieved",
  "data": [
    {
      "id": "content-1",
      "userId": "user-123",
      "type": "url",
      "source": "https://docs.example.com",
      "content": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "content-2",
      "userId": "user-123",
      "type": "file",
      "source": "uploaded-document",
      "content": "Document content text...",
      "createdAt": "2024-01-01T00:00:01Z",
      "updatedAt": "2024-01-01T00:00:01Z"
    }
  ]
}
```

**Content Input Object Structure**:
```json
{
  "id": "string",
  "userId": "string",
  "type": "url" | "file" | "manual",
  "source": "string",
  "content": "string | null",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

#### 2.3 Create Content Input

**Endpoint**: `POST /api/content`

**Description**: New content input create karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "type": "url",
  "source": "https://docs.example.com",
  "content": null
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Content type: `"url"`, `"file"`, or `"manual"` |
| `source` | string | Yes | Content source (URL, filename, or manual identifier) |
| `content` | string | No | Content text (for file/manual type) |

**Success Response (201 Created)**:
```json
{
  "message": "Content created",
  "data": {
    "id": "content-1",
    "userId": "user-123",
    "type": "url",
    "source": "https://docs.example.com",
    "content": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 2.4 Get Content Input by ID

**Endpoint**: `GET /api/content/:id`

**Description**: Specific content input fetch karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Content input ID |

**Success Response (200 OK)**:
```json
{
  "message": "Content retrieved",
  "data": {
    "id": "content-1",
    "userId": "user-123",
    "type": "url",
    "source": "https://docs.example.com",
    "content": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "message": "Content not found",
  "error": "Content input with this ID does not exist"
}
```

---

#### 2.5 Update Content Input

**Endpoint**: `PATCH /api/content/:id`

**Description**: Content input update karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Content input ID |

**Request Body**:
```json
{
  "source": "https://docs.example.com/updated",
  "content": "Updated content text..."
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | No | Updated source |
| `content` | string | No | Updated content text |

**Success Response (200 OK)**:
```json
{
  "message": "Content updated",
  "data": {
    "id": "content-1",
    "userId": "user-123",
    "type": "url",
    "source": "https://docs.example.com/updated",
    "content": "Updated content text...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:01Z"
  }
}
```

---

#### 2.6 Delete Content Input

**Endpoint**: `DELETE /api/content/:id`

**Description**: Content input delete karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Content input ID |

**Success Response (200 OK)**:
```json
{
  "message": "Content deleted",
  "data": {
    "id": "content-1"
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "message": "Content not found",
  "error": "Content input with this ID does not exist"
}
```

---

### 3. Quiz Generation APIs (Proxy to Python)

#### 3.1 Generate Quiz from URL/Selected Topics

**Endpoint**: `POST /api/quiz-generation/generate-from-url`

**Description**: 
- User selected topics (URLs) bhejega
- Node.js backend selected topics ko Python service ko forward karega
- Python service se questions receive karega
- Quiz ko database me save karega
- Quiz ID aur questions return karega

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "url": "https://docs.example.com",
  "selectedTopics": [
    {
      "id": "topic-1",
      "title": "Introduction",
      "url": "https://docs.example.com/intro",
      "description": "Introduction section",
      "section": "Basics"
    },
    {
      "id": "topic-2",
      "title": "Advanced Concepts",
      "url": "https://docs.example.com/advanced",
      "description": "Advanced topics",
      "section": "Advanced"
    }
  ],
  "difficulty": "medium",
  "numberOfQuestions": 10,
  "timeDuration": 3600
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | No* | Single URL (*required if selectedTopics not provided) |
| `selectedTopics` | array | No* | Array of selected topics (*required if url not provided) |
| `difficulty` | string | Yes | Difficulty: `"easy"`, `"medium"`, or `"hard"` |
| `numberOfQuestions` | integer | Yes | Number of questions (1-100) |
| `timeDuration` | integer | No | Time duration in seconds (60-7200, default: 3600) |

**Internal Flow**:
1. Node.js backend request validate karega
2. ContentInput create/update karega (if needed)
3. Node.js backend → Python Service: `POST /api/ai/quiz/generate-from-url`
   ```json
   {
     "url": "...",
     "selectedTopics": [...],
     "difficulty": "medium",
     "numberOfQuestions": 10,
     "userId": "user-123"
   }
   ```
4. Python service se questions receive karega
5. Quiz database me save karega
6. Response return karega

**Success Response (201 Created)**:
```json
{
  "message": "Quiz generated successfully",
  "data": {
    "quizId": "quiz-456",
    "questions": [
      {
        "id": "q-1",
        "text": "What is the main purpose of...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "difficulty": "Normal",
        "explanation": "Explanation text here",
        "codeSnippet": null,
        "imageReference": null
      }
    ],
    "metadata": {
      "source": "https://docs.example.com/documentation",
      "difficulty": "medium",
      "requestedQuestions": 10,
      "generatedQuestions": 10,
      "extractedAt": "2024-01-01T00:00:00Z",
      "generatedAt": "2024-01-01T00:00:01Z"
    }
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid input:
```json
{
  "message": "Invalid input",
  "error": "Either URL or selectedTopics must be provided"
}
```

**500 Internal Server Error** - Python service error:
```json
{
  "message": "Failed to generate quiz",
  "error": "Python service error: Quiz generation failed"
}
```

---

#### 3.2 Generate Quiz from Document

**Endpoint**: `POST /api/quiz-generation/generate-from-document`

**Description**: 
- User document text bhejega
- Node.js backend document ko Python service ko forward karega
- Python service se questions receive karega
- Quiz ko database me save karega

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "document": "Full document text content here...",
  "difficulty": "medium",
  "numberOfQuestions": 15,
  "timeDuration": 3600
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | Yes | Document text content (min 10 characters) |
| `difficulty` | string | Yes | Difficulty: `"easy"`, `"medium"`, or `"hard"` |
| `numberOfQuestions` | integer | Yes | Number of questions (1-100) |
| `timeDuration` | integer | No | Time duration in seconds (60-7200, default: 3600) |

**Internal Flow**:
1. Node.js backend request validate karega
2. ContentInput create karega (type: "file")
3. Node.js backend → Python Service: `POST /api/ai/quiz/generate-from-document`
   ```json
   {
     "document": "...",
     "difficulty": "medium",
     "numberOfQuestions": 15,
     "userId": "user-123"
   }
   ```
4. Python service se questions receive karega
5. Quiz database me save karega
6. Response return karega

**Success Response (201 Created)**:
```json
{
  "message": "Quiz generated successfully",
  "data": {
    "quizId": "quiz-789",
    "questions": [...],
    "metadata": {...}
  }
}
```

---

### 4. Quiz Management APIs

#### 4.1 List Quizzes

**Endpoint**: `GET /api/quizzes`

**Description**: User ke saare quizzes list karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**Query Parameters**: None

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "quiz-1",
      "userId": "user-123",
      "contentInputId": "content-1",
      "name": "Python Tutorial Quiz",
      "configuration": {
        "difficulty": "Normal",
        "numberOfQuestions": 10,
        "timeDuration": 3600
      },
      "questions": [...],
      "answers": {},
      "status": "pending",
      "score": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 4.2 Create Quiz (Manual)

**Endpoint**: `POST /api/quizzes`

**Description**: Manual quiz create karta hai (AI generation ke bina).

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "configuration": {
    "difficulty": "Normal",
    "numberOfQuestions": 10,
    "timeDuration": 3600
  },
  "contentInputId": "content-1"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configuration` | object | Yes | Quiz configuration |
| `configuration.difficulty` | string | Yes | Difficulty: `"Easy"`, `"Normal"`, `"Hard"`, or `"Master"` |
| `configuration.numberOfQuestions` | integer | Yes | Number of questions (1-50) |
| `configuration.timeDuration` | integer | Yes | Time duration in seconds (60-7200) |
| `contentInputId` | string | No | Associated content input ID |

**Success Response (201 Created)**:
```json
{
  "message": "Quiz created",
  "data": {
    "id": "quiz-1",
    "userId": "user-123",
    "contentInputId": "content-1",
    "name": null,
    "configuration": {...},
    "questions": [],
    "answers": {},
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 4.3 Get Quiz by ID

**Endpoint**: `GET /api/quizzes/:id`

**Description**: Specific quiz fetch karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "userId": "user-123",
    "contentInputId": "content-1",
    "name": "Python Tutorial Quiz",
    "configuration": {...},
    "questions": [...],
    "answers": {...},
    "status": "in-progress",
    "score": null,
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "message": "Quiz not found",
  "error": "Quiz with this ID does not exist"
}
```

**403 Forbidden** - Not owner:
```json
{
  "message": "Access denied",
  "error": "You are not allowed to access this quiz"
}
```

---

#### 4.4 Start Quiz

**Endpoint**: `POST /api/quizzes/:id/start`

**Description**: Quiz start karta hai, status `in-progress` set karta hai, aur start time record karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "status": "in-progress",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": null,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Quiz already started:
```json
{
  "message": "Quiz already started",
  "error": "Quiz is already in progress"
}
```

**400 Bad Request** - Quiz completed:
```json
{
  "message": "Quiz already completed",
  "error": "Cannot start a completed quiz"
}
```

---

#### 4.5 Answer Question

**Endpoint**: `POST /api/quizzes/:id/answer`

**Description**: Quiz question ka answer save karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Request Body**:
```json
{
  "questionId": "q-1",
  "answer": "Option A"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `questionId` | string | Yes | Question ID |
| `answer` | string | Yes | Selected answer |

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "answers": {
      "q-1": "Option A",
      "q-2": "Option B"
    },
    "updatedAt": "2024-01-01T00:00:01Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Quiz not started:
```json
{
  "message": "Quiz not started",
  "error": "Quiz must be started before answering questions"
}
```

**400 Bad Request** - Invalid question ID:
```json
{
  "message": "Invalid question",
  "error": "Question ID does not exist in this quiz"
}
```

---

#### 4.6 Pause Quiz

**Endpoint**: `POST /api/quizzes/:id/pause`

**Description**: Quiz pause karta hai (tab change ya manual pause).

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Request Body**:
```json
{
  "reason": "tab-change"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | string | No | Pause reason: `"tab-change"` or `"manual"` (default: `"tab-change"`) |

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "status": "in-progress",
    "pauseReason": "tab-change",
    "pausedAt": "2024-01-01T00:00:05Z",
    "pauseCount": 1,
    "updatedAt": "2024-01-01T00:00:05Z"
  }
}
```

---

#### 4.7 Resume Quiz

**Endpoint**: `POST /api/quizzes/:id/resume`

**Description**: Paused quiz ko resume karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "status": "in-progress",
    "pauseReason": null,
    "pausedAt": null,
    "updatedAt": "2024-01-01T00:00:10Z"
  }
}
```

---

#### 4.8 Finish Quiz

**Endpoint**: `POST /api/quizzes/:id/finish`

**Description**: Quiz complete karta hai, score calculate karta hai, aur Python service ko analysis ke liye call karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Request Body**: None

**Internal Flow**:
1. Quiz status `completed` set karega
2. Score calculate karega (correct/incorrect count)
3. End time record karega
4. Node.js backend → Python Service: `POST /api/ai/quiz/analyze`
   ```json
   {
     "quiz": {...},
     "answers": {...},
     "originalContent": "...",
     "userId": "user-123"
   }
   ```
5. Python service se analysis receive karega
6. Analysis quiz me save karega
7. Response return karega

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "status": "completed",
    "score": 70,
    "correctCount": 7,
    "incorrectCount": 3,
    "endTime": "2024-01-01T00:30:00Z",
    "analysis": {
      "performanceReview": "You scored 70% which is above average...",
      "weakAreas": ["Topic 1", "Topic 2"],
      "suggestions": ["Suggestion 1", "Suggestion 2"],
      "strengths": ["Strength 1"],
      "improvementAreas": ["Area 1"],
      "detailedAnalysis": "Detailed analysis text...",
      "topicsToReview": ["Topic A"],
      "analyzedAt": "2024-01-01T00:30:01Z"
    },
    "updatedAt": "2024-01-01T00:30:01Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Quiz not started:
```json
{
  "message": "Quiz not started",
  "error": "Quiz must be started before finishing"
}
```

**500 Internal Server Error** - Analysis failed:
```json
{
  "message": "Failed to generate analysis",
  "error": "Python service error: Analysis failed"
}
```

---

#### 4.9 Expire Quiz

**Endpoint**: `POST /api/quizzes/:id/expire`

**Description**: Quiz ko expire mark karta hai (time limit exceeded).

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "quiz-1",
    "status": "expired",
    "endTime": "2024-01-01T01:00:00Z",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

---

#### 4.10 Get Quiz Assessment

**Endpoint**: `GET /api/quizzes/:id/assessment`

**Description**: Completed quiz ka assessment/analysis fetch karta hai.

**Authentication**: Required (JWT token)

**Request Headers**:
```
Cookie: token=<jwt-token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID |

**Success Response (200 OK)**:
```json
{
  "data": {
    "score": 70,
    "correctCount": 7,
    "incorrectCount": 3,
    "unansweredCount": 0,
    "performanceReview": "You scored 70% which is above average...",
    "weakAreas": ["Topic 1", "Topic 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "strengths": ["Strength 1"],
    "improvementAreas": ["Area 1"],
    "detailedAnalysis": "Detailed analysis text...",
    "topicsToReview": ["Topic A"]
  }
}
```

**Error Responses**:

**400 Bad Request** - Quiz not completed:
```json
{
  "message": "Quiz not completed",
  "error": "Quiz must be completed or expired before viewing assessment"
}
```

---

## 🔄 Complete API Flow Examples

### Example 1: Complete Quiz Generation Flow

```
STEP 1: Topic Extraction
1. Frontend → Node.js: POST /api/content/extract-topics
   { url: "https://docs.example.com" }

2. Node.js → Python: POST /api/ai/content/extract-topics
   { url: "...", userId: "user-123" }

3. Python → Node.js: { topics: [...], mainUrl: "...", totalPages: 10 }

4. Node.js → Frontend: { topics: [...], mainUrl: "...", totalPages: 10 }

STEP 2: User Selects Topics (Frontend)

STEP 3: Quiz Generation
5. Frontend → Node.js: POST /api/quiz-generation/generate-from-url
   {
     selectedTopics: [...],
     difficulty: "medium",
     numberOfQuestions: 10,
     timeDuration: 3600
   }

6. Node.js → Python: POST /api/ai/quiz/generate-from-url
   {
     selectedTopics: [...],
     difficulty: "medium",
     numberOfQuestions: 10,
     userId: "user-123"
   }

7. Python → Node.js: { questions: [...], quizName: "...", metadata: {...} }

8. Node.js: Quiz database me save

9. Node.js → Frontend: { quizId: "...", questions: [...], metadata: {...} }

STEP 4: Quiz Attempt
10. Frontend → Node.js: POST /api/quizzes/{quizId}/start

11. Frontend → Node.js: POST /api/quizzes/{quizId}/answer
    { questionId: "q-1", answer: "Option A" }

12. Frontend → Node.js: POST /api/quizzes/{quizId}/finish

13. Node.js → Python: POST /api/ai/quiz/analyze
    { quiz: {...}, answers: {...}, originalContent: "...", userId: "..." }

14. Python → Node.js: { performanceReview: "...", weakAreas: [...], ... }

15. Node.js: Analysis database me save

16. Node.js → Frontend: { analysis: {...} }
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704672000
}
```

### Token Expiry
- Token expiry: 7 days
- Cookie expiry: 7 days

### Protected Routes
- All routes except `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout` require authentication
- `authenticate` middleware check karega:
  1. Token cookie ya Authorization header se token extract
  2. Token verify karega
  3. User database se fetch karega
  4. `req.authUser` me user set karega

---

## 🔗 Python Service Integration

### Python Service Client
Node.js backend me Python service ko call karne ke liye HTTP client hoga:

**Environment Variable**:
```env
PYTHON_SERVICE_URL=http://localhost:8000
```

**Python Service Calls**:
1. `POST ${PYTHON_SERVICE_URL}/api/ai/content/extract-topics`
2. `POST ${PYTHON_SERVICE_URL}/api/ai/quiz/generate-from-url`
3. `POST ${PYTHON_SERVICE_URL}/api/ai/quiz/generate-from-document`
4. `POST ${PYTHON_SERVICE_URL}/api/ai/quiz/analyze`

**Headers**:
```
Content-Type: application/json
X-User-Id: user-id-here
```

---

## ⚠️ Error Codes Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_INPUT` | 400 | Invalid request parameters |
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication token |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `ACCESS_DENIED` | 403 | User not authorized to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists (e.g., email) |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `PYTHON_SERVICE_ERROR` | 500 | Python service call failed |

---

## 📝 Request/Response Validation Rules

### Authentication
- Email: Valid email format, unique
- Password: Min 8 chars, 1 uppercase, 1 number
- Theme Preference: Must be `"light"`, `"dark"`, `"blue"`, or `"green"`

### Quiz Generation
- Difficulty: Must be `"easy"`, `"medium"`, or `"hard"`
- Number of Questions: Integer between 1 and 100
- Time Duration: Integer between 60 and 7200 seconds
- URL OR selectedTopics: At least one required
- Selected Topics: Each topic must have `id`, `title`, and `url`

### Quiz Management
- Quiz Status: `"pending"`, `"in-progress"`, `"completed"`, or `"expired"`
- Difficulty: `"Easy"`, `"Normal"`, `"Hard"`, or `"Master"`
- Question ID: Must exist in quiz questions array
- Answer: Must be one of the question options

---

## 🗄️ Database Models

### User Model
```javascript
{
  id: String,
  email: String (unique),
  passwordHash: String,
  themePreference: String | null,
  lastLoginAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### ContentInput Model
```javascript
{
  id: String,
  userId: String,
  type: "url" | "file" | "manual",
  source: String,
  content: String | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz Model
```javascript
{
  id: String,
  userId: String,
  contentInputId: String | null,
  name: String | null,
  configuration: {
    difficulty: "Easy" | "Normal" | "Hard" | "Master",
    numberOfQuestions: Number,
    timeDuration: Number
  },
  questions: [{
    id: String,
    text: String,
    options: [String],
    correctAnswer: String,
    difficulty: String,
    explanation: String | null,
    codeSnippet: String | null,
    imageReference: String | null
  }],
  answers: Object,
  status: "pending" | "in-progress" | "completed" | "expired",
  score: Number | null,
  correctCount: Number | null,
  incorrectCount: Number | null,
  startTime: Date | null,
  endTime: Date | null,
  pauseReason: "tab-change" | "manual" | null,
  pausedAt: Date | null,
  pauseCount: Number,
  analysis: {
    performanceReview: String,
    weakAreas: [String],
    suggestions: [String],
    strengths: [String],
    improvementAreas: [String],
    detailedAnalysis: String,
    topicsToReview: [String],
    analyzedAt: Date
  } | null,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing Examples

### cURL Examples

#### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "themePreference": "dark"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

#### Extract Topics (with cookie)
```bash
curl -X POST http://localhost:5000/api/content/extract-topics \
  -H "Content-Type: application/json" \
  -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "url": "https://docs.python.org/3/tutorial/"
  }'
```

#### Generate Quiz (with cookie)
```bash
curl -X POST http://localhost:5000/api/quiz-generation/generate-from-url \
  -H "Content-Type: application/json" \
  -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "selectedTopics": [
      {
        "id": "topic-1",
        "title": "Introduction",
        "url": "https://docs.python.org/3/tutorial/introduction.html"
      }
    ],
    "difficulty": "medium",
    "numberOfQuestions": 10,
    "timeDuration": 3600
  }'
```

---

## 📊 Response Time Expectations

| API Endpoint | Expected Response Time | Notes |
|--------------|----------------------|-------|
| Auth APIs | < 1 second | Database operations only |
| Extract Topics | 10-30 seconds | Python service call included |
| Generate Quiz | 30-90 seconds | Python service call + database save |
| Quiz Management | < 1 second | Database operations only |
| Finish Quiz | 10-30 seconds | Python analysis call included |

---

## 🔧 Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/learnme

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:5173

# Python Service
PYTHON_SERVICE_URL=http://localhost:8000
```

---

## 📚 API Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | User signup |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/logout` | No | User logout |
| GET | `/api/auth/me` | Yes | Get current user |
| PATCH | `/api/auth/me` | Yes | Update profile |
| POST | `/api/content/extract-topics` | Yes | Extract topics (proxy to Python) |
| GET | `/api/content` | Yes | List content inputs |
| POST | `/api/content` | Yes | Create content input |
| GET | `/api/content/:id` | Yes | Get content input |
| PATCH | `/api/content/:id` | Yes | Update content input |
| DELETE | `/api/content/:id` | Yes | Delete content input |
| POST | `/api/quiz-generation/generate-from-url` | Yes | Generate quiz from URL/topics (proxy to Python) |
| POST | `/api/quiz-generation/generate-from-document` | Yes | Generate quiz from document (proxy to Python) |
| GET | `/api/quizzes` | Yes | List quizzes |
| POST | `/api/quizzes` | Yes | Create quiz (manual) |
| GET | `/api/quizzes/:id` | Yes | Get quiz |
| POST | `/api/quizzes/:id/start` | Yes | Start quiz |
| POST | `/api/quizzes/:id/answer` | Yes | Answer question |
| POST | `/api/quizzes/:id/pause` | Yes | Pause quiz |
| POST | `/api/quizzes/:id/resume` | Yes | Resume quiz |
| POST | `/api/quizzes/:id/finish` | Yes | Finish quiz (calls Python for analysis) |
| POST | `/api/quizzes/:id/expire` | Yes | Expire quiz |
| GET | `/api/quizzes/:id/assessment` | Yes | Get quiz assessment |

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-01  
**Author**: Development Team

