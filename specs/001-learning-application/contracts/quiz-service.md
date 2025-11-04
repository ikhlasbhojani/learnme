# Quiz Service Contract

**Service**: Quiz Service  
**Type**: Internal Service Interface  
**Location**: `src/services/quiz.ts` or `src/hooks/useQuiz.ts`

## Overview

Quiz management service for creating quizzes, managing quiz state, handling answers, and calculating results. Supports timer management and resume functionality.

## Interface

```typescript
interface QuizService {
  // Create quiz instance
  createQuiz(config: QuizConfiguration, contentInput: ContentInput | null): QuizInstance;
  
  // Start quiz
  startQuiz(quizId: string): Promise<void>;
  
  // Answer question
  answerQuestion(quizId: string, questionId: string, answer: string): Promise<void>;
  
  // Get current question
  getCurrentQuestion(quizId: string): Question | null;
  
  // Navigate questions
  nextQuestion(quizId: string): Promise<void>;
  previousQuestion(quizId: string): Promise<void>;
  
  // Finish quiz
  finishQuiz(quizId: string): Promise<AssessmentResult>;
  
  // Auto-submit on timer expiration
  expireQuiz(quizId: string): Promise<AssessmentResult>;
  
  // Resume quiz
  resumeQuiz(quizId: string): Promise<QuizInstance | null>;
  
  // Save quiz progress
  saveProgress(quizId: string): Promise<void>;
  
  // Load quiz instance
  loadQuiz(quizId: string): QuizInstance | null;
}
```

## Methods

### createQuiz(config: QuizConfiguration, contentInput: ContentInput | null): QuizInstance

Creates a new quiz instance with configuration and generates questions.

**Inputs**:
- `config`: QuizConfiguration - Quiz configuration (difficulty, number, time)
- `contentInput`: ContentInput | null - Content input (optional, null for manual)

**Outputs**:
- `QuizInstance`: Created quiz instance with status "pending"

**Side Effects**:
- Generates questions based on difficulty and number
- Uses dummy/mock questions for MVP
- Quiz instance not yet persisted (persisted on start)

**Errors**: None (always succeeds)

---

### startQuiz(quizId: string): Promise<void>

Starts a quiz instance, beginning the timer.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**: void

**Side Effects**:
- Sets `startTime` to current timestamp
- Changes status from "pending" to "in-progress"
- Saves quiz instance to localStorage
- Starts timer

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist
- `"Quiz already started"` - Quiz is already in progress

---

### answerQuestion(quizId: string, questionId: string, answer: string): Promise<void>

Records user's answer to a question.

**Inputs**:
- `quizId`: string - Quiz instance ID
- `questionId`: string - Question ID
- `answer`: string - Selected answer

**Outputs**: void

**Side Effects**:
- Updates `answers` map in quiz instance
- Auto-saves progress to localStorage (FR-016c)

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist
- `"Question not found"` - Question ID invalid

---

### getCurrentQuestion(quizId: string): Question | null

Gets the current question being displayed.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**:
- `Question | null`: Current question or null if quiz complete

**Side Effects**: None

**Errors**: None (returns null on error)

---

### nextQuestion(quizId: string): Promise<void>

Moves to the next question in the quiz.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**: void

**Side Effects**:
- Updates current question index
- Saves progress

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist
- `"No more questions"` - Already on last question

---

### previousQuestion(quizId: string): Promise<void>

Moves to the previous question in the quiz.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**: void

**Side Effects**:
- Updates current question index
- Saves progress

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist
- `"Already on first question"` - No previous question

---

### finishQuiz(quizId: string): Promise<AssessmentResult>

Manually finishes quiz and calculates results.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**:
- `AssessmentResult`: Assessment results with score and analysis

**Side Effects**:
- Sets `endTime` to current timestamp
- Changes status to "completed"
- Calculates score, correct/incorrect counts
- Generates assessment result
- Removes quiz from localStorage (completed)

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist
- `"Quiz not in progress"` - Quiz not started or already completed

---

### expireQuiz(quizId: string): Promise<AssessmentResult>

Auto-submits quiz when timer expires.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**:
- `AssessmentResult`: Assessment results with unanswered questions marked incorrect

**Side Effects**:
- Sets `endTime` to current timestamp
- Changes status to "expired"
- Marks unanswered questions as incorrect (FR-016a)
- Calculates score with partial results
- Generates assessment result showing answered vs unanswered (FR-016b)
- Removes quiz from localStorage

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist

---

### resumeQuiz(quizId: string): Promise<QuizInstance | null>

Resumes an in-progress quiz from localStorage.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**:
- `QuizInstance | null`: Quiz instance or null if not found

**Side Effects**:
- Loads quiz from localStorage
- Calculates remaining time from startTime
- Resumes timer from remaining time (FR-016d)

**Errors**: None (returns null if not found)

---

### saveProgress(quizId: string): Promise<void>

Saves current quiz progress to localStorage.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**: void

**Side Effects**:
- Saves quiz instance to localStorage key `learnme_quiz_{quizId}`

**Errors**: None (silently fails if quiz not found)

---

### loadQuiz(quizId: string): QuizInstance | null

Loads quiz instance from localStorage.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**:
- `QuizInstance | null`: Quiz instance or null if not found

**Side Effects**: None

**Errors**: None (returns null if not found)

---

## React Hook Interface

```typescript
interface UseQuizReturn {
  quiz: QuizInstance | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  isLastQuestion: boolean;
  startQuiz: (config: QuizConfiguration, contentInput: ContentInput | null) => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  nextQuestion: () => Promise<void>;
  previousQuestion: () => Promise<void>;
  finishQuiz: () => Promise<AssessmentResult>;
  resumeQuiz: (quizId: string) => Promise<QuizInstance | null>;
  loading: boolean;
  error: string | null;
}
```

---

## Timer Service Interface

```typescript
interface TimerService {
  start(duration: number, onExpire: () => void): TimerHandle;
  pause(timerId: string): void;
  resume(timerId: string): void;
  stop(timerId: string): void;
  getRemainingTime(timerId: string): number;
}

interface TimerHandle {
  id: string;
  duration: number;
  startTime: Date;
  onExpire: () => void;
}
```

### Timer Hook Interface

```typescript
interface UseTimerReturn {
  timeRemaining: number; // in seconds
  isRunning: boolean;
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  onExpire: (callback: () => void) => void;
}
```

---

## Storage Contract

**localStorage Key**: `learnme_quiz_{quizId}`

**Storage Format**:
```json
{
  "id": "uuid-v4",
  "userId": "user-uuid",
  "contentInputId": "input-uuid" | null,
  "configuration": {
    "difficulty": "Easy",
    "numberOfQuestions": 10,
    "timeDuration": 600
  },
  "questions": [...],
  "answers": {
    "question-id-1": "selected-answer",
    "question-id-2": "selected-answer"
  },
  "startTime": "2024-12-19T10:00:00Z",
  "endTime": null,
  "status": "in-progress",
  "score": null,
  "correctCount": null,
  "incorrectCount": null
}
```

**Cleanup**: Removed from localStorage on completion/expiration

---

## Assessment Calculation

### Score Calculation
```typescript
score = (correctCount / totalQuestions) * 100
```

### Weak Areas
- Identify difficulty levels with <50% correct answers
- Return array of difficulty levels: ["Easy", "Hard"]

### Suggestions
- Generic suggestions based on weak areas
- Example: "Focus on Easy difficulty questions" if Easy is weak area
- Example: "Review fundamental concepts" if overall score <50%

---

## Usage Example

```typescript
// In component
const { quiz, startQuiz, answerQuestion, finishQuiz } = useQuiz();

// Start quiz
await startQuiz(config, contentInput);

// Answer question
await answerQuestion(questionId, selectedAnswer);

// Finish quiz
const result = await finishQuiz();
// Display results
```
