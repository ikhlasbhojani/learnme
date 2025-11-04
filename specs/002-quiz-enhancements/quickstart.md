# Quickstart Guide: Quiz Enhancements

**Feature**: 002-quiz-enhancements  
**Date**: 2024-12-19  
**Phase**: 1 - Design

## Overview

This feature adds quiz integrity protection (fullscreen mode, tab change detection), enhanced UX (animations, theme customization), and improved quiz navigation (question count display). This guide provides implementation quickstart for developers.

## Prerequisites

- Existing codebase from feature 001-learning-application
- Modern browser with Fullscreen API and Page Visibility API support
- Node.js 18+ and npm/yarn
- TypeScript 5.2.2+
- React 18.2.0+

## New Components and Hooks

### Hooks to Create

1. **`src/hooks/useFullscreen.ts`**
   - Manages fullscreen API integration
   - Handles fullscreen entry/exit
   - Error handling for unsupported browsers

2. **`src/hooks/useTabVisibility.ts`**
   - Detects tab/window visibility changes
   - Provides visibility state
   - Event listener management

3. **`src/hooks/useTheme.ts`**
   - Manages theme state
   - Theme switching and persistence
   - Integration with user account

### Components to Create

1. **`src/components/quiz/QuestionCount.tsx`**
   - Displays current question number and total
   - Format: "Question X of Y" or "X questions remaining"

2. **`src/components/quiz/ResumePrompt.tsx`**
   - Modal/dialog for quiz resume
   - Shows when user returns to paused quiz
   - Requires explicit resume action

3. **`src/components/common/ThemeSelector.tsx`**
   - Theme selection UI
   - Preview of available themes
   - Immediate theme application

## Implementation Steps

### Step 1: Extend Type Definitions

**File**: `src/types/index.ts`

```typescript
// Extend User interface
export interface User {
  // ... existing fields ...
  themePreference: 'light' | 'dark' | 'blue' | 'green' | null;
}

// Extend QuizInstance interface
export interface QuizInstance {
  // ... existing fields ...
  pauseReason: 'tab-change' | 'manual' | null;
  pausedAt: Date | null;
  pauseCount: number;
}
```

### Step 2: Create useFullscreen Hook

**File**: `src/hooks/useFullscreen.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: (element?: HTMLElement) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  error: string | null;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support
  const isSupported = typeof document !== 'undefined' && 
    (document.fullscreenEnabled || 
     (document as any).webkitFullscreenEnabled || 
     (document as any).mozFullScreenEnabled);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || 
                      (document as any).webkitFullscreenElement || 
                      (document as any).mozFullScreenElement);
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(async (element?: HTMLElement) => {
    if (!isSupported) {
      setError('Fullscreen API not supported');
      throw new Error('Fullscreen API not supported');
    }

    const target = element || document.documentElement;
    
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      } else if ((target as any).mozRequestFullScreen) {
        await (target as any).mozRequestFullScreen();
      } else if ((target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen();
      }
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fullscreen permission denied';
      setError(errorMsg);
      throw err;
    }
  }, [isSupported]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setError(null);
    } catch (err) {
      // Exit fullscreen errors are usually non-critical
      console.error('Error exiting fullscreen:', err);
    }
  }, []);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    error,
  };
}
```

### Step 3: Create useTabVisibility Hook

**File**: `src/hooks/useTabVisibility.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

export interface UseTabVisibilityReturn {
  isVisible: boolean;
  visibilityState: 'visible' | 'hidden' | 'prerender';
  onVisibilityChange: (callback: (isVisible: boolean) => void) => () => void;
}

export function useTabVisibility(): UseTabVisibilityReturn {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  const [visibilityState, setVisibilityState] = useState<'visible' | 'hidden' | 'prerender'>(() => {
    if (typeof document === 'undefined') return 'visible';
    return document.visibilityState as 'visible' | 'hidden' | 'prerender';
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = document.visibilityState as 'visible' | 'hidden' | 'prerender';
      setVisibilityState(state);
      setIsVisible(state === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const onVisibilityChange = useCallback((callback: (isVisible: boolean) => void) => {
    const handleChange = () => {
      callback(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleChange);
    return () => {
      document.removeEventListener('visibilitychange', handleChange);
    };
  }, []);

  return {
    isVisible,
    visibilityState,
    onVisibilityChange,
  };
}
```

### Step 4: Create useTheme Hook

**File**: `src/hooks/useTheme.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, saveUser } from '../utils/auth';
import { getStorageItem, setStorageItem } from '../utils/storage';

export type ThemeName = 'light' | 'dark' | 'blue' | 'green';

export interface UseThemeReturn {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => Promise<void>;
  availableThemes: ThemeName[];
  toggleTheme: () => Promise<void>;
}

const AVAILABLE_THEMES: ThemeName[] = ['light', 'dark', 'blue', 'green'];

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Load from user account or localStorage
    const user = getCurrentUser();
    if (user?.themePreference) {
      return user.themePreference;
    }
    const stored = getStorageItem<ThemeName>('theme');
    return stored || 'light';
  });

  const setTheme = useCallback(async (newTheme: ThemeName) => {
    if (!AVAILABLE_THEMES.includes(newTheme)) {
      throw new Error('Invalid theme');
    }

    // Update CSS
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update state
    setThemeState(newTheme);

    // Save to user account
    const user = getCurrentUser();
    if (user) {
      user.themePreference = newTheme;
      saveUser(user);
    }

    // Save to localStorage
    setStorageItem('theme', newTheme);
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  }, [theme, setTheme]);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load theme on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.themePreference) {
      setThemeState(user.themePreference);
      document.documentElement.setAttribute('data-theme', user.themePreference);
    }
  }, []);

  return {
    theme,
    setTheme,
    availableThemes: AVAILABLE_THEMES,
    toggleTheme,
  };
}
```

### Step 5: Extend Quiz Utils

**File**: `src/utils/quiz.ts`

Add pause/resume functions:

```typescript
export function pauseQuiz(quiz: QuizInstance, reason: 'tab-change' | 'manual' = 'tab-change'): QuizInstance {
  if (quiz.status !== 'in-progress') {
    throw new Error('Quiz not in progress');
  }
  
  if (quiz.pauseReason !== null) {
    // Already paused, ignore (per FR-004)
    return quiz;
  }

  return {
    ...quiz,
    pauseReason: reason,
    pausedAt: new Date(),
    pauseCount: quiz.pauseCount + 1,
  };
}

export function resumeQuiz(quiz: QuizInstance): QuizInstance {
  if (quiz.pauseReason === null) {
    throw new Error('Quiz is not paused');
  }

  return {
    ...quiz,
    pauseReason: null,
    pausedAt: null,
  };
}
```

### Step 6: Create QuestionCount Component

**File**: `src/components/quiz/QuestionCount.tsx`

```typescript
import React from 'react';

interface QuestionCountProps {
  current: number;
  total: number;
  format?: 'full' | 'remaining';
}

export function QuestionCount({ current, total, format = 'full' }: QuestionCountProps) {
  const remaining = total - current;

  const displayText = format === 'full' 
    ? `Question ${current} of ${total}`
    : `${remaining} question${remaining !== 1 ? 's' : ''} remaining`;

  return (
    <div 
      className="question-count"
      aria-label={`Question ${current} of ${total}`}
    >
      {displayText}
    </div>
  );
}
```

### Step 7: Create ResumePrompt Component

**File**: `src/components/quiz/ResumePrompt.tsx`

```typescript
import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ResumePromptProps {
  isOpen: boolean;
  pauseReason: 'tab-change' | 'manual';
  pausedAt: Date | null;
  onResume: () => Promise<void>;
}

export function ResumePrompt({ isOpen, pauseReason, pausedAt, onResume }: ResumePromptProps) {
  const elapsedTime = pausedAt 
    ? Math.floor((Date.now() - pausedAt.getTime()) / 1000)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false}>
      <div className="resume-prompt">
        <h2>Quiz Paused</h2>
        <p>
          {pauseReason === 'tab-change' 
            ? 'The quiz was paused because you switched tabs.'
            : 'The quiz was paused.'}
        </p>
        {pausedAt && (
          <p>Paused for: {formatTime(elapsedTime)}</p>
        )}
        <Button onClick={onResume}>
          Resume Quiz
        </Button>
      </div>
    </Modal>
  );
}
```

### Step 8: Integrate in Quiz Page

**File**: `src/pages/Quiz.tsx` (extend existing)

```typescript
import { useFullscreen } from '../hooks/useFullscreen';
import { useTabVisibility } from '../hooks/useTabVisibility';
import { QuestionCount } from '../components/quiz/QuestionCount';
import { ResumePrompt } from '../components/quiz/ResumePrompt';

export default function Quiz() {
  // ... existing code ...
  
  const { isFullscreen, isSupported, enterFullscreen, exitFullscreen, error: fullscreenError } = useFullscreen();
  const { isVisible, onVisibilityChange } = useTabVisibility();
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Enter fullscreen on quiz start
  useEffect(() => {
    if (quiz && quiz.status === 'in-progress' && !isFullscreen && isSupported) {
      enterFullscreen().catch((err) => {
        // Handle error per FR-001
        console.error('Failed to enter fullscreen:', err);
      });
    }
  }, [quiz?.status, isFullscreen, isSupported, enterFullscreen]);

  // Tab visibility detection
  useEffect(() => {
    if (!quiz || quiz.status !== 'in-progress') return;

    const unsubscribe = onVisibilityChange((visible) => {
      if (!visible && !quiz.pauseReason) {
        // Pause quiz on tab switch
        const pausedQuiz = pauseQuiz(quiz, 'tab-change');
        setQuiz(pausedQuiz);
        // Pause timer
        pauseTimer();
      } else if (visible && quiz.pauseReason === 'tab-change') {
        // Show resume prompt
        setShowResumePrompt(true);
      }
    });

    return unsubscribe;
  }, [quiz, onVisibilityChange]);

  const handleResume = async () => {
    if (!quiz) return;
    const resumedQuiz = resumeQuiz(quiz);
    setQuiz(resumedQuiz);
    setShowResumePrompt(false);
    // Resume timer
    resumeTimer();
  };

  return (
    <div className="quiz-container">
      {fullscreenError && (
        <div className="error-message">
          {fullscreenError}
        </div>
      )}
      
      <QuestionCount 
        current={currentQuestionIndex + 1}
        total={quiz?.questions.length || 0}
      />
      
      {/* ... existing quiz UI ... */}
      
      <ResumePrompt
        isOpen={showResumePrompt}
        pauseReason={quiz?.pauseReason || 'tab-change'}
        pausedAt={quiz?.pausedAt || null}
        onResume={handleResume}
      />
    </div>
  );
}
```

### Step 9: Add Theme CSS

**File**: `src/styles/globals.css` (extend existing)

```css
/* Theme Variables */
:root[data-theme="light"] {
  --color-primary: #0ea5e9;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}

:root[data-theme="dark"] {
  --color-primary: #38bdf8;
  --color-background: #111827;
  --color-surface: #1f2937;
  --color-text: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-border: #374151;
}

:root[data-theme="blue"] {
  --color-primary: #3b82f6;
  --color-background: #eff6ff;
  --color-surface: #dbeafe;
  --color-text: #1e3a8a;
  --color-text-secondary: #3b82f6;
  --color-border: #93c5fd;
}

:root[data-theme="green"] {
  --color-primary: #10b981;
  --color-background: #ecfdf5;
  --color-surface: #d1fae5;
  --color-text: #065f46;
  --color-text-secondary: #10b981;
  --color-border: #6ee7b7;
}

/* Smooth theme transitions */
* {
  transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
  
  /* Preserve essential transitions only */
  [data-essential-transition="true"] {
    transition: opacity 150ms ease !important;
  }
}
```

## Testing

### Test useFullscreen Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from '../hooks/useFullscreen';

describe('useFullscreen', () => {
  it('checks if fullscreen is supported', () => {
    const { result } = renderHook(() => useFullscreen());
    expect(result.current.isSupported).toBe(true); // or false in test env
  });

  it('enters fullscreen mode', async () => {
    const { result } = renderHook(() => useFullscreen());
    await act(async () => {
      await result.current.enterFullscreen();
    });
    expect(result.current.isFullscreen).toBe(true);
  });
});
```

### Test Tab Visibility Detection

```typescript
import { renderHook } from '@testing-library/react';
import { useTabVisibility } from '../hooks/useTabVisibility';

describe('useTabVisibility', () => {
  it('detects tab visibility', () => {
    const { result } = renderHook(() => useTabVisibility());
    expect(result.current.isVisible).toBe(true);
  });
});
```

## Key Implementation Notes

1. **Fullscreen Requirement (FR-001)**: Quiz cannot start if fullscreen is not supported or denied
2. **Tab Change Detection (FR-003)**: Only pause if quiz is active and not already paused. If Page Visibility API fails: Show warning, continue quiz without detection
3. **Resume Prompt (FR-007)**: Quiz remains paused until user explicitly clicks Resume
4. **Timer Resume (FR-007 clarification)**: Timer resumes from remaining time - paused duration does NOT count against quiz duration
5. **Theme Persistence (FR-018)**: Store in user account, load on login. If save/load fails: Use default theme, show notification
6. **Theme During Quiz (clarification)**: Theme changes apply immediately to quiz interface
7. **Animations (FR-011-FR-014)**: Use Framer Motion, respect prefers-reduced-motion. When enabled: Disable decorative animations, preserve essential transitions

## Next Steps

1. Write tests for all new hooks and components (TDD)
2. Integrate theme selector in settings/header
3. Add animations to page transitions and interactions
4. Test fullscreen and tab detection in different browsers
5. Handle edge cases (browser close, fullscreen exit via F11, etc.)
