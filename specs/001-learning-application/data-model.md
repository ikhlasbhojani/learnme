# Data Model: Learning Application

**Feature**: 001-learning-application  
**Date**: 2024-12-19  
**Phase**: 1 - Design

## Entities

### User

**Description**: Represents a student using the application. Stores authentication credentials and account information.

**Attributes**:
- `id`: string (UUID v4) - Unique identifier
- `email`: string - User email address (unique, required)
- `passwordHash`: string - Hashed password using Web Crypto API (required)
- `createdAt`: Date - Account creation timestamp
- `lastLoginAt`: Date | null - Last login timestamp (optional)

**Validation Rules**:
- Email must be valid format (RFC 5322 basic validation)
- Email must be unique (checked during signup)
- Password must meet policy: minimum 8 characters, at least one letter and one number (FR-001a)
- Password is hashed client-side before storage

**Relationships**:
- One-to-many with `QuizInstance` (user owns multiple quiz attempts)

**Storage**: localStorage key `learnme_user` (single user for MVP)

**State Transitions**:
- `unauthenticated` → `authenticated` (on login/signup)
- `authenticated` → `unauthenticated` (on logout)

---

### ContentInput

**Description**: Represents the learning material provided by the user via URL, file upload, or manual text input.

**Attributes**:
- `id`: string (UUID v4) - Unique identifier
- `type`: "url" | "file" | "manual" - Input type (required)
- `source`: string - URL string, file name, or manual text content (required)
- `content`: string | null - Extracted/processed content (optional, for future processing)
- `timestamp`: Date - When content was provided (required)
- `userId`: string - Reference to User.id (required)

**Validation Rules**:
- Type must be one of: "url", "file", "manual"
- URL type: source must be valid URL format (FR-007)
- File type: source must be file name, file size ≤ 5MB (FR-006a), file type must be PDF/DOC/TXT (FR-006)
- Manual type: source is text content, no validation constraints

**Relationships**:
- Many-to-one with `User` (user provides multiple content inputs)
- One-to-many with `QuizInstance` (content input can generate multiple quizzes)

**Storage**: Not persisted (ephemeral, used only during quiz configuration flow)

---

### QuizConfiguration

**Description**: Represents user's preferences for a quiz session: difficulty level, number of questions, and time duration.

**Attributes**:
- `difficulty`: "Easy" | "Normal" | "Hard" | "Master" - Difficulty level (required, FR-011)
- `numberOfQuestions`: number - Number of MCQs to generate (required, any positive number, FR-012)
- `timeDuration`: number - Time limit in seconds (required, any positive number, FR-013)

**Validation Rules**:
- Difficulty must be one of: "Easy", "Normal", "Hard", "Master"
- Number of questions must be positive number (> 0)
- Time duration must be positive number (> 0, in seconds)
- All fields required before quiz can start (FR-014)

**Relationships**:
- One-to-one with `QuizInstance` (configuration used to create quiz instance)

**Storage**: Part of QuizInstance state, not stored separately

---

### QuizInstance

**Description**: Represents a single quiz session with questions, answers, timer state, and completion status.

**Attributes**:
- `id`: string (UUID v4) - Unique identifier
- `userId`: string - Reference to User.id (required)
- `contentInputId`: string | null - Reference to ContentInput.id (optional, may be null for manual input)
- `configuration`: QuizConfiguration - Quiz configuration (required)
- `questions`: Question[] - Array of questions in quiz (required)
- `answers`: Record<string, string> - Map of questionId → selectedAnswer (required, empty initially)
- `startTime`: Date | null - Quiz start timestamp (null until started)
- `endTime`: Date | null - Quiz end timestamp (null until completed/expired)
- `status`: "pending" | "in-progress" | "completed" | "expired" - Quiz status (required)
- `score`: number | null - Final score percentage (null until completed)
- `correctCount`: number | null - Number of correct answers (null until completed)
- `incorrectCount`: number | null - Number of incorrect answers (null until completed)

**Validation Rules**:
- All required fields must be present
- Questions array length must match configuration.numberOfQuestions
- Answers map keys must be valid question IDs
- Status transitions: "pending" → "in-progress" → "completed" | "expired"
- Score calculated: (correctCount / totalQuestions) * 100

**Relationships**:
- Many-to-one with `User` (user has multiple quiz instances)
- One-to-one with `QuizConfiguration` (instance uses one configuration)
- One-to-many with `Question` (instance contains multiple questions)
- One-to-one with `AssessmentResult` (instance generates one result)

**Storage**: localStorage key `learnme_quiz_{quizId}` for in-progress quizzes, cleared on completion

**State Transitions**:
- `pending` → `in-progress` (on quiz start)
- `in-progress` → `completed` (on manual finish)
- `in-progress` → `expired` (on timer expiration, FR-016a)
- Resume capability: `in-progress` state persists across browser sessions (FR-016c, FR-016d)

---

### Question

**Description**: Represents a single MCQ question with options and correct answer.

**Attributes**:
- `id`: string (UUID v4) - Unique identifier
- `text`: string - Question text (required)
- `options`: string[] - Array of answer options (required, minimum 2 options)
- `correctAnswer`: string - Correct answer (must match one of options, required)
- `difficulty`: "Easy" | "Normal" | "Hard" | "Master" - Question difficulty level (required)
- `explanation`: string | null - Explanation for correct answer (optional, for future use)

**Validation Rules**:
- Question text must not be empty
- Options array must have at least 2 items
- Correct answer must be one of the options
- Difficulty must match one of the allowed values

**Relationships**:
- Many-to-one with `QuizInstance` (question belongs to one quiz instance)

**Storage**: Part of QuizInstance.questions array, not stored separately

---

### AssessmentResult

**Description**: Represents the results and analysis of a completed quiz, including performance review and suggestions.

**Attributes**:
- `quizInstanceId`: string - Reference to QuizInstance.id (required, unique)
- `totalScore`: number - Final score percentage (0-100, required)
- `correctCount`: number - Number of correct answers (required)
- `incorrectCount`: number - Number of incorrect answers (required)
- `unansweredCount`: number - Number of unanswered questions (required, for timer expiration)
- `performanceReview`: string - Text review of performance (required)
- `weakAreas`: string[] - Array of difficulty levels with poor performance (required)
- `suggestions`: string[] - Array of improvement suggestions (required)
- `generatedAt`: Date - When assessment was generated (required)

**Validation Rules**:
- Total score must be between 0 and 100
- Correct + incorrect + unanswered = total questions
- Weak areas identified by difficulty levels with <50% correct
- Suggestions generated based on weak areas and overall performance

**Relationships**:
- One-to-one with `QuizInstance` (result generated from one quiz instance)

**Storage**: Part of QuizInstance, displayed immediately after completion (FR-022, FR-023, FR-024, FR-025)

---

## Data Flow

### Authentication Flow
1. User signs up → `User` created → stored in localStorage
2. User logs in → `User` validated → session established
3. User logs out → session cleared

### Quiz Flow
1. User provides content → `ContentInput` created (ephemeral)
2. User configures quiz → `QuizConfiguration` created
3. User starts quiz → `QuizInstance` created with status "pending" → transitions to "in-progress"
4. User answers questions → `answers` map updated → auto-saved to localStorage
5. Timer expires or user finishes → `QuizInstance` status → "expired" | "completed"
6. Results calculated → `AssessmentResult` generated → displayed

### Resume Flow
1. User closes browser → `QuizInstance` saved to localStorage (status "in-progress")
2. User returns → `QuizInstance` loaded from localStorage
3. Timer resumes from saved startTime → remaining time calculated
4. Quiz continues from last question

---

## Storage Strategy

### localStorage Keys
- `learnme_user`: User authentication data (User entity)
- `learnme_quiz_{quizId}`: In-progress quiz instances (QuizInstance entity)
- `learnme_session`: Session token (optional, for future use)

### Data Persistence
- User data persists across sessions
- Quiz instances persist only while in-progress
- Completed quizzes not stored (MVP limitation)
- Assessment results displayed immediately, not persisted

### Data Cleanup
- Completed/expired quizzes: localStorage entry deleted
- Logout: all user-related data cleared
- Session expiration: handled by localStorage TTL (future enhancement)

---

## Type Definitions (TypeScript)

```typescript
// User Entity
interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// ContentInput Entity
interface ContentInput {
  id: string;
  type: "url" | "file" | "manual";
  source: string;
  content: string | null;
  timestamp: Date;
  userId: string;
}

// QuizConfiguration Entity
interface QuizConfiguration {
  difficulty: "Easy" | "Normal" | "Hard" | "Master";
  numberOfQuestions: number;
  timeDuration: number; // in seconds
}

// Question Entity
interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: "Easy" | "Normal" | "Hard" | "Master";
  explanation: string | null;
}

// QuizInstance Entity
interface QuizInstance {
  id: string;
  userId: string;
  contentInputId: string | null;
  configuration: QuizConfiguration;
  questions: Question[];
  answers: Record<string, string>;
  startTime: Date | null;
  endTime: Date | null;
  status: "pending" | "in-progress" | "completed" | "expired";
  score: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
}

// AssessmentResult Entity
interface AssessmentResult {
  quizInstanceId: string;
  totalScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  performanceReview: string;
  weakAreas: string[];
  suggestions: string[];
  generatedAt: Date;
}
```

---

## Validation Functions

### Email Validation
- Format: RFC 5322 basic validation (regex pattern)
- Uniqueness: Check against existing users in localStorage

### Password Validation
- Length: minimum 8 characters
- Pattern: at least one letter (a-z, A-Z) and one number (0-9)
- Client-side validation before hashing

### URL Validation
- Format: Use URL constructor, catch invalid URLs
- Accessibility: Fetch with timeout, handle CORS errors

### File Validation
- Type: Check file extension and MIME type (PDF, DOC, TXT)
- Size: Check file.size ≤ 5MB (5 * 1024 * 1024 bytes)

### Quiz Configuration Validation
- All fields required (difficulty, numberOfQuestions, timeDuration)
- Positive numbers only (> 0)
- No maximum constraints per clarifications

---

## Notes

- All entities are client-side only for MVP
- No backend database required
- localStorage limitations: ~5-10MB per domain, sufficient for MVP
- Future enhancements: Backend API, database persistence, quiz history
- Data model supports future features (quiz history, analytics) without breaking changes
