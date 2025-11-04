# Tasks: Learning Application

**Input**: Design documents from `/specs/001-learning-application/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per Constitution Principle I (TDD First - NON-NEGOTIABLE). All tests must be written first and fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Frontend-only structure with `src/` and `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan in src/
- [x] T002 [P] Create TypeScript type definitions in src/types/index.ts
- [x] T003 [P] Create global styles and theme in src/styles/globals.css and src/styles/theme.ts
- [x] T004 [P] Setup test configuration in src/test/setup.ts
- [x] T005 [P] Create test directory structure (tests/unit/, tests/integration/, tests/__mocks__/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create storage utility for localStorage/sessionStorage in src/utils/storage.ts
- [x] T007 [P] Create validation utility functions in src/utils/validation.ts
- [x] T008 [P] Create common Button component in src/components/common/Button.tsx
- [x] T009 [P] Create common Input component in src/components/common/Input.tsx
- [x] T010 [P] Create common Modal component in src/components/common/Modal.tsx
- [x] T011 [P] Create layout Header component in src/components/layout/Header.tsx
- [x] T012 Setup React Router configuration in src/App.tsx or src/main.tsx
- [x] T013 Create mock question data generator in src/utils/mockQuestions.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts, log in, and maintain sessions so they can track learning progress

**Independent Test**: Can be fully tested by creating a new account, logging out, logging back in, and verifying that the user session persists. The test delivers value by confirming users can establish their identity in the system and access protected features.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US1] Unit test for password validation in tests/unit/utils/validation.test.ts
- [ ] T015 [P] [US1] Unit test for email validation in tests/unit/utils/validation.test.ts
- [ ] T016 [P] [US1] Unit test for auth utilities (password hashing) in tests/unit/utils/auth.test.ts
- [ ] T017 [P] [US1] Unit test for useAuth hook in tests/unit/hooks/useAuth.test.tsx
- [ ] T018 [P] [US1] Unit test for Login component in tests/unit/components/auth/Login.test.tsx
- [ ] T019 [P] [US1] Unit test for Signup component in tests/unit/components/auth/Signup.test.tsx
- [ ] T020 [P] [US1] Integration test for signup flow in tests/integration/auth/signup.test.tsx
- [ ] T021 [P] [US1] Integration test for login flow in tests/integration/auth/login.test.tsx
- [ ] T022 [P] [US1] Integration test for session persistence in tests/integration/auth/session.test.tsx

### Implementation for User Story 1

- [x] T023 [P] [US1] Create User type definition in src/types/index.ts
- [x] T024 [US1] Create authentication utilities in src/utils/auth.ts (password hashing with Web Crypto API)
- [x] T025 [US1] Create useAuth hook in src/hooks/useAuth.ts (signup, login, logout, session management)
- [x] T026 [US1] Create useLocalStorage hook in src/hooks/useLocalStorage.ts
- [x] T027 [US1] Create Login component in src/components/auth/Login.tsx
- [x] T028 [US1] Create Signup component in src/components/auth/Signup.tsx
- [x] T029 [US1] Create Login page in src/pages/Login.tsx
- [x] T030 [US1] Create Signup page in src/pages/Signup.tsx
- [x] T031 [US1] Add authentication routes to React Router configuration
- [x] T032 [US1] Add protected route wrapper for authenticated pages
- [x] T033 [US1] Implement password policy validation (8+ chars, letter + number) in src/utils/validation.ts
- [x] T034 [US1] Implement email validation in src/utils/validation.ts
- [x] T035 [US1] Add error handling and user feedback for authentication errors

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can sign up, log in, log out, and sessions persist across page navigation.

---

## Phase 4: User Story 2 - MCQs Learning Journey (Priority: P1) 🎯 MVP

**Goal**: Enable users to provide learning content, configure quizzes, take timed quizzes, and view assessment results with performance insights

**Independent Test**: Can be fully tested by manually entering a topic, selecting MCQ mode, configuring quiz settings (difficulty, number of questions, time), completing the quiz, and reviewing results. The test delivers value by demonstrating the complete learning cycle from content input through assessment.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T036 [P] [US2] Unit test for quiz utilities in tests/unit/utils/quiz.test.ts
- [ ] T037 [P] [US2] Unit test for useTimer hook in tests/unit/hooks/useTimer.test.tsx
- [ ] T038 [P] [US2] Unit test for useQuiz hook in tests/unit/hooks/useQuiz.test.tsx
- [ ] T039 [P] [US2] Unit test for QuestionCard component in tests/unit/components/quiz/QuestionCard.test.tsx
- [ ] T040 [P] [US2] Unit test for Timer component in tests/unit/components/quiz/Timer.test.tsx
- [ ] T041 [P] [US2] Unit test for QuizConfig component in tests/unit/components/quiz/QuizConfig.test.tsx
- [ ] T042 [P] [US2] Unit test for AssessmentResults component in tests/unit/components/quiz/AssessmentResults.test.tsx
- [ ] T043 [P] [US2] Integration test for complete quiz journey in tests/integration/quiz/quiz-journey.test.tsx
- [ ] T044 [P] [US2] Integration test for timer expiration and auto-submit in tests/integration/quiz/timer-expiration.test.tsx
- [ ] T045 [P] [US2] Integration test for quiz resume functionality in tests/integration/quiz/quiz-resume.test.tsx

### Implementation for User Story 2

- [x] T046 [P] [US2] Create ContentInput type definition in src/types/index.ts
- [x] T047 [P] [US2] Create QuizConfiguration type definition in src/types/index.ts
- [x] T048 [P] [US2] Create Question type definition in src/types/index.ts
- [x] T049 [P] [US2] Create QuizInstance type definition in src/types/index.ts
- [x] T050 [P] [US2] Create AssessmentResult type definition in src/types/index.ts
- [x] T051 [US2] Create quiz utilities in src/utils/quiz.ts (question generation, scoring, assessment calculation)
- [x] T052 [US2] Create useTimer hook in src/hooks/useTimer.ts (timer management with expiration callback)
- [x] T053 [US2] Create useQuiz hook in src/hooks/useQuiz.ts (quiz state management, answers, progress saving)
- [x] T054 [US2] Create Home page in src/pages/Home.tsx with manual input option and animations
- [x] T055 [US2] Create LearningModes page in src/pages/LearningModes.tsx with MCQs enabled and others Coming Soon
- [x] T056 [US2] Create QuizConfig component in src/components/quiz/QuizConfig.tsx (difficulty, number, time duration)
- [x] T057 [US2] Create QuizConfig page in src/pages/QuizConfig.tsx
- [x] T058 [US2] Create QuestionCard component in src/components/quiz/QuestionCard.tsx
- [x] T059 [US2] Create Timer component in src/components/quiz/Timer.tsx
- [x] T060 [US2] Create Quiz page in src/pages/Quiz.tsx (one question at a time, Next/Finish button)
- [x] T061 [US2] Implement quiz progress auto-save to localStorage in src/hooks/useQuiz.ts
- [x] T062 [US2] Implement quiz resume functionality (load from localStorage, resume timer) in src/hooks/useQuiz.ts
- [x] T063 [US2] Implement timer expiration auto-submit in src/hooks/useQuiz.ts
- [x] T064 [US2] Create AssessmentResults component in src/components/quiz/AssessmentResults.tsx (score, correct/incorrect count, percentage)
- [x] T065 [US2] Create Assessment page in src/pages/Assessment.tsx with View Summary option
- [x] T066 [US2] Implement assessment calculation (score, weak areas, suggestions) in src/utils/quiz.ts
- [x] T067 [US2] Create AssessmentSummary component in src/components/quiz/AssessmentSummary.tsx (performance review, weak areas, suggestions)
- [x] T068 [US2] Add quiz routes to React Router configuration
- [x] T069 [US2] Implement quiz state cleanup on completion/expiration

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. Users can input content, configure quizzes, take timed quizzes, and view comprehensive results with auto-submit on timer expiration and resume capability.

---

## Phase 5: User Story 3 - Content Input via File Upload (Priority: P2)

**Goal**: Enable users to upload PDF, DOC, or TXT files as learning content so they can learn from existing documents

**Independent Test**: Can be fully tested by uploading a PDF/DOC/TXT file from the home page, verifying the file is accepted, and proceeding to learning modes. The test delivers value by confirming students can use their existing documents as learning sources.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T070 [P] [US3] Unit test for file validation utility in tests/unit/utils/validation.test.ts
- [ ] T071 [P] [US3] Unit test for FileUpload component in tests/unit/components/common/FileUpload.test.tsx
- [ ] T072 [P] [US3] Integration test for file upload flow in tests/integration/content/file-upload.test.tsx
- [ ] T073 [P] [US3] Integration test for invalid file type rejection in tests/integration/content/file-validation.test.tsx
- [ ] T074 [P] [US3] Integration test for file size limit validation in tests/integration/content/file-size.test.tsx

### Implementation for User Story 3

- [x] T075 [US3] Implement file validation utility (type and size) in src/utils/validation.ts
- [x] T076 [US3] Create FileUpload component in src/components/common/FileUpload.tsx (with progress indicator)
- [x] T077 [US3] Update Home page to include file upload option in src/pages/Home.tsx
- [x] T078 [US3] Implement file reading using FileReader API in src/utils/storage.ts or new utility
- [x] T079 [US3] Add error handling for invalid file types and size limits
- [x] T080 [US3] Integrate file upload with learning modes flow (pass file content to LearningModes page)

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently. Users can upload PDF/DOC/TXT files (up to 5MB), see validation errors for invalid files, and proceed to learning modes with file content.

---

## Phase 6: User Story 4 - Content Input via URL (Priority: P2)

**Goal**: Enable users to paste web links to online learning content so they can learn directly from web resources

**Independent Test**: Can be fully tested by pasting a valid URL on the home page, verifying the URL is accepted, and proceeding to learning modes. The test delivers value by confirming students can use web content as a learning source.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T081 [P] [US4] Unit test for URL validation utility in tests/unit/utils/validation.test.ts
- [ ] T082 [P] [US4] Unit test for URLInput component in tests/unit/components/common/URLInput.test.tsx
- [ ] T083 [P] [US4] Integration test for URL input flow in tests/integration/content/url-input.test.tsx
- [ ] T084 [P] [US4] Integration test for invalid URL format rejection in tests/integration/content/url-validation.test.tsx
- [ ] T085 [P] [US4] Integration test for inaccessible URL handling in tests/integration/content/url-accessibility.test.tsx

### Implementation for User Story 4

- [x] T086 [US4] Implement URL validation utility in src/utils/validation.ts
- [x] T087 [US4] Create URLInput component in src/components/common/URLInput.tsx
- [x] T088 [US4] Update Home page to include URL input option in src/pages/Home.tsx
- [x] T089 [US4] Implement URL content fetching with fetch API and error handling in src/utils/storage.ts or new utility
- [x] T090 [US4] Add error handling for invalid URL format and inaccessible URLs (CORS errors)
- [x] T091 [US4] Integrate URL input with learning modes flow (pass URL content to LearningModes page)

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently. Users can paste URLs, see validation errors for invalid URLs, and proceed to learning modes with URL content.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T092 [P] Add Framer Motion animations to all page transitions in src/pages/
- [x] T093 [P] Add Framer Motion animations to component interactions in src/components/
- [x] T094 [P] Implement responsive design breakpoints in src/styles/theme.ts
- [ ] T095 [P] Add responsive styles to all components for mobile/tablet/desktop
- [x] T096 [P] Implement accessibility features (keyboard navigation, ARIA labels) across components
- [x] T097 [P] Add loading states and error boundaries throughout application
- [ ] T098 [P] Optimize bundle size with code splitting (React.lazy for routes)
- [x] T099 [P] Performance optimization (memoization, useMemo, useCallback where needed)
- [x] T100 [P] Add global error handling and user-friendly error messages
- [ ] T101 [P] Code cleanup and refactoring across all modules
- [ ] T102 [P] Run ESLint and fix all linting issues
- [ ] T103 [P] Run Prettier and format all code
- [ ] T104 [P] Update README.md with setup and usage instructions
- [ ] T105 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on User Story 1 (authentication required for logged-in users)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on User Story 1 (authentication) and User Story 2 (learning modes page)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on User Story 1 (authentication) and User Story 2 (learning modes page)

### Within Each User Story

- Tests (included per TDD requirement) MUST be written and FAIL before implementation
- Types/Models before utilities/hooks
- Utilities/Hooks before components
- Components before pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T005)
- All Foundational tasks marked [P] can run in parallel (T007-T011)
- Once Foundational phase completes:
  - User Story 1 tests can all run in parallel (T014-T022)
  - User Story 1 type definitions can run in parallel (T023)
  - User Story 2 tests can all run in parallel (T036-T045)
  - User Story 2 type definitions can run in parallel (T046-T050)
  - User Story 3 and 4 can be worked on in parallel after User Story 2 is complete
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after dependencies are met)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for password validation in tests/unit/utils/validation.test.ts"
Task: "Unit test for email validation in tests/unit/utils/validation.test.ts"
Task: "Unit test for auth utilities (password hashing) in tests/unit/utils/auth.test.ts"
Task: "Unit test for useAuth hook in tests/unit/hooks/useAuth.test.tsx"
Task: "Unit test for Login component in tests/unit/components/auth/Login.test.tsx"
Task: "Unit test for Signup component in tests/unit/components/auth/Signup.test.tsx"
Task: "Integration test for signup flow in tests/integration/auth/signup.test.tsx"
Task: "Integration test for login flow in tests/integration/auth/login.test.tsx"
Task: "Integration test for session persistence in tests/integration/auth/session.test.tsx"

# Launch type definition:
Task: "Create User type definition in src/types/index.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for quiz utilities in tests/unit/utils/quiz.test.ts"
Task: "Unit test for useTimer hook in tests/unit/hooks/useTimer.test.tsx"
Task: "Unit test for useQuiz hook in tests/unit/hooks/useQuiz.test.tsx"
Task: "Unit test for QuestionCard component in tests/unit/components/quiz/QuestionCard.test.tsx"
Task: "Unit test for Timer component in tests/unit/components/quiz/Timer.test.tsx"
Task: "Unit test for QuizConfig component in tests/unit/components/quiz/QuizConfig.test.tsx"
Task: "Unit test for AssessmentResults component in tests/unit/components/quiz/AssessmentResults.test.tsx"
Task: "Integration test for complete quiz journey in tests/integration/quiz/quiz-journey.test.tsx"
Task: "Integration test for timer expiration and auto-submit in tests/integration/quiz/timer-expiration.test.tsx"
Task: "Integration test for quiz resume functionality in tests/integration/quiz/quiz-resume.test.tsx"

# Launch all type definitions together:
Task: "Create ContentInput type definition in src/types/index.ts"
Task: "Create QuizConfiguration type definition in src/types/index.ts"
Task: "Create Question type definition in src/types/index.ts"
Task: "Create QuizInstance type definition in src/types/index.ts"
Task: "Create AssessmentResult type definition in src/types/index.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (MCQs Learning Journey)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: Prepares User Story 2 (waits for US1)
3. Once User Story 1 is complete:
   - Developer A: User Story 2 (MCQs)
   - Developer B: User Story 3 (File Upload - waits for US2)
   - Developer C: User Story 4 (URL Input - waits for US2)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tests are mandatory per Constitution Principle I (TDD First - NON-NEGOTIABLE)

---

## Task Summary

- **Total Tasks**: 105
- **Setup Tasks**: 5 (T001-T005)
- **Foundational Tasks**: 8 (T006-T013)
- **User Story 1 Tasks**: 22 (T014-T035)
- **User Story 2 Tasks**: 34 (T036-T069)
- **User Story 3 Tasks**: 11 (T070-T080)
- **User Story 4 Tasks**: 11 (T081-T091)
- **Polish Tasks**: 14 (T092-T105)

**Parallel Opportunities**: 65+ tasks marked with [P] can run in parallel

**MVP Scope**: User Stories 1 & 2 (P1 priority stories) = 56 tasks total
