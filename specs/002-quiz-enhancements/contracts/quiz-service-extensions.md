# Quiz Service Extensions Contract

**Service**: Quiz Service Extensions  
**Type**: Service Interface Extensions  
**Location**: `src/hooks/useQuiz.ts` (extensions), `src/utils/quiz.ts` (extensions)

## Overview

Extensions to existing Quiz Service for pause/resume functionality, question count display, and fullscreen integration. Extends contracts from feature 001-learning-application.

## Extended Interfaces

### QuizInstance (Extended)

```typescript
interface QuizInstance {
  // ... existing fields from feature 001 ...
  
  // New fields for pause functionality
  pauseReason: 'tab-change' | 'manual' | null;
  pausedAt: Date | null;
  pauseCount: number;
}
```

**Default Values**:
- `pauseReason: null`
- `pausedAt: null`
- `pauseCount: 0`

---

### UseQuizReturn (Extended)

```typescript
interface UseQuizReturn {
  // ... existing fields from feature 001 ...
  
  // New fields for pause/resume
  isPaused: boolean;
  pauseReason: 'tab-change' | 'manual' | null;
  pauseQuiz: () => Promise<void>;
  resumeQuiz: (quizId: string) => Promise<QuizInstance | null>; // Enhanced
  currentQuestionNumber: number; // For question count display
  totalQuestions: number;
  remainingQuestions: number;
}
```

---

## New Methods

### pauseQuiz(reason?: 'tab-change' | 'manual'): Promise<void>

Pauses an active quiz and saves state.

**Inputs**:
- `reason`: 'tab-change' | 'manual' - Optional pause reason (defaults to 'tab-change')

**Outputs**: Promise<void> - Resolves when quiz is paused

**Validation**:
- Quiz must be in 'in-progress' status
- Quiz must not already be paused (per FR-004)

**Side Effects**:
- Sets `pauseReason` to provided reason or 'tab-change'
- Sets `pausedAt` to current timestamp
- Increments `pauseCount`
- Pauses timer (if timer is running)
- Saves quiz state to localStorage (per FR-005)

**Errors**:
- `"Quiz not in progress"` - Quiz is not active
- `"Quiz already paused"` - Quiz is already paused (per FR-004)

**Implementation Notes**:
- If quiz already paused, ignore subsequent pause requests (per FR-004 clarification)
- Save state immediately to localStorage
- Timer should be paused via useTimer hook

---

### resumeQuiz(quizId: string): Promise<QuizInstance | null>

Resumes a paused quiz. Enhanced version of existing method.

**Inputs**:
- `quizId`: string - Quiz instance ID

**Outputs**:
- `Promise<QuizInstance | null>`: Resumed quiz instance or null if not found

**Validation**:
- Quiz must exist
- Quiz must be paused (`pauseReason` is not null)

**Side Effects**:
- Clears `pauseReason` (sets to null)
- Clears `pausedAt` (sets to null)
- Resumes timer from remaining time (paused duration does not count against quiz duration per FR-007 clarification)
- Updates quiz status to 'in-progress'
- Saves quiz state to localStorage

**Errors**:
- `"Quiz not found"` - Quiz instance doesn't exist
- `"Quiz not paused"` - Quiz is not in paused state

**Implementation Notes**:
- Calculate remaining time: `timeDuration - (elapsedTime - pausedDuration)` where `elapsedTime = currentTime - startTime` and `pausedDuration = currentTime - pausedAt`
- Paused time does not count against quiz duration (per clarification)
- Resume timer with calculated remaining time
- User must explicitly click resume (per FR-007)
- Returns updated quiz instance

---

### getCurrentQuestionNumber(): number

Returns the current question number (1-based) for display.

**Inputs**: None

**Outputs**:
- `number`: Current question number (1-based, e.g., 1, 2, 3...)

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Returns `currentQuestionIndex + 1` (convert from 0-based to 1-based)
- Used for "Question X of Y" display (per FR-008)

---

### getTotalQuestions(): number

Returns the total number of questions in the quiz.

**Inputs**: None

**Outputs**:
- `number`: Total questions count

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Returns `quiz.questions.length`
- Used for "Question X of Y" display (per FR-008)

---

### getRemainingQuestions(): number

Returns the number of remaining questions.

**Inputs**: None

**Outputs**:
- `number`: Remaining questions count

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Returns `totalQuestions - currentQuestionNumber`
- Used for "X questions remaining" display (per FR-008)

---

## Enhanced startQuiz Method

### startQuiz (Enhanced)

The existing `startQuiz` method is enhanced to:

1. **Enter fullscreen mode** (per FR-001)
   - Check if fullscreen API is supported
   - Request fullscreen for document.documentElement
   - If not supported or denied: Show error, don't start quiz (per FR-001)

2. **Hide navigation elements** (per FR-002)
   - Hide Header component
   - Apply fullscreen styles

3. **Start timer** (existing behavior)
   - Start timer with quiz duration

4. **Set up tab visibility listener** (per FR-003)
   - Listen for visibility changes
   - Pause quiz if tab becomes hidden

**Error Handling**:
- Fullscreen not supported: Error message, quiz doesn't start
- Fullscreen denied: Error message, quiz doesn't start

---

## Component Interfaces

### QuestionCount Component

```typescript
interface QuestionCountProps {
  current: number;
  total: number;
  format?: 'full' | 'remaining'; // 'full' = "Question X of Y", 'remaining' = "X questions remaining"
}
```

**Location**: `src/components/quiz/QuestionCount.tsx`

**Display**:
- Format: "Question {current} of {total}" or "{remaining} questions remaining" (per FR-008)
- Always visible during quiz (per FR-010)
- Updates on question navigation (per FR-009)

**Accessibility**:
- `aria-label`: "Question {current} of {total}"
- Screen reader friendly

---

### ResumePrompt Component

```typescript
interface ResumePromptProps {
  isOpen: boolean;
  pauseReason: 'tab-change' | 'manual';
  pausedAt: Date | null;
  onResume: () => Promise<void>;
  onCancel?: () => void;
}
```

**Location**: `src/components/quiz/ResumePrompt.tsx`

**Display**:
- Modal/dialog overlay (per FR-006)
- Shows pause reason and elapsed time
- "Resume" button (required action per FR-007)
- Optional "Cancel" button (if implemented)

**Behavior**:
- Displays when quiz is paused and user returns to tab (per FR-006)
- Quiz remains paused until user clicks Resume (per FR-007)
- Accessible: Focus trap, keyboard navigation, ARIA labels

---

## State Transitions

### Quiz Status Transitions

```
'in-progress' ? 'in-progress' (paused)
  - Trigger: Tab change detected (FR-003)
  - pauseReason: 'tab-change'
  - pausedAt: Date.now()
  - Timer: Paused

'in-progress' (paused) ? 'in-progress'
  - Trigger: User clicks Resume (FR-007)
  - pauseReason: null
  - pausedAt: null
  - Timer: Resumed

'in-progress' (paused) ? 'expired'
  - Trigger: Timer expires while paused (edge case)
  - Should not happen (timer paused), but handle gracefully
```

---

## Storage Contract Extensions

### QuizInstance Storage (Extended)

```json
{
  "id": "uuid-v4",
  "userId": "user-uuid",
  "configuration": { ... },
  "questions": [ ... ],
  "answers": { ... },
  "startTime": "2024-12-19T10:00:00Z",
  "status": "in-progress",
  "pauseReason": "tab-change",
  "pausedAt": "2024-12-19T10:05:00Z",
  "pauseCount": 1,
  "score": null,
  "correctCount": null,
  "incorrectCount": null
}
```

**New Fields**:
- `pauseReason`: "tab-change" | "manual" | null
- `pausedAt`: ISO date string | null
- `pauseCount`: number

**Auto-save** (per FR-005):
- Save immediately when pauseReason is set
- Save on resume (clearing pauseReason)

---

## Integration Points

### Fullscreen Integration

- `startQuiz` calls `enterFullscreen()` before starting
- `exitFullscreen` handled separately (doesn't pause quiz per FR-020)

### Tab Visibility Integration

- `useTabVisibility` hook detects tab changes
- `pauseQuiz('tab-change')` called when tab becomes hidden
- `resumeQuiz` called when user returns and clicks Resume

### Timer Integration

- Timer paused when `pauseQuiz` is called
- Timer resumed when `resumeQuiz` is called
- Remaining time calculated: `timeDuration - elapsed`

---

## Error Handling

**Quiz Already Paused**:
- Ignore subsequent pause requests (per FR-004)
- Return early, no state change

**Resume Without Pause**:
- Return error: "Quiz is not paused"
- Don't modify state

**Fullscreen Not Supported**:
- Quiz cannot start (per FR-001)
- Show error message
- Return error from startQuiz

---

## Performance

- Pause/resume operations: <100ms
- State save to localStorage: <50ms
- Question count calculations: O(1)

---

## Testing

**Test Scenarios**:
1. Pause quiz on tab change ? State saved, timer paused
2. Resume quiz ? State cleared, timer resumed
3. Multiple tab switches ? Only first pause, subsequent ignored
4. Question count updates ? Correct on navigation
5. Fullscreen required ? Quiz doesn't start if not supported
