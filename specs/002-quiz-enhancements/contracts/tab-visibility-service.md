# Tab Visibility Service Contract

**Service**: Tab Visibility Service  
**Type**: Browser API Wrapper / React Hook  
**Location**: `src/hooks/useTabVisibility.ts`

## Overview

Service for detecting tab/window visibility changes using native Page Visibility API. Enables quiz pause/resume functionality when user switches tabs (FR-003, FR-004, FR-006, FR-007).

## Browser API

Uses native `document.visibilityState` and `visibilitychange` event.

## Interface

```typescript
interface TabVisibilityService {
  // Check if tab is currently visible
  isVisible(): boolean;
  
  // Get current visibility state
  getVisibilityState(): 'visible' | 'hidden' | 'prerender';
  
  // Subscribe to visibility changes
  onVisibilityChange(callback: (isVisible: boolean) => void): () => void;
}

interface TabVisibilityChange {
  isVisible: boolean;
  previousState: 'visible' | 'hidden' | 'prerender';
  timestamp: Date;
}
```

## Methods

### isVisible(): boolean

Checks if the current tab/window is visible.

**Inputs**: None

**Outputs**:
- `boolean`: true if visible, false if hidden

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Check `document.visibilityState === 'visible'`
- Returns false for 'hidden' or 'prerender' states

---

### getVisibilityState(): 'visible' | 'hidden' | 'prerender'

Returns the current visibility state of the document.

**Inputs**: None

**Outputs**:
- `'visible'`: Tab/window is visible
- `'hidden'`: Tab/window is hidden (user switched tabs, minimized window, etc.)
- `'prerender'`: Page is being prerendered (not typically relevant)

**Side Effects**: None

**Errors**: None

---

### onVisibilityChange(callback: (isVisible: boolean) => void): () => void

Subscribes to visibility change events.

**Inputs**:
- `callback`: Function called when visibility changes, receives boolean (true = visible, false = hidden)

**Outputs**:
- `() => void`: Unsubscribe function

**Side Effects**:
- Adds event listener to `visibilitychange` event
- Returns cleanup function to remove listener

**Errors**: None

**Implementation Notes**:
- Cleanup function must be called to prevent memory leaks
- Callback is called immediately with current state

---

## React Hook Interface

```typescript
interface UseTabVisibilityReturn {
  isVisible: boolean;
  visibilityState: 'visible' | 'hidden' | 'prerender';
  onVisibilityChange: (callback: (isVisible: boolean) => void) => void;
}
```

### Hook Usage

```typescript
const { isVisible, visibilityState, onVisibilityChange } = useTabVisibility();

// Use in effect
useEffect(() => {
  const unsubscribe = onVisibilityChange((visible) => {
    if (!visible && quiz.status === 'in-progress' && !quiz.pauseReason) {
      // Pause quiz per FR-003, FR-004
      pauseQuiz();
    } else if (visible && quiz.pauseReason === 'tab-change') {
      // Show resume prompt per FR-006
      showResumePrompt();
    }
  });
  
  return unsubscribe;
}, [quiz]);
```

---

## Events

### visibilitychange

Fired when the visibility of the tab/window changes.

**Event Handler**:
```typescript
document.addEventListener('visibilitychange', () => {
  const isVisible = document.visibilityState === 'visible';
  // Handle visibility change
});
```

**Triggers**:
- User switches to another tab
- User switches to another window
- User minimizes the browser window
- User switches applications (Alt+Tab on Windows, Cmd+Tab on Mac)

**Implementation Notes**:
- Fires immediately when visibility changes
- Use to detect tab switches during quiz (per FR-003)
- Only pause if quiz is active and not already paused (per FR-004)

---

## Integration with Quiz (FR-003, FR-004, FR-006, FR-007)

### Tab Switch Detection

**When quiz is in-progress and tab becomes hidden**:
1. Check if quiz status is 'in-progress' and `pauseReason` is null
2. Set `pauseReason: 'tab-change'`
3. Set `pausedAt: Date.now()`
4. Increment `pauseCount`
5. Pause timer
6. Save quiz state to localStorage (per FR-005)

**If quiz is already paused**:
- Ignore subsequent tab switches (per FR-004 clarification)
- Do not increment pauseCount again
- Do not update pausedAt

### Resume Prompt

**When tab becomes visible and quiz is paused due to tab-change**:
1. Display resume prompt modal (per FR-006)
2. Quiz remains paused (per FR-007)
3. User must click "Resume" button to continue
4. On resume: Clear `pauseReason`, resume timer, continue quiz

---

## State Management

### Quiz Pause State

```typescript
interface QuizPauseState {
  pauseReason: 'tab-change' | 'manual' | null;
  pausedAt: Date | null;
  pauseCount: number;
}
```

**State Transitions**:
- `null` ? `'tab-change'` - When tab becomes hidden during active quiz
- `'tab-change'` ? `null` - When user resumes quiz
- `null` ? `'manual'` - When user manually pauses (future feature)

---

## Error Handling

**Browser Not Supported or API Failure** (per FR-003 clarification):
- Page Visibility API is supported in all modern browsers
- Fallback: Check `document.hidden` (deprecated but widely supported)
- If neither available or API fails: Display warning to user indicating reduced integrity protection, quiz continues without tab detection
- Warning message should clearly indicate that tab changes will not be detected

---

## Browser Compatibility

- Chrome: Full support (since v13)
- Firefox: Full support (since v10)
- Safari: Full support (since v7)
- Edge: Full support

**No vendor prefixes required** - Standard API

---

## Performance

- Event listener is lightweight
- No polling required
- Minimal performance impact
- Cleanup on component unmount

---

## Testing

**Test Scenarios**:
1. Tab switch during active quiz ? Quiz pauses
2. Tab switch when quiz already paused ? Ignored
3. Return to tab when paused ? Resume prompt shown
4. Resume button clicked ? Quiz resumes
5. Multiple tab switches ? Only first pause triggers, subsequent ignored until resume

---

## Edge Cases

1. **Browser window minimized**: Triggers 'hidden' state
2. **Browser window restored**: Triggers 'visible' state
3. **Multiple tabs of same app**: Each tab has independent visibility state
4. **Browser closed**: Handled by existing quiz resume logic (not visibility API)
5. **Fullscreen exit via F11**: May trigger visibility change, but should not pause (per FR-020)
