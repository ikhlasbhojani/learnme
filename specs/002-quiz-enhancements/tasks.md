# Tasks: Quiz Enhancements

**Input**: Design documents from `/specs/002-quiz-enhancements/`
**Prerequisites**: plan.md ?, spec.md ?, research.md ?, data-model.md ?, contracts/ ?

**Tests**: TDD is NON-NEGOTIABLE per constitution - all tests must be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3], [US4])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type extensions

- [x] T001 Extend User type with themePreference field in src/types/index.ts
- [x] T002 Extend QuizInstance type with pauseReason, pausedAt, pauseCount fields in src/types/index.ts
- [x] T003 [P] Create theme CSS variables structure in src/styles/globals.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and utilities that MUST be complete before ANY user story can be implemented

**?? CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create useFullscreen hook in src/hooks/useFullscreen.ts
- [x] T005 [P] Create useTabVisibility hook in src/hooks/useTabVisibility.ts
- [x] T006 [P] Create useTheme hook in src/hooks/useTheme.ts
- [x] T007 Extend quiz utils with pauseQuiz function in src/utils/quiz.ts
- [x] T008 Extend quiz utils with resumeQuiz function in src/utils/quiz.ts
- [x] T009 Extend useQuiz hook to support pause/resume functionality in src/hooks/useQuiz.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quiz Fullscreen Mode and Tab Change Detection (Priority: P1) ?? MVP

**Goal**: Implement fullscreen mode on quiz start and tab change detection to pause/resume quiz, maintaining quiz integrity.

**Independent Test**: Start a quiz, verify fullscreen activates, switch tabs, return to quiz, confirm pause and resume functionality works. Test delivers value by demonstrating quiz integrity protection.

### Tests for User Story 1 ??

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Write unit test for useFullscreen hook in src/hooks/__tests__/useFullscreen.test.ts
- [x] T011 [P] [US1] Write unit test for useTabVisibility hook in src/hooks/__tests__/useTabVisibility.test.ts
- [x] T012 [P] [US1] Write unit test for pauseQuiz function in src/utils/__tests__/quiz.test.ts
- [x] T013 [P] [US1] Write unit test for resumeQuiz function in src/utils/__tests__/quiz.test.ts
- [x] T014 [P] [US1] Write unit test for ResumePrompt component in src/components/quiz/__tests__/ResumePrompt.test.tsx
- [x] T015 [US1] Write integration test for fullscreen quiz start flow in src/pages/__tests__/Quiz.test.tsx
- [x] T016 [US1] Write integration test for tab change pause/resume flow in src/pages/__tests__/Quiz.test.tsx

### Implementation for User Story 1

- [x] T017 [US1] Create ResumePrompt component in src/components/quiz/ResumePrompt.tsx
- [x] T018 [US1] Integrate useFullscreen hook in Quiz page to enter fullscreen on start in src/pages/Quiz.tsx
- [x] T019 [US1] Add fullscreen error handling when API not supported in src/pages/Quiz.tsx
- [x] T020 [US1] Integrate useTabVisibility hook in Quiz page for tab change detection in src/pages/Quiz.tsx
- [x] T021 [US1] Implement quiz pause on tab switch (calling pauseQuiz) in src/pages/Quiz.tsx
- [x] T022 [US1] Implement resume prompt display when user returns to tab in src/pages/Quiz.tsx
- [x] T023 [US1] Implement quiz resume functionality with timer calculation (paused time doesn't count) in src/pages/Quiz.tsx
- [x] T023A [US1] Add Page Visibility API failure warning display in src/pages/Quiz.tsx (per FR-003 clarification)
- [x] T024 [US1] Hide Header component when quiz is in fullscreen mode in src/pages/Quiz.tsx
- [x] T025 [US1] Implement fullscreen exit handling (Escape key with confirmation) in src/pages/Quiz.tsx
- [x] T026 [US1] Handle browser control fullscreen exit (F11, etc.) without pausing in src/pages/Quiz.tsx
- [x] T027 [US1] Add fullscreen styles to hide navigation elements in src/styles/globals.css
- [x] T028 [US1] Update useQuiz hook to save pause state to localStorage in src/hooks/useQuiz.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Quiz enters fullscreen on start, pauses on tab switch, and resumes when user returns.

---

## Phase 4: User Story 2 - Question Count Display in Quiz Screen (Priority: P1)

**Goal**: Display current question number and total questions prominently on quiz screen, updating on navigation.

**Independent Test**: Start a quiz with 10 questions, verify "Question 1 of 10" displays, navigate to next question, confirm count updates to "Question 2 of 10". Test delivers value by demonstrating clear progress tracking.

### Tests for User Story 2 ??

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T029 [P] [US2] Write unit test for QuestionCount component in src/components/quiz/__tests__/QuestionCount.test.tsx
- [x] T030 [US2] Write integration test for question count display in quiz page in src/pages/__tests__/Quiz-question-count.test.tsx
- [x] T031 [US2] Write integration test for question count updates on navigation in src/pages/__tests__/Quiz-question-count.test.tsx

### Implementation for User Story 2

- [x] T032 [US2] Create QuestionCount component in src/components/quiz/QuestionCount.tsx
- [x] T033 [US2] Integrate QuestionCount component in Quiz page in src/pages/Quiz.tsx
- [x] T034 [US2] Pass current question index and total questions to QuestionCount in src/pages/Quiz.tsx
- [x] T035 [US2] Update QuestionCount display format to "Question X of Y" in src/components/quiz/QuestionCount.tsx
- [x] T036 [US2] Add ARIA labels for accessibility in QuestionCount component in src/components/quiz/QuestionCount.tsx
- [x] T037 [US2] Style QuestionCount to be prominently visible in quiz screen in src/components/quiz/QuestionCount.tsx
- [x] T038 [US2] Ensure QuestionCount updates when navigating between questions in src/pages/Quiz.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Question count displays correctly and updates on navigation.

---

## Phase 5: User Story 3 - Enhanced Animations (Priority: P2)

**Goal**: Add smooth animations throughout the application for page transitions, interactions, loading states, and question transitions.

**Independent Test**: Navigate between pages, interact with buttons, observe loading states, and move between quiz questions - all should have smooth animations within 300ms for transitions and 100ms for interactions. Test delivers value by demonstrating enhanced, polished user experience.

### Tests for User Story 3 ??

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T039 [P] [US3] Write unit test for page transition animations in src/components/__tests__/PageTransition.test.tsx
- [ ] T040 [P] [US3] Write integration test for button hover/click animations in src/components/common/__tests__/Button.test.tsx
- [ ] T041 [US3] Write integration test for quiz question transition animations in src/pages/__tests__/Quiz.test.tsx

### Implementation for User Story 3

- [ ] T042 [US3] Add page transition animations using Framer Motion AnimatePresence in src/App.tsx
- [ ] T043 [US3] Add hover animations to Button component in src/components/common/Button.tsx
- [ ] T044 [US3] Add click animations to Button component in src/components/common/Button.tsx
- [ ] T045 [US3] Add hover animations to interactive cards and inputs in src/components/common/
- [ ] T046 [US3] Add loading spinner animation for quiz generation in src/pages/QuizConfig.tsx
- [ ] T047 [US3] Add loading skeleton screens for quiz loading states in src/components/quiz/
- [ ] T048 [US3] Add smooth transition animations between quiz questions in src/pages/Quiz.tsx
- [ ] T049 [US3] Respect prefers-reduced-motion media query in all animations in src/styles/globals.css
- [ ] T049A [US3] Disable decorative animations when prefers-reduced-motion is enabled (per FR-011-FR-014 clarification) in src/styles/globals.css
- [ ] T049B [US3] Preserve essential transitions (page navigation) when prefers-reduced-motion is enabled in src/styles/globals.css
- [ ] T050 [US3] Ensure all animations complete within 300ms (transitions) or 100ms (interactions) per SC-005 and SC-006

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Animations are smooth and respect user preferences.

---

## Phase 6: User Story 4 - Color Theme Customization (Priority: P2)

**Goal**: Implement theme switching with persistence in user account, applying themes immediately across all pages.

**Independent Test**: Access theme settings, select a theme, verify it applies across all pages immediately, log out and log back in, confirm theme preference is remembered. Test delivers value by demonstrating personalization capabilities.

### Tests for User Story 4 ??

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T051 [P] [US4] Write unit test for useTheme hook in src/hooks/__tests__/useTheme.test.ts
- [ ] T052 [P] [US4] Write unit test for ThemeSelector component in src/components/common/__tests__/ThemeSelector.test.tsx
- [ ] T053 [US4] Write integration test for theme switching and persistence in src/hooks/__tests__/useTheme.test.ts
- [ ] T054 [US4] Write integration test for theme loading on login in src/hooks/__tests__/useAuth.test.ts

### Implementation for User Story 4

- [ ] T055 [US4] Create ThemeSelector component in src/components/common/ThemeSelector.tsx
- [ ] T056 [US4] Add theme preview functionality to ThemeSelector in src/components/common/ThemeSelector.tsx
- [ ] T057 [US4] Integrate useTheme hook in ThemeSelector component in src/components/common/ThemeSelector.tsx
- [ ] T058 [US4] Add theme CSS variables for light theme in src/styles/globals.css
- [ ] T059 [US4] Add theme CSS variables for dark theme in src/styles/globals.css
- [ ] T060 [US4] Add theme CSS variables for blue theme in src/styles/globals.css
- [ ] T061 [US4] Add theme CSS variables for green theme in src/styles/globals.css
- [ ] T062 [US4] Implement theme application via data-theme attribute in useTheme hook in src/hooks/useTheme.ts
- [ ] T063 [US4] Implement theme persistence in user account in useTheme hook in src/hooks/useTheme.ts
- [ ] T063A [US4] Add theme save failure notification (use default theme, show notification) in src/hooks/useTheme.ts (per FR-018 clarification)
- [ ] T064 [US4] Implement theme loading on login in useAuth hook in src/hooks/useAuth.ts
- [ ] T064A [US4] Add theme load failure notification (use default theme, show notification) in src/hooks/useAuth.ts (per FR-019 clarification)
- [ ] T065 [US4] Add ThemeSelector to Header or Settings page in src/components/layout/Header.tsx
- [ ] T066 [US4] Ensure theme changes apply immediately across all pages in src/hooks/useTheme.ts
- [ ] T066A [US4] Ensure theme changes apply immediately during active quiz (per clarification) in src/pages/Quiz.tsx
- [ ] T067 [US4] Add smooth theme transition (300ms) without flickering in src/styles/globals.css
- [ ] T068 [US4] Ensure theme works during active quiz without interrupting progress in src/pages/Quiz.tsx

**Checkpoint**: At this point, all user stories should now be independently functional. Theme switching works with persistence.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

- [ ] T069 [P] Update documentation in README.md with new features
- [ ] T070 [P] Run ESLint and fix any linting errors across all new files
- [ ] T071 [P] Run Prettier and format all code across all new files
- [ ] T072 [P] Run all tests and ensure 100% pass rate for new features
- [ ] T073 [P] Verify accessibility (ARIA labels, keyboard navigation) across all new components
- [ ] T074 [P] Verify performance metrics (SC-001 through SC-007) are met
- [ ] T075 [P] Test fullscreen and tab detection in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] T076 [P] Test theme switching in different browsers
- [ ] T077 [P] Verify all animations respect prefers-reduced-motion
- [ ] T078 [P] Verify theme persistence across browser sessions
- [ ] T079 [P] Verify quiz pause/resume works correctly with timer
- [ ] T080 [P] Run quickstart.md validation to ensure all examples work
- [ ] T081 Code cleanup and refactoring of any duplicated logic
- [ ] T082 Review and optimize bundle size (should be minimal since using native APIs)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 ? P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (can run in parallel with US1)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances existing UI but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Uses useTheme hook from Phase 2, independently testable

### Within Each User Story

- Tests (required per TDD) MUST be written and FAIL before implementation
- Hooks/utilities before components
- Components before integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks can run in parallel (T001, T002, T003)
- Foundational tasks marked [P] can run in parallel (T005, T006)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (both P1)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- Polish tasks marked [P] can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test for useFullscreen hook in src/hooks/__tests__/useFullscreen.test.ts"
Task: "Write unit test for useTabVisibility hook in src/hooks/__tests__/useTabVisibility.test.ts"
Task: "Write unit test for pauseQuiz function in src/utils/__tests__/quiz.test.ts"
Task: "Write unit test for resumeQuiz function in src/utils/__tests__/quiz.test.ts"
Task: "Write unit test for ResumePrompt component in src/components/quiz/__tests__/ResumePrompt.test.tsx"

# Then launch implementation tasks in order:
Task: "Create ResumePrompt component in src/components/quiz/ResumePrompt.tsx"
Task: "Integrate useFullscreen hook in Quiz page..." (depends on T004 from Phase 2)
Task: "Integrate useTabVisibility hook in Quiz page..." (depends on T005 from Phase 2)
```

---

## Parallel Example: User Stories 1 and 2

```bash
# After Foundational phase, both P1 stories can run in parallel:

# Developer A: User Story 1
Task: "Write tests for US1..."
Task: "Implement US1 features..."

# Developer B: User Story 2  
Task: "Write tests for US2..."
Task: "Implement US2 features..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T010-T028)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational ? Foundation ready
2. Add User Story 1 ? Test independently ? Deploy/Demo (MVP!)
3. Add User Story 2 ? Test independently ? Deploy/Demo
4. Add User Story 3 ? Test independently ? Deploy/Demo
5. Add User Story 4 ? Test independently ? Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Fullscreen & Tab Detection)
   - Developer B: User Story 2 (Question Count) - can run in parallel with US1
   - Developer C: User Story 3 (Animations) - can start after US1/US2
   - Developer D: User Story 4 (Themes) - can start after Phase 2 (uses useTheme hook)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD is NON-NEGOTIABLE** - verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All new code must pass ESLint and Prettier checks
- Performance goals must be met (SC-001 through SC-007)

---

## Summary

- **Total Tasks**: 88
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (User Story 1)**: 20 tasks (6 tests + 14 implementation)
- **Phase 4 (User Story 2)**: 10 tasks (3 tests + 7 implementation)
- **Phase 5 (User Story 3)**: 14 tasks (3 tests + 11 implementation)
- **Phase 6 (User Story 4)**: 21 tasks (4 tests + 17 implementation)
- **Phase 7 (Polish)**: 14 tasks

**Parallel Opportunities**: 
- Setup phase: 3 tasks can run in parallel
- Foundational phase: 2 tasks can run in parallel (T005, T006)
- User Stories 1 and 2: Can run in parallel (both P1)
- User Stories 3 and 4: Can run in parallel (both P2, after Phase 2)
- All polish tasks: Can run in parallel

**Independent Test Criteria**:
- **US1**: Start quiz ? fullscreen activates ? switch tab ? quiz pauses ? return ? resume works
- **US2**: Start quiz ? question count displays ? navigate ? count updates
- **US3**: Navigate pages ? animations smooth ? interact with buttons ? animations work
- **US4**: Select theme ? applies immediately ? log out ? log in ? theme persists

**Suggested MVP Scope**: User Story 1 only (Quiz Fullscreen Mode and Tab Change Detection) - provides core quiz integrity protection.
