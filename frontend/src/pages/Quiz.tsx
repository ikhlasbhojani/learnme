import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, BookOpen } from 'lucide-react'
import { useQuiz } from '../hooks/useQuiz'
import { useTimer } from '../hooks/useTimer'
import { QuestionCard } from '../components/quiz/QuestionCard'
import { Timer } from '../components/quiz/Timer'
import { QuestionCount } from '../components/quiz/QuestionCount'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../styles/theme'
import { quizService } from '../services/quizService'

export default function Quiz() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const {
    quiz,
    currentQuestionIndex,
    currentQuestion,
    isLastQuestion,
    loading,
    error,
    loadQuiz,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    finishQuiz,
  } = useQuiz()

  const { timeRemaining, isInitialized: timerInitialized, start: startTimer, stop: stopTimer, onExpire: setTimerExpire } = useTimer()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const initializationCompletedRef = useRef(false)
  const initializedQuizIdRef = useRef<string | null>(null)
  const isInitializingRef = useRef(false)
  const initializationStartedRef = useRef<Set<string>>(new Set())

  // Timeout fallback - if initialization takes too long, show error
  useEffect(() => {
    if (!isInitializing) return

    const timeout = setTimeout(() => {
      if (isInitializing && !quiz) {
        console.error('Quiz initialization timeout - quiz not loaded after 15 seconds')
        setIsInitializing(false)
        alert('Quiz is taking too long to load. Please try refreshing the page or generating a new quiz.')
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeout)
  }, [isInitializing, quiz])

  // Load quiz on mount (only run once per quizId)
  useEffect(() => {
    if (!quizId) {
      navigate('/generate-quiz')
      return
    }

    // STRICT GUARD: If we've already started initialization for this quizId, don't run again
    if (initializationStartedRef.current.has(quizId)) {
      return
    }

    // Mark that we're starting initialization for this quizId
    initializationStartedRef.current.add(quizId)
    initializationCompletedRef.current = false
    isInitializingRef.current = true
    initializedQuizIdRef.current = quizId
    setIsInitializing(true)

    let isMounted = true

    const initializeQuiz = async () => {
      try {
        
        // Retry loading quiz up to 3 times with delay (in case quiz is still being created)
        let loadedQuiz: QuizInstance | null = null
        let retries = 0
        const maxRetries = 3
        
        while (retries < maxRetries && !loadedQuiz) {
          try {
            loadedQuiz = await loadQuiz(quizId)
            if (loadedQuiz) break
          } catch (error) {
            console.log(`Attempt ${retries + 1} to load quiz failed:`, error)
            if (retries < maxRetries - 1) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
            }
          }
          retries++
        }

        if (!isMounted) return

        if (!loadedQuiz) {
          console.error('Failed to load quiz after retries')
          alert('Quiz not found. Please try generating again.')
          navigate('/generate-quiz')
          return
        }

        // Handle different quiz states
        if (loadedQuiz.status === 'pending') {
          // Auto-start pending quiz
          await startQuiz(loadedQuiz.id)
          if (!isMounted) return

          // Reload quiz to get updated state with startTime and ensure state sync
          const startedQuiz = await loadQuiz(quizId)
          if (!isMounted) return

          if (!startedQuiz) {
            console.error('Failed to reload quiz after starting')
            alert('Failed to start quiz. Please try again.')
            navigate('/generate-quiz')
            return
          }

          // Verify quiz has questions
          if (!startedQuiz.questions || !Array.isArray(startedQuiz.questions) || startedQuiz.questions.length === 0) {
            console.error('Quiz has no questions after starting')
            alert('Quiz has no questions. Please try generating again.')
            navigate('/generate-quiz')
            return
          }

          // Start timer if time duration is configured
          if (startedQuiz.configuration?.timeDuration) {
            if (startedQuiz.startTime) {
              const startTime = startedQuiz.startTime instanceof Date 
                ? startedQuiz.startTime 
                : new Date(startedQuiz.startTime)
              const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            const remaining = Math.max(0, startedQuiz.configuration.timeDuration - elapsed)
            if (remaining > 0) {
                console.log(`Starting timer with ${remaining} seconds remaining (${startedQuiz.configuration.timeDuration} total)`)
              startTimer(remaining)
              } else {
                // Timer already expired, auto-submit
                await finishQuiz()
                navigate(`/assessment/${startedQuiz.id}?expired=true`)
                return
              }
            } else {
              // Start timer with full duration if startTime is not set yet
              console.log(`Starting timer with full duration: ${startedQuiz.configuration.timeDuration} seconds`)
              startTimer(startedQuiz.configuration.timeDuration)
            }
          }
        } else if (loadedQuiz.status === 'in-progress') {
          // Verify quiz has questions
          if (!loadedQuiz.questions || !Array.isArray(loadedQuiz.questions) || loadedQuiz.questions.length === 0) {
            console.error('In-progress quiz has no questions')
            alert('Quiz has no questions. Please try generating again.')
            navigate('/generate-quiz')
            return
          }

          // Resume in-progress quiz and start timer
          if (loadedQuiz.configuration?.timeDuration) {
          if (loadedQuiz.startTime) {
              const startTime = loadedQuiz.startTime instanceof Date 
                ? loadedQuiz.startTime 
                : new Date(loadedQuiz.startTime)
              const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            const remaining = Math.max(0, loadedQuiz.configuration.timeDuration - elapsed)
            if (remaining > 0) {
                console.log(`Resuming timer with ${remaining} seconds remaining (${loadedQuiz.configuration.timeDuration} total)`)
              startTimer(remaining)
              } else {
                // Timer already expired, auto-submit
                await finishQuiz()
                navigate(`/assessment/${loadedQuiz.id}?expired=true`)
                return
              }
            } else {
              // Start timer with full duration if startTime is not set
              console.log(`Starting timer with full duration: ${loadedQuiz.configuration.timeDuration} seconds`)
              startTimer(loadedQuiz.configuration.timeDuration)
            }
          }
        } else if (loadedQuiz.status === 'completed' || loadedQuiz.status === 'expired') {
          // Navigate to assessment if already completed
          navigate(`/assessment/${loadedQuiz.id}`)
          return
        } else {
          // For unknown status, try to proceed if quiz has questions
          if (loadedQuiz.questions && Array.isArray(loadedQuiz.questions) && loadedQuiz.questions.length > 0) {
            // Continue with quiz
          } else {
            alert('Quiz is in an invalid state. Please try generating again.')
            navigate('/generate-quiz')
            return
          }
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to load quiz:', error)
        alert('Failed to load quiz. Please try again.')
        navigate('/generate-quiz')
      } finally {
        if (isMounted) {
          isInitializingRef.current = false
          setIsInitializing(false)
        }
      }
    }

    const initPromise = initializeQuiz()

    return () => {
      isMounted = false
      // Don't remove from Set on cleanup - we want to prevent re-initialization
      // Only reset the in-progress flag
      if (initializedQuizIdRef.current === quizId) {
        isInitializingRef.current = false
      }
    }
    // Only depend on quizId - functions are stable from hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  // Ensure initialization completes when quiz is loaded (only once)
  useEffect(() => {
    if (
      quiz && 
      quiz.questions && 
      Array.isArray(quiz.questions) && 
      quiz.questions.length > 0 && 
      isInitializing &&
      !initializationCompletedRef.current &&
      initializedQuizIdRef.current === quizId
    ) {
      // Mark as completed to prevent re-running
      initializationCompletedRef.current = true
      // Quiz is loaded with questions, complete initialization
      setIsInitializing(false)
    }
    // Only depend on quiz and quizId - don't include isInitializing to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, quizId])

  // Timer expiration handler - auto-submit quiz when timer reaches 0
  useEffect(() => {
    const handleTimerExpiration = async () => {
      if (!quiz) return
      
      try {
        // Save current answer if any
        if (currentQuestion && selectedAnswer) {
          try {
            await answerQuestion(currentQuestion.id, selectedAnswer)
          } catch (err) {
            console.error('Failed to save final answer:', err)
          }
        }
        
        // Stop the timer
        stopTimer()
        
        // Finish the quiz using the hook method
        await finishQuiz()
        
        // Navigate to assessment page with expired flag
        navigate(`/assessment/${quiz.id}?expired=true`)
      } catch (error) {
        console.error('Failed to finish quiz on timer expiration:', error)
        // Still navigate even if there's an error
        navigate(`/assessment/${quiz.id}?expired=true`)
      }
    }

    setTimerExpire(handleTimerExpiration)
  }, [quiz, currentQuestion, selectedAnswer, navigate, setTimerExpire, answerQuestion, finishQuiz, stopTimer])

  // Load selected answer when question changes
  useEffect(() => {
    if (quiz && currentQuestion) {
      const savedAnswer = quiz.answers?.[currentQuestion.id]
      setSelectedAnswer(savedAnswer && savedAnswer.trim() !== '' ? savedAnswer : null)
    }
  }, [quiz, currentQuestion?.id])

  // Handle answer selection
  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (!currentQuestion || !quiz) return

      setSelectedAnswer(answer)

      // Save answer asynchronously (non-blocking)
      answerQuestion(currentQuestion.id, answer).catch((err) => {
        console.error('Failed to save answer:', err)
      })
    },
    [currentQuestion, quiz, answerQuestion]
  )

  // Handle next button
  const handleNext = useCallback(async () => {
    if (!currentQuestion || !selectedAnswer || !quiz) return

    try {
      // Ensure answer is saved before moving
      await answerQuestion(currentQuestion.id, selectedAnswer)
    } catch (err) {
      console.error('Failed to save answer:', err)
    }

    setSelectedAnswer(null)
    nextQuestion()
  }, [currentQuestion, selectedAnswer, quiz, answerQuestion, nextQuestion])

  // Handle finish button
  const handleFinish = useCallback(async () => {
    if (!currentQuestion || !selectedAnswer || !quiz) return

    try {
      // Save final answer
      await answerQuestion(currentQuestion.id, selectedAnswer)
      // Finish quiz
      stopTimer()
      await finishQuiz()
    } catch (err) {
      console.error('Failed to finish quiz:', err)
      alert('Failed to finish quiz. Please try again.')
    }
  }, [currentQuestion, selectedAnswer, quiz, answerQuestion, finishQuiz, stopTimer])

  // Loading state
  if (isInitializing || loading || !quiz) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#0d1117' : '#ffffff',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Animated Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              width: '64px',
              height: '64px',
            }}
          >
            <Loader2
              size={64}
              style={{
                color: isDark ? '#58a6ff' : '#0969da',
              }}
            />
          </motion.div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: colors.text,
              }}
            >
              Loading Quiz...
            </div>
            <div
              style={{
                fontSize: '14px',
                color: isDark ? '#8b949e' : '#656d76',
              }}
            >
              Preparing your questions...
            </div>
          </motion.div>

          {/* Progress Dots */}
          <motion.div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#58a6ff' : '#0969da',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Check if quiz has questions
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>Quiz has no questions.</div>
        <button
          onClick={() => navigate('/generate-quiz')}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Generate New Quiz
        </button>
      </div>
    )
  }

  // Check if current question exists
  if (!currentQuestion) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>Unable to load question.</div>
        <button
          onClick={() => navigate('/generate-quiz')}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>{error}</div>
        <button
          onClick={() => navigate('/generate-quiz')}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {quiz.name && (
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0 }}>{quiz.name}</h2>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <QuestionCount current={currentQuestionIndex + 1} total={quiz.questions?.length || 0} format="full" />
              {quiz.questions && quiz.questions.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    width: '300px',
                    height: '8px',
                    backgroundColor: colors.gray[200],
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                      height: '100%',
                      backgroundColor: colors.primary,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              )}
            </div>

            <Timer timeRemaining={timeRemaining} totalTime={quiz.configuration.timeDuration} isInitialized={timerInitialized} />
          </div>
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
  )
}

