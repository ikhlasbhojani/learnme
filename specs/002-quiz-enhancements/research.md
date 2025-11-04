# Research Decisions: Quiz Enhancements

**Feature**: 002-quiz-enhancements  
**Date**: 2024-12-19  
**Purpose**: Document technical research decisions for quiz enhancement features

## 1. Browser Fullscreen API Integration

**Decision**: Use native Browser Fullscreen API (`Element.requestFullscreen()`) with fallback detection and error handling.

**Rationale**: 
- Native API provides best performance and security
- No additional dependencies required
- Standard across modern browsers (Chrome, Firefox, Safari, Edge)
- Provides fullscreenchange events for state management
- Can detect support and handle permission denial gracefully

**Alternatives Considered**:
- Third-party fullscreen libraries (fullscreen.js, screenfull) - Rejected: Unnecessary dependency, native API is sufficient
- CSS-based fullscreen simulation - Rejected: Doesn't provide true fullscreen, can't hide browser UI elements

**Implementation Notes**:
- Use `document.fullscreenElement` to check fullscreen state
- Listen to `fullscreenchange` event for state changes
- Handle `fullscreenError` for permission denial
- Check `document.fullscreenEnabled` before attempting fullscreen
- Provide clear error messages if API not supported per FR-001

## 2. Page Visibility API for Tab Detection

**Decision**: Use native Page Visibility API (`document.visibilityState`, `visibilitychange` event) for tab change detection.

**Rationale**:
- Native browser API, no dependencies
- Reliable detection of tab/window switching
- Fires when user switches tabs, minimizes window, or switches applications
- Supported in all modern browsers
- Lightweight and performant

**Alternatives Considered**:
- `window.blur`/`window.focus` events - Rejected: Less reliable, fires on various focus changes, not just tab switches
- Third-party libraries (visibility.js) - Rejected: Unnecessary dependency for native API
- Polling-based detection - Rejected: Performance overhead, less accurate

**Implementation Notes**:
- Listen to `visibilitychange` event
- Check `document.visibilityState === 'hidden'` for tab switch detection
- Only trigger pause when quiz is active (not already paused per FR-004)
- Resume prompt should appear when `visibilityState === 'visible'` again
- If Page Visibility API is not supported or fails: Display warning to user, quiz continues without tab detection (per FR-003 clarification)
- Warning should indicate reduced integrity protection

## 3. Theme Management Architecture

**Decision**: Use React Context API for theme state management with localStorage fallback, integrated with user authentication system.

**Rationale**:
- React Context provides global state management without prop drilling
- Fits existing React architecture
- localStorage provides immediate persistence for logged-in users
- Can extend to user account storage later (per FR-018 requirement)
- No additional state management library needed

**Alternatives Considered**:
- Redux/Zustand for theme state - Rejected: Overkill for single preference value, adds dependency
- CSS custom properties only - Rejected: Need JavaScript state for theme switching logic
- Server-side theme storage only - Rejected: Requires backend API, violates client-side constraint

**Implementation Notes**:
- ThemeContext provides current theme and setTheme function
- ThemeProvider wraps application and loads saved theme on mount
- Theme preferences stored in user object (when authenticated) or localStorage
- CSS custom properties (CSS variables) for dynamic theme application
- Smooth transitions using CSS transitions for theme changes

## 4. Animation Strategy

**Decision**: Extend existing Framer Motion usage with consistent animation patterns, respect prefers-reduced-motion.

**Rationale**:
- Framer Motion already in dependencies, no new libraries
- Provides smooth, performant animations
- Supports accessibility with reduced motion preferences
- Consistent with existing animation patterns in the app
- Declarative API fits React architecture

**Alternatives Considered**:
- CSS animations only - Rejected: Less flexible, harder to coordinate complex animations
- React Spring - Rejected: Additional dependency, Framer Motion already available
- No animations - Rejected: Violates FR-011 through FR-014 requirements

**Implementation Notes**:
- Use Framer Motion's `motion` components for animated elements
- Check `prefers-reduced-motion` media query and disable animations if set
- When `prefers-reduced-motion` is enabled: Disable all decorative animations, preserve essential transitions (e.g., page navigation) per clarification
- Consistent animation durations: 300ms for page transitions, 100ms for interactions
- Use `whileHover` and `whileTap` for interactive element animations (disabled when reduced motion enabled)
- Page transitions via `AnimatePresence` for route changes (essential transitions preserved)
- Loading animations: Disable decorative animations when reduced motion enabled, essential loading feedback may remain

## 5. Fullscreen Exit Handling

**Decision**: Distinguish between programmatic fullscreen exit (Escape key, exit button) and browser control exit (F11, Alt+Tab), handle differently per FR-020 and FR-021.

**Rationale**:
- Different user intents require different behaviors
- Browser controls (F11) are system-level and shouldn't trigger quiz pause
- Programmatic exit (Escape) should show confirmation for quiz integrity
- Page Visibility API can detect tab switches vs fullscreen exit
- Maintains quiz integrity while allowing user flexibility

**Alternatives Considered**:
- Treat all fullscreen exits the same - Rejected: Violates FR-020 requirement
- Block all fullscreen exits - Rejected: Poor UX, users need legitimate ways to exit
- Always pause on fullscreen exit - Rejected: Violates FR-020, browser controls shouldn't pause

**Implementation Notes**:
- Listen to `fullscreenchange` event to detect fullscreen exit
- Check if exit was due to tab switch (via Page Visibility API) or browser control
- Browser control exit (F11, etc.): Continue quiz normally
- Programmatic exit (Escape, button): Show confirmation dialog per FR-021
- Tab switch: Pause quiz per FR-003 and FR-004

## 6. Question Count Display Location

**Decision**: Display question count in quiz header/top bar, always visible, formatted as "Question X of Y" or "X questions remaining".

**Rationale**:
- Header/top bar is always visible during quiz
- Doesn't obstruct quiz content (per FR-010)
- Standard UX pattern for progress indicators
- Easy to read and update
- Can be styled to match quiz theme

**Alternatives Considered**:
- Bottom of screen - Rejected: Less visible, may be hidden by browser UI
- Sidebar - Rejected: May not be visible on mobile, adds complexity
- Floating badge - Rejected: May obstruct content, less accessible

**Implementation Notes**:
- Component: `QuestionCount` in `src/components/quiz/QuestionCount.tsx`
- Display format: "Question {current} of {total}" or "{remaining} questions remaining"
- Update on question navigation (per FR-009)
- Accessible: Use `aria-label` for screen readers
- Styled to match theme system

## 7. Resume Prompt Design

**Decision**: Display prominent modal/dialog when user returns to quiz tab after tab change, requires explicit resume action.

**Rationale**:
- Modal ensures user sees the prompt (per FR-006)
- Explicit action prevents accidental resume (per FR-007)
- Clear messaging about quiz state
- Maintains quiz integrity
- Standard UX pattern for paused states

**Alternatives Considered**:
- Banner notification - Rejected: Less prominent, may be missed
- Auto-resume after timeout - Rejected: Violates FR-007 requirement
- Inline prompt in quiz area - Rejected: Less visible, may be missed

**Implementation Notes**:
- Component: `ResumePrompt` in `src/components/quiz/ResumePrompt.tsx`
- Display when `visibilityState === 'visible'` and quiz is paused
- Show pause reason and elapsed time
- Resume button must be clicked to continue (per clarification Q1)
- Accessible: Focus trap, keyboard navigation, ARIA labels

## 8. Timer Resume Behavior

**Decision**: When quiz is resumed after being paused, timer resumes from remaining time (paused duration does not count against quiz duration).

**Rationale**:
- Maintains fairness - users are not penalized for legitimate pauses (tab switches, interruptions)
- Paused time should not consume quiz duration
- Clear user expectation: resume from where timer paused
- Per clarification: Timer behavior clarified to prevent confusion

**Alternatives Considered**:
- Paused time counts against duration - Rejected: Unfair to users, penalizes legitimate interruptions
- Timer resets to original duration - Rejected: Allows users to extend quiz time indefinitely by pausing

**Implementation Notes**:
- Calculate remaining time: `timeDuration - (currentTime - startTime - pausedDuration)`
- Store paused duration separately from elapsed time
- On resume: Resume timer with calculated remaining time
- Timer must accurately account for pause duration to ensure fairness

## 9. Theme Storage Integration

**Decision**: Store theme preference in user object (when authenticated) with localStorage as immediate cache, extend auth system to persist theme.

**Rationale**:
- Meets FR-018 requirement for account-based storage
- localStorage provides immediate persistence without backend
- Can extend to backend API later without breaking changes
- Maintains consistency with existing auth system
- Works offline for logged-in users

**Alternatives Considered**:
- Backend API only - Rejected: Requires backend implementation, violates client-side constraint
- localStorage only - Rejected: Violates FR-018 requirement for account persistence
- Session-only - Rejected: Violates FR-018 requirement

**Implementation Notes**:
- Extend User type to include `themePreference` field
- Save to localStorage immediately on change
- Update user object when authenticated
- Load from user object on login (per FR-019)
- Fallback to localStorage if user object not available
- If save fails: Display notification to user, use default theme (per FR-018 clarification)
- If load fails: Display notification to user, use default theme (per FR-019 clarification)
- Theme changes apply immediately during active quiz (per clarification)
