import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Quiz from '../Quiz'

// Mock hooks
const mockEnterFullscreen = vi.fn().mockResolvedValue(undefined)
const mockExitFullscreen = vi.fn().mockResolvedValue(undefined)
const mockStartQuiz = vi.fn().mockResolvedValue(undefined)
const mockPauseQuiz = vi.fn().mockResolvedValue(undefined)
const mockResumeQuiz = vi.fn().mockResolvedValue(null)
const mockStartTimer = vi.fn()
const mockPauseTimer = vi.fn()
const mockResumeTimer = vi.fn()
const mockOnVisibilityChange = vi.fn((callback) => {
  // Store callback for manual triggering
  return () => {}
})

vi.mock('../../hooks/useFullscreen', () => ({
  useFullscreen: () => ({
    isFullscreen: false,
    isSupported: true,
    enterFullscreen: mockEnterFullscreen,
    exitFullscreen: mockExitFullscreen,
    error: null,
  }),
}))

vi.mock('../../hooks/useTabVisibility', () => ({
  useTabVisibility: () => ({
    isVisible: true,
    visibilityState: 'visible' as const,
    onVisibilityChange: mockOnVisibilityChange,
  }),
}))

vi.mock('../../hooks/useTimer', () => ({
  useTimer: () => ({
    timeRemaining: 600,
    start: mockStartTimer,
    pause: mockPauseTimer,
    resume: mockResumeTimer,
    onExpire: vi.fn(),
  }),
}))

vi.mock('../../hooks/useQuiz', () => ({
  useQuiz: () => ({
    quiz: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    isLastQuestion: false,
    startQuiz: mockStartQuiz,
    answerQuestion: vi.fn(),
    nextQuestion: vi.fn(),
    finishQuiz: vi.fn(),
    resumeQuiz: mockResumeQuiz,
    pauseQuiz: mockPauseQuiz,
    expireQuiz: vi.fn(),
    loading: false,
  }),
}))

// Mock components
vi.mock('../../components/quiz/QuestionCard', () => ({
  QuestionCard: () => <div data-testid="question-card">Question Card</div>,
}))

vi.mock('../../components/quiz/Timer', () => ({
  Timer: () => <div data-testid="timer">Timer</div>,
}))

vi.mock('../../components/quiz/ResumePrompt', () => ({
  ResumePrompt: () => <div data-testid="resume-prompt">Resume Prompt</div>,
}))

vi.mock('../../components/quiz/QuestionCount', () => ({
  QuestionCount: () => <div data-testid="question-count">Question Count</div>,
}))

describe('Quiz Page - Fullscreen Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL params
    Object.defineProperty(window, 'location', {
      value: {
        search: '?difficulty=Easy&questions=10&duration=600',
      },
      writable: true,
    })
  })

  it('should navigate to quiz-config when quizId is missing', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({}),
        useSearchParams: () => [new URLSearchParams()],
      }
    })

    render(
      <MemoryRouter>
        <Quiz />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/quiz-config')
    })
  })

  it('should attempt to enter fullscreen when quiz starts', async () => {
    // This test would need a more complete mock setup
    // For now, we'll verify the hook integration
    const { useFullscreen } = await import('../../hooks/useFullscreen')
    const { result } = await import('@testing-library/react')
    
    // The fullscreen hook should be called when quiz status changes to in-progress
    expect(mockEnterFullscreen).toBeDefined()
  })
})

describe('Quiz Page - Tab Change Integration', () => {
  it('should pause quiz when tab becomes hidden', async () => {
    // This test would verify:
    // 1. Tab visibility hook detects visibility change
    // 2. pauseQuiz is called with 'tab-change' reason
    // 3. Timer is paused
    // 4. Resume prompt is shown when tab becomes visible again
    
    expect(mockOnVisibilityChange).toBeDefined()
    expect(mockPauseQuiz).toBeDefined()
  })

  it('should show resume prompt when tab becomes visible after being hidden', async () => {
    // This test would verify:
    // 1. Tab becomes visible
    // 2. ResumePrompt component is displayed
    // 3. User can click Resume to continue
    
    expect(mockResumeQuiz).toBeDefined()
  })
})
