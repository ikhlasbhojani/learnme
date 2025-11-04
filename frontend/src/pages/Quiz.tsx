import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuiz } from '../hooks/useQuiz'
import { useTimer } from '../hooks/useTimer'
import { useFullscreen } from '../hooks/useFullscreen'
import { useTabVisibility } from '../hooks/useTabVisibility'
import { QuestionCard } from '../components/quiz/QuestionCard'
import { Timer } from '../components/quiz/Timer'
import { ResumePrompt } from '../components/quiz/ResumePrompt'
import { QuestionCount } from '../components/quiz/QuestionCount'
import { QuizConfiguration } from '../types'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'

export default function Quiz() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    quiz,
    currentQuestion,
    currentQuestionIndex,
    isLastQuestion,
    startQuiz: startQuizHandler,
    answerQuestion,
    nextQuestion,
    finishQuiz,
    loadQuiz,
    resumeQuiz,
    pauseQuiz,
    expireQuiz: expireQuizHandler,
    loading,
  } = useQuiz()

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
  const [tabVisibilityWarning, setTabVisibilityWarning] = useState<string | null>(null)
  const { timeRemaining, start: startTimer, pause: pauseTimer, resume: resumeTimer, onExpire: setTimerExpire } = useTimer()
  const { isFullscreen, isSupported, enterFullscreen, exitFullscreen, error: fullscreenErrorState } = useFullscreen()
  const { isVisible, onVisibilityChange, isSupported: isTabVisibilitySupported } = useTabVisibility()
  const quizStartedRef = useRef(false)

  const handleTimerExpiration = useCallback(async () => {
    if (!quiz) return
    await expireQuizHandler()
  }, [quiz, expireQuizHandler])

  const quizInitializedRef = useRef<string | null>(null)

  // Initialize quiz on mount - only once per quizId
  useEffect(() => {
    if (!quizId) {
      navigate('/quiz-config')
      return
    }

    // If we've already initialized this quiz, don't do it again
    if (quizInitializedRef.current === quizId) {
      return
    }

    quizInitializedRef.current = quizId

    // Try to resume existing quiz
    loadQuiz(quizId)
      .then((loadedQuiz) => {
        if (loadedQuiz) {
          if (loadedQuiz.status === 'in-progress') {
            // Resume timer if quiz was in progress
            if (loadedQuiz.startTime) {
              const elapsed = Math.floor(
                (Date.now() - new Date(loadedQuiz.startTime).getTime()) / 1000
              )
              const remaining = loadedQuiz.configuration.timeDuration - elapsed
              if (remaining > 0) {
                startTimer(remaining)
              } else {
                // Timer expired, auto-submit
                handleTimerExpiration()
              }
            }
            
            // Show resume prompt if quiz was paused
            if (loadedQuiz.pauseReason === 'tab-change') {
              setShowResumePrompt(true)
            }
          }
          // Quiz exists and is loaded, no further action needed
        } else {
          // Quiz doesn't exist (404), check if we can create from URL params
          const difficulty = searchParams.get('difficulty') as QuizConfiguration['difficulty']
          const questions = parseInt(searchParams.get('questions') || '10', 10)
          const duration = parseInt(searchParams.get('duration') || '600', 10)

          if (difficulty && questions && duration) {
            // Create new quiz from URL params
            const config: QuizConfiguration = {
              difficulty,
              numberOfQuestions: questions,
              timeDuration: duration,
            }
            startQuizHandler(config, null)
          } else {
            // No valid params, redirect to quiz config
            console.warn('Quiz not found and no valid config params, redirecting to quiz-config')
            navigate('/quiz-config')
          }
        }
      })
      .catch((error) => {
        console.error('Failed to load quiz:', error)
        quizInitializedRef.current = null
        
        // On error, try to create from URL params if available
        const difficulty = searchParams.get('difficulty') as QuizConfiguration['difficulty']
        const questions = parseInt(searchParams.get('questions') || '10', 10)
        const duration = parseInt(searchParams.get('duration') || '600', 10)

        if (difficulty && questions && duration) {
          const config: QuizConfiguration = {
            difficulty,
            numberOfQuestions: questions,
            timeDuration: duration,
          }
          startQuizHandler(config, null)
        } else {
          // Redirect to quiz config on error
          navigate('/quiz-config')
        }
      })

    // Cleanup: reset ref when quizId changes
    return () => {
      if (quizInitializedRef.current === quizId) {
        quizInitializedRef.current = null
      }
    }
    // Only depend on quizId - this effect should only run once per quizId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  // Enter fullscreen on quiz start (per FR-001)
  useEffect(() => {
    if (quiz && quiz.status === 'in-progress' && !quizStartedRef.current && isSupported) {
      quizStartedRef.current = true
      enterFullscreen().catch((err) => {
        const errorMsg =
          err instanceof Error
            ? err.message.includes('not supported')
              ? 'Fullscreen mode is required to start the quiz. Please use a modern browser that supports fullscreen.'
              : 'Fullscreen permission was denied. Please allow fullscreen mode to start the quiz.'
            : 'Fullscreen permission was denied. Please allow fullscreen mode to start the quiz.'
        setFullscreenError(errorMsg)
        // Don't start quiz if fullscreen fails (per FR-001)
        navigate('/quiz-config')
      })
    }
  }, [quiz?.status, isSupported, enterFullscreen, navigate])

  // Start timer when quiz starts
  useEffect(() => {
    if (quiz && quiz.status === 'in-progress' && quiz.startTime && timeRemaining === 0) {
      startTimer(quiz.configuration.timeDuration)
    }
  }, [quiz?.status, quiz?.startTime])

  // Load selected answer for current question
  useEffect(() => {
    if (quiz && currentQuestion) {
      setSelectedAnswer(quiz.answers[currentQuestion.id] || null)
    }
  }, [quiz, currentQuestion])

  // Set up timer expiration callback
  useEffect(() => {
    if (quiz) {
      setTimerExpire(() => {
        handleTimerExpiration()
      })
    }
  }, [quiz])

  // Tab visibility detection (per FR-003, FR-004)
  useEffect(() => {
    if (!quiz || quiz.status !== 'in-progress') return

    // Check if Page Visibility API is supported (per FR-003 clarification)
    if (!isTabVisibilitySupported) {
      setTabVisibilityWarning(
        'Warning: Tab change detection is not available in your browser. Quiz integrity protection is reduced.'
      )
      return
    }

    // Clear warning if API is supported
    setTabVisibilityWarning(null)

    const unsubscribe = onVisibilityChange((visible) => {
      if (!visible && !quiz.pauseReason) {
        // Pause quiz on tab switch (per FR-003)
        pauseTimer() // Pause timer
        pauseQuiz('tab-change') // Pause quiz state
      } else if (visible && quiz.pauseReason === 'tab-change') {
        // Show resume prompt when user returns (per FR-006)
        setShowResumePrompt(true)
      }
    })

    return unsubscribe
  }, [quiz, onVisibilityChange, pauseQuiz, pauseTimer, isTabVisibilitySupported])

  // Handle fullscreen errors
  useEffect(() => {
    if (fullscreenErrorState) {
      setFullscreenError(fullscreenErrorState)
    }
  }, [fullscreenErrorState])

  // Handle fullscreen exit (per FR-020, FR-021)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs =
        !!(document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement)
      
      if (!isFs && quiz && quiz.status === 'in-progress' && !quiz.pauseReason) {
        // If fullscreen was exited via browser controls (F11, etc.), continue quiz normally (per FR-020)
        // If exited via Escape, we need confirmation (handled separately)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    }
  }, [quiz])

  // Handle Escape key for fullscreen exit with confirmation (per FR-021)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && quiz && quiz.status === 'in-progress') {
        const confirmed = window.confirm(
          'Are you sure you want to exit fullscreen mode? The quiz will continue normally.'
        )
        if (confirmed) {
          exitFullscreen()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, quiz, exitFullscreen])

  const handleResume = async () => {
    if (!quiz || !quiz.pauseReason) return

    const pausedAt = quiz.pausedAt

    const resumed = await resumeQuiz(quiz.id)

    if (resumed?.startTime && pausedAt) {
      const pauseDuration = Math.floor((Date.now() - pausedAt.getTime()) / 1000)
      const totalElapsed = Math.floor(
        (Date.now() - new Date(resumed.startTime).getTime()) / 1000
      ) - pauseDuration
      const remaining = resumed.configuration.timeDuration - totalElapsed
      if (remaining > 0) {
        startTimer(remaining)
      } else {
        handleTimerExpiration()
      }
    }

    setShowResumePrompt(false)
  }

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return
    // Just update local state - don't call backend yet
    setSelectedAnswer(answer)
  }

  const handleNext = async () => {
    if (!currentQuestion || !selectedAnswer || !quiz) return
    
    // Save answer to backend first
    try {
      await answerQuestion(currentQuestion.id, selectedAnswer)
    } catch (err) {
      console.error('Failed to save answer:', err)
      // Continue anyway to next question
    }
    
    // Clear selected answer
    setSelectedAnswer(null)
    
    // Move to next question
    await nextQuestion()
  }

  const handleFinish = async () => {
    if (!currentQuestion || !selectedAnswer) return
    
    // Save final answer to backend first
    try {
      await answerQuestion(currentQuestion.id, selectedAnswer)
    } catch (err) {
      console.error('Failed to save final answer:', err)
      // Continue anyway to finish quiz
    }
    
    // Then finish the quiz
    await finishQuiz()
  }

  if (loading || !quiz || !currentQuestion) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Loading quiz...</div>
      </div>
    )
  }

  return (
    <>
      {fullscreenError && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.error,
            color: 'white',
            padding: theme.spacing.md,
            textAlign: 'center',
            zIndex: 10000,
          }}
        >
          {fullscreenError}
        </div>
      )}
      {tabVisibilityWarning && (
        <div
          style={{
            position: 'fixed',
            top: fullscreenError ? '60px' : 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.warning || '#f59e0b',
            color: 'white',
            padding: theme.spacing.md,
            textAlign: 'center',
            zIndex: 9999,
          }}
        >
          {tabVisibilityWarning}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: 'calc(100vh - 80px)',
          padding: theme.spacing.xl,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xl,
          }}
        >
          {/* Header with timer and progress */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: theme.spacing.lg,
              borderRadius: theme.borderRadius.xl,
              boxShadow: theme.shadows.md,
            }}
          >
            <div>
              <QuestionCount
                current={currentQuestionIndex + 1}
                total={quiz.questions.length}
                format="full"
              />
              <div
                style={{
                  marginTop: theme.spacing.xs,
                  width: '300px',
                  height: '8px',
                  backgroundColor: theme.colors.neutral[200],
                  borderRadius: theme.borderRadius.full,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary[600],
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
            <Timer timeRemaining={timeRemaining} totalTime={quiz.configuration.timeDuration} />
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            onNext={handleNext}
            onFinish={handleFinish}
            isLastQuestion={isLastQuestion}
          />
        </div>
      </motion.div>
      <ResumePrompt
        isOpen={showResumePrompt}
        pauseReason={quiz?.pauseReason || 'tab-change'}
        pausedAt={quiz?.pausedAt || null}
        onResume={handleResume}
      />
    </>
  )
}
