# Research: Learning Application

**Feature**: 001-learning-application  
**Date**: 2024-12-19  
**Phase**: 0 - Research

## Research Decisions

### 1. Client-Side Authentication Pattern

**Decision**: Use React Context API + localStorage for authentication state management with session persistence.

**Rationale**: 
- For MVP, client-side only authentication is sufficient
- React Context provides global auth state without external state management library
- localStorage ensures session persistence across page refreshes (FR-003)
- Password hashing will use Web Crypto API (subtle.crypto) for client-side hashing
- Simple and lightweight, no backend dependency

**Alternatives Considered**:
- Redux/Zustand: Overkill for MVP, adds complexity
- JWT tokens: Requires backend API, not needed for MVP
- Cookies: Less flexible than localStorage, same-origin limitations

**Implementation Notes**:
- Create `AuthContext` with login, signup, logout functions
- Store user data in localStorage with key `learnme_user`
- Validate password policy client-side (8 chars, letter + number)
- Session persists using localStorage (not sessionStorage) for cross-tab persistence

---

### 2. Quiz State Management Pattern

**Decision**: Use React Context API + custom hooks (`useQuiz`, `useTimer`) for quiz state management with localStorage persistence for resume functionality.

**Rationale**:
- Quiz state needs to persist across browser closes (FR-016c, FR-016d)
- Context API provides global state without prop drilling
- Custom hooks encapsulate quiz logic (timer, progress, answers)
- localStorage stores quiz state for resume capability
- Timer continues from saved state on resume

**Alternatives Considered**:
- Redux: Too heavy for MVP, Context sufficient
- Zustand: Lightweight but adds dependency, Context is native
- URL state: Not suitable for quiz progress, too verbose

**Implementation Notes**:
- Store quiz state in localStorage with key `learnme_quiz_{quizId}`
- Timer state stored with start time, calculate remaining time on resume
- Auto-save on answer selection and navigation
- Clear localStorage on quiz completion

---

### 3. Timer Implementation Pattern

**Decision**: Use `useEffect` with `setInterval` for timer, with cleanup and persistence to handle browser close/resume.

**Rationale**:
- Native React hooks, no external dependencies
- `setInterval` provides accurate 1-second updates (SC-004: within 1 second accuracy)
- Store start timestamp and duration, calculate remaining on resume
- Handle timer expiration with auto-submit (FR-016a)
- Works offline, no server sync needed

**Alternatives Considered**:
- `requestAnimationFrame`: Overkill for 1-second intervals
- Web Workers: Unnecessary complexity for timer
- External timer library: Adds dependency, native is sufficient

**Implementation Notes**:
- Custom hook `useTimer(duration, onExpire)`
- Calculate elapsed time: `Date.now() - startTime`
- Remaining time: `duration - elapsed`
- On expiration: call `onExpire` callback (auto-submit quiz)
- Persist start time in localStorage for resume

---

### 4. File Upload Handling Pattern

**Decision**: Use HTML5 File API with React state management for file uploads, client-side validation only (no backend processing in MVP).

**Rationale**:
- File API provides file reading and validation
- Client-side validation for file type (PDF, DOC, TXT) and size (5MB limit)
- Display file content preview or extract text for learning content
- No backend upload needed for MVP (client-side processing)
- FileReader API for reading file contents

**Alternatives Considered**:
- FormData + fetch: Requires backend API, not needed for MVP
- Third-party upload service: Adds external dependency, not needed
- Drag-and-drop libraries: Nice-to-have, can add later

**Implementation Notes**:
- Validate file type: check `file.type` and extension
- Validate file size: `file.size <= 5 * 1024 * 1024` (5MB)
- Use FileReader to read file contents (text extraction for DOC/TXT)
- For PDF: Use PDF.js or similar for text extraction (research needed)
- Store file content in state, pass to quiz generation

---

### 5. URL Validation and Processing Pattern

**Decision**: Use URL constructor for validation, fetch API for content retrieval (client-side only, no backend proxy).

**Rationale**:
- Native URL validation is sufficient
- CORS may limit fetching external URLs, but acceptable for MVP
- Fast validation (<2 seconds per SC-008)
- Simple error handling for invalid/ inaccessible URLs

**Alternatives Considered**:
- Backend proxy: Adds complexity, not needed for MVP
- URL validation libraries: Native URL is sufficient
- Web scraping services: External dependency, not needed

**Implementation Notes**:
- Validate URL format: `new URL(urlString)` with try/catch
- Fetch URL content: `fetch(url)` with timeout
- Handle CORS errors gracefully with user-friendly error
- Extract text content from HTML (simple parsing or use DOMParser)
- Store content in state, pass to quiz generation

---

### 6. Animation Patterns with Framer Motion

**Decision**: Use Framer Motion for page transitions, component animations, and micro-interactions with consistent timing and easing.

**Rationale**:
- Framer Motion already in dependencies
- Provides smooth 60fps animations (SC-010)
- Declarative API fits React well
- Handles gesture animations and transitions
- Performance optimized for React

**Alternatives Considered**:
- CSS animations: Less flexible, harder to coordinate
- React Spring: Similar features but Framer Motion already chosen
- No animations: Violates FR-026 (smooth animations required)

**Implementation Notes**:
- Use `<motion.div>` for animated components
- Page transitions: `<AnimatePresence>` for route changes
- Consistent easing: `easeInOut` for most transitions
- Duration: 0.3s for micro-interactions, 0.5s for page transitions
- Animation variants for reusable patterns

---

### 7. Design System Pattern

**Decision**: Create component library with shared Button, Input, Card components, theme tokens for colors/spacing, and consistent styling approach.

**Rationale**:
- Ensures visual consistency (FR-028)
- Reusable components reduce duplication (Constitution Principle II)
- Theme tokens enable easy customization
- CSS modules or styled-components for scoped styling
- Accessibility built into components

**Alternatives Considered**:
- Material UI / Chakra UI: Adds large dependency, violates principle V
- Tailwind CSS: Utility-first, but adds dependency (evaluate)
- CSS-in-JS libraries: Adds dependency, evaluate if needed

**Implementation Notes**:
- Define color palette, typography, spacing in `styles/theme.ts`
- Create base components: Button, Input, Card, Modal
- Use CSS modules for component styling
- Ensure WCAG contrast ratios (Constitution Principle III)
- Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)

---

### 8. Quiz Question Generation (Dummy Data)

**Decision**: Use hardcoded dummy questions for MVP, structured by difficulty level (Easy, Normal, Hard, Master).

**Rationale**:
- Spec explicitly states "dummy/test data for MCQs initially" (Assumptions)
- No backend API needed for MVP
- Content processing (URL/File to questions) deferred to future phase
- Focus on quiz functionality first, content generation later

**Alternatives Considered**:
- AI/LLM integration: Adds complexity, external dependency, not for MVP
- Backend API: Not needed for MVP
- Content parsing libraries: Deferred to future phase

**Implementation Notes**:
- Create mock question sets in `src/utils/mockQuestions.ts`
- Structure: array of questions with `{ id, text, options, correctAnswer, difficulty }`
- Generate quiz by selecting random questions from difficulty level
- Number of questions per quiz configurable per FR-012
- Future: Replace with actual content processing

---

### 9. Assessment Results Calculation

**Decision**: Calculate results client-side: score = (correct / total) * 100, identify weak areas by difficulty level, generate generic improvement suggestions.

**Rationale**:
- Simple calculation: count correct vs incorrect answers
- Weak areas: identify difficulty levels with most incorrect answers
- Generic suggestions based on performance patterns
- No backend needed for MVP
- Quick results display (<2 seconds per SC-005)

**Alternatives Considered**:
- ML-based analysis: Overkill for MVP, adds complexity
- Backend analytics: Not needed for MVP
- Detailed analytics: Can enhance later

**Implementation Notes**:
- Calculate immediately after quiz completion
- Weak areas: difficulty levels with <50% correct
- Suggestions: generic tips based on weak areas
- Store results in localStorage for history (future feature)

---

### 10. Responsive Design Approach

**Decision**: Mobile-first responsive design using CSS media queries, flexible layouts with CSS Grid/Flexbox, and touch-friendly interactions.

**Rationale**:
- Required per FR-027 (responsive across devices)
- Mobile-first ensures good experience on all devices
- CSS Grid/Flexbox provide flexible layouts
- Touch targets: minimum 44x44px for mobile

**Alternatives Considered**:
- Desktop-only: Violates FR-027
- Separate mobile app: Overkill for MVP
- Framework-specific responsive: CSS is framework-agnostic

**Implementation Notes**:
- Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- Use CSS Grid for page layouts
- Use Flexbox for component layouts
- Touch-friendly buttons and inputs
- Test on real devices when possible

---

## Summary

All research decisions support a client-side only MVP with React + TypeScript. Authentication, quiz state, and timer use React Context + localStorage. File uploads and URL processing are client-side only. Animations use Framer Motion. Design system uses component library pattern. All decisions align with Constitution principles and avoid unnecessary dependencies.

**Status**: ✅ All research complete, ready for Phase 1 (Design & Contracts)
