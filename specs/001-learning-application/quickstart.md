# Quickstart Guide: Learning Application

**Feature**: 001-learning-application  
**Date**: 2024-12-19  
**Phase**: 1 - Design

## Prerequisites

- Node.js 18+ and npm/yarn
- Modern code editor (VS Code recommended)
- Git (optional, for version control)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.0.8
- React Router DOM 6.20.1
- Framer Motion 10.16.16
- Vitest and testing libraries

### 2. Start Development Server

```bash
npm run dev
```

Application runs at `http://localhost:5173` (Vite default port)

### 3. Run Tests

```bash
npm test
```

Or with UI:
```bash
npm run test:ui
```

### 4. Lint and Format Code

```bash
# Check linting
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Login, Signup components
│   ├── quiz/           # Quiz components (QuestionCard, Timer, Results)
│   ├── common/         # Shared components (Button, Input, Modal)
│   └── layout/         # Layout components (Header, Footer)
├── pages/              # Page-level components (routes)
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Home.tsx
│   ├── LearningModes.tsx
│   ├── QuizConfig.tsx
│   ├── Quiz.tsx
│   └── Assessment.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   ├── useQuiz.ts      # Quiz management hook
│   ├── useTimer.ts     # Timer hook
│   └── useLocalStorage.ts
├── utils/              # Utility functions
│   ├── auth.ts         # Authentication utilities
│   ├── quiz.ts         # Quiz logic
│   ├── validation.ts   # Form validation
│   └── storage.ts      # localStorage helpers
├── types/              # TypeScript definitions
│   └── index.ts
├── styles/             # Global styles
│   ├── globals.css
│   └── theme.ts
└── test/               # Test setup
    └── setup.ts

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── __mocks__/          # Mock data
```

## Development Workflow

### TDD Workflow (Constitution Principle I)

1. **Write Test First**
   ```bash
   # Create test file
   touch tests/unit/components/Button.test.tsx
   ```

2. **Write Failing Test**
   ```typescript
   describe('Button', () => {
     it('renders button with text', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });
   });
   ```

3. **Run Test (Should Fail)**
   ```bash
   npm test Button.test.tsx
   ```

4. **Write Minimal Code to Pass**
   ```typescript
   export function Button({ children }: Props) {
     return <button>{children}</button>;
   }
   ```

5. **Refactor While Keeping Tests Green**

### Adding a New Feature

1. **Create Component**
   ```bash
   # Create component file
   touch src/components/common/Button.tsx
   ```

2. **Write Tests First** (TDD)
   ```bash
   touch tests/unit/components/Button.test.tsx
   ```

3. **Implement Component**
   - Follow modular architecture
   - Use TypeScript types
   - Add proper error handling

4. **Add to Story/Page**
   - Import and use in appropriate page
   - Test in browser

5. **Run Linting**
   ```bash
   npm run lint
   npm run format
   ```

### Authentication Flow

1. **Signup Flow**
   - User enters email and password
   - Validate password policy (8+ chars, letter + number)
   - Hash password with Web Crypto API
   - Store user in localStorage
   - Create session

2. **Login Flow**
   - User enters email and password
   - Validate credentials
   - Load user from localStorage
   - Create session
   - Redirect to home

3. **Logout Flow**
   - Clear user from localStorage
   - Clear session
   - Redirect to login

### Quiz Flow

1. **Content Input**
   - User selects input method (URL/File/Manual)
   - Validate input (URL format, file type/size, text content)
   - Store content input (ephemeral)

2. **Quiz Configuration**
   - User selects difficulty (Easy/Normal/Hard/Master)
   - User enters number of questions (any positive number)
   - User enters time duration (any positive number, seconds)
   - Validate all fields filled
   - Enable Start button

3. **Quiz Start**
   - Generate questions based on difficulty
   - Create quiz instance
   - Start timer
   - Save to localStorage
   - Navigate to quiz page

4. **Quiz Taking**
   - Display one question at a time
   - Show timer countdown
   - Record answers
   - Auto-save progress
   - Navigate between questions

5. **Quiz Completion**
   - User clicks Finish or timer expires
   - Calculate score (correct/total)
   - Generate assessment result
   - Display results page
   - Clear from localStorage

6. **Quiz Resume**
   - Load quiz from localStorage on page load
   - Calculate remaining time
   - Resume from last question
   - Continue timer

## Key Technologies

### React Router
```typescript
// Route configuration
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/home" element={<Home />} />
  <Route path="/quiz/:quizId" element={<Quiz />} />
</Routes>
```

### Framer Motion
```typescript
// Page transitions
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

### localStorage
```typescript
// Storage utilities
import { storage } from '@/utils/storage';

// Save
storage.set('key', value);

// Load
const value = storage.get('key');

// Remove
storage.remove('key');
```

## Testing Guidelines

### Unit Tests
- Test individual components, hooks, utilities
- Mock external dependencies
- Test edge cases and error handling

### Integration Tests
- Test user flows (signup → login → quiz)
- Test component interactions
- Test localStorage persistence

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test user interaction
  });

  it('should handle error cases', () => {
    // Test error handling
  });
});
```

## Code Quality

### Linting Rules
- ESLint configured with TypeScript rules
- React hooks rules enforced
- No unused variables/imports

### Formatting
- Prettier configured
- Consistent code style
- Auto-format on save (VS Code)

### TypeScript
- Strict mode enabled
- All components typed
- No `any` types (use `unknown` if needed)

## Common Tasks

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in router configuration
3. Add navigation link if needed
4. Write tests

### Adding a New Component

1. Create component in appropriate `src/components/` subdirectory
2. Write tests first (TDD)
3. Implement component
4. Export from index if needed

### Adding a New Hook

1. Create hook in `src/hooks/`
2. Write tests first
3. Implement hook logic
4. Use in components

### Adding Validation

1. Add validation function in `src/utils/validation.ts`
2. Write tests for validation
3. Use in forms/components

## Performance Optimization

### Code Splitting
- Use React.lazy() for route components
- Lazy load heavy components

### Memoization
- Use React.memo() for expensive components
- Use useMemo() for expensive calculations
- Use useCallback() for function props

### Bundle Size
- Monitor bundle size with `npm run build`
- Avoid unnecessary dependencies
- Tree-shake unused code

## Debugging

### React DevTools
- Install React DevTools browser extension
- Inspect component state and props
- Debug hooks and context

### localStorage Inspection
- Open browser DevTools
- Application tab → Local Storage
- Inspect `learnme_user` and `learnme_quiz_*` keys

### Console Logging
- Use console.log for debugging (remove before commit)
- Use React DevTools for production debugging

## Next Steps

1. **Read the Spec**: Review [spec.md](./spec.md) for requirements
2. **Read the Data Model**: Review [data-model.md](./data-model.md) for entities
3. **Read Contracts**: Review [contracts/](./contracts/) for service interfaces
4. **Start with Tests**: Follow TDD workflow
5. **Build Incrementally**: Start with authentication, then quiz features

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Test Failures
```bash
# Run tests in watch mode
npm test -- --watch
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev)

---

**Remember**: Follow TDD principles, write tests first, maintain code quality, and keep the codebase modular and maintainable!
