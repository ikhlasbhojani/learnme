# Data Model: Quiz Enhancements

**Feature**: 002-quiz-enhancements  
**Date**: 2024-12-19  
**Phase**: 1 - Design

## Entities

### ThemePreference

**Description**: Represents user's selected color theme preference, stored per user account to enable persistence across devices and sessions.

**Attributes**:
- `userId`: string (UUID v4) - Reference to User.id (required, unique)
- `theme`: string - Theme identifier (required, e.g., "light", "dark", "blue", "green")
- `updatedAt`: Date - Last theme update timestamp (required)

**Validation Rules**:
- Theme must be one of available theme options (minimum: "light", "dark" per FR-015)
- User ID must reference existing user
- Theme preference is unique per user (one theme per user)

**Relationships**:
- One-to-one with `User` (each user has one theme preference)

**Storage**: 
- User account/profile (primary storage per FR-018)
- localStorage key `learnme_theme_${userId}` as cache
- Loaded on user login (per FR-019)

**State Transitions**:
- `undefined` → `theme` (on first theme selection)
- `theme1` → `theme2` (on theme change)

---

### QuizPauseState (Extended QuizInstance)

**Description**: Represents the state of a paused quiz, including reason for pause and timestamp. This extends the existing QuizInstance entity from feature 001.

**New Attributes** (to be added to QuizInstance):
- `pauseReason`: "tab-change" | "manual" | null - Reason for pause (null when not paused)
- `pausedAt`: Date | null - Timestamp when quiz was paused (null when not paused)
- `pauseCount`: number - Number of times quiz was paused (default: 0)

**Validation Rules**:
- Pause reason must be one of: "tab-change", "manual", or null
- PausedAt must be set when pauseReason is set
- Pause count increments on each pause event

**Relationships**:
- Part of `QuizInstance` entity (not separate entity)

**Storage**: 
- Part of QuizInstance state in localStorage key `learnme_quiz_${quizId}`
- Persisted when tab change detected (per FR-005)

**State Transitions**:
- `in-progress` → `in-progress` (paused) - When tab change detected (timer paused, quiz state saved, pausedAt timestamp recorded)
- `in-progress` (paused) → `in-progress` - When user resumes (timer resumes from remaining time, paused time does not count against duration)
- `in-progress` (paused) → `expired` - If timer expires while paused (shouldn't happen, but handle edge case)

**Timer Behavior on Resume**:
- Paused duration does not count against quiz duration (per FR-007 clarification)
- Timer resumes from remaining time: `remainingTime = timeDuration - (elapsedTime - pausedDuration)`
- Paused duration tracked separately from quiz start time

---

### User (Extended)

**Description**: Extends existing User entity from feature 001 to include theme preference.

**New Attributes** (to be added to User):
- `themePreference`: string | null - User's selected theme (e.g., "light", "dark") - null if not set (defaults to system/default)

**Validation Rules**:
- Theme preference must be one of available theme options or null
- Theme preference is optional (defaults to system/default if not set)

**Relationships**:
- One-to-one with `ThemePreference` (each user has one theme preference)

**Storage**: 
- localStorage key `learnme_user` (extends existing storage)
- Theme preference loaded on login (per FR-019)

**State Transitions**:
- No new state transitions (theme is a preference, not a state)

---

## Type Definitions (TypeScript)

```typescript
// Theme Preference Entity
interface ThemePreference {
  userId: string;
  theme: 'light' | 'dark' | 'blue' | 'green'; // Extensible for future themes
  updatedAt: Date;
}

// Extended QuizInstance (additions to existing type)
interface QuizInstance {
  // ... existing fields from feature 001 ...
  pauseReason: 'tab-change' | 'manual' | null;
  pausedAt: Date | null;
  pauseCount: number;
}

// Extended User (additions to existing type)
interface User {
  // ... existing fields from feature 001 ...
  themePreference: string | null;
}
```

---

## Storage Strategy

### Theme Preference Storage

**Primary Storage**: User account/profile
- When user is authenticated: Store in user object, sync to localStorage as cache
- When user is not authenticated: Store in localStorage only (will be lost on logout)
- On login: Load theme from user object, apply immediately (per FR-019)

**Storage Keys**:
- User object: `learnme_user` (contains `themePreference` field)
- Cache: `learnme_theme_${userId}` (optional, for faster access)

**Persistence**:
- Theme preference persists across devices and sessions for authenticated users (per FR-018)
- Theme preference is session-only for non-authenticated users (localStorage)

### Quiz Pause State Storage

**Storage**: Part of QuizInstance
- Stored in localStorage key `learnme_quiz_${quizId}`
- Auto-saved when tab change detected (per FR-005)
- Loaded when quiz is resumed

**Persistence**:
- Quiz pause state persists until quiz is completed or expired
- Cleared when quiz is finished or user explicitly abandons quiz

---

## Validation Rules Summary

### Theme Preference
- Theme must be valid option: "light", "dark", "blue", "green" (minimum per FR-015)
- User ID must exist and be valid UUID
- Theme preference is optional (null allowed)

### Quiz Pause State
- Pause reason must be valid: "tab-change", "manual", or null
- PausedAt must be set when pauseReason is set
- Pause count must be non-negative integer
- Quiz can only be paused when status is "in-progress"
- Quiz can only be resumed when pauseReason is set

---

## Relationships Diagram

```
User (1) ──< (1) ThemePreference
  │
  │ (1)
  │
  └───< (many) QuizInstance
           │
           │ (contains)
           │
           └──> QuizPauseState (embedded)
```

---

## Migration Notes

### Extending Existing Entities

1. **User Entity**: Add `themePreference` field to existing User type
   - Default value: null (system default theme)
   - Migration: Existing users will have null themePreference, will use system default

2. **QuizInstance Entity**: Add pause-related fields
   - Default values: `pauseReason: null`, `pausedAt: null`, `pauseCount: 0`
   - Migration: Existing quiz instances in storage will need these fields added on next load

### Backward Compatibility

- Theme system: Gracefully handles missing themePreference (uses system default)
- Quiz pause state: Gracefully handles missing pause fields (treats as not paused)
- No breaking changes to existing QuizInstance structure
