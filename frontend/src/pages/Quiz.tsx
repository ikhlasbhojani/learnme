import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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

  const { timeRemaining, start: startTimer, stop: stopTimer, onExpire: setTimerExpire } = useTimer()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Load quiz on mount
  useEffect(() => {
    if (!quizId) {
      navigate('/generate-quiz')
      return
    }

    let isMounted = true

    const initializeQuiz = async () => {
      try {
        setIsInitializing(true)
        const loadedQuiz = await loadQuiz(quizId)

        if (!isMounted) return

        if (!loadedQuiz) {
          alert('Quiz not found. Please try generating again.')
          navigate('/generate-quiz')
          return
        }

        // Handle different quiz states
        if (loadedQuiz.status === 'pending') {
          // Auto-start pending quiz
          await startQuiz(loadedQuiz.id)
          const startedQuiz = await loadQuiz(quizId)
          if (!isMounted) return

          if (startedQuiz && startedQuiz.startTime) {
            const elapsed = Math.floor((Date.now() - startedQuiz.startTime.getTime()) / 1000)
            const remaining = Math.max(0, startedQuiz.configuration.timeDuration - elapsed)
            if (remaining > 0) {
              startTimer(remaining)
            }
          }
        } else if (loadedQuiz.status === 'in-progress') {
          // Resume in-progress quiz
          if (loadedQuiz.startTime) {
            const elapsed = Math.floor((Date.now() - loadedQuiz.startTime.getTime()) / 1000)
            const remaining = Math.max(0, loadedQuiz.configuration.timeDuration - elapsed)
            if (remaining > 0) {
              startTimer(remaining)
            }
          }
        } else if (loadedQuiz.status === 'completed' || loadedQuiz.status === 'expired') {
          // Navigate to assessment if already completed
          navigate(`/assessment/${loadedQuiz.id}`)
          return
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to load quiz:', error)
        alert('Failed to load quiz. Please try again.')
        navigate('/generate-quiz')
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeQuiz()

    return () => {
      isMounted = false
    }
  }, [quizId, navigate, loadQuiz, startQuiz, startTimer])

  // Timer expiration handler
  useEffect(() => {
    const handleTimerExpiration = async () => {
      if (!quiz) return
      try {
        await quizService.finishQuiz(quiz.id)
        navigate(`/assessment/${quiz.id}?expired=true`)
      } catch (error) {
        console.error('Failed to finish quiz on timer expiration:', error)
      }
    }

    setTimerExpire(handleTimerExpiration)
  }, [quiz, navigate, setTimerExpire])

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
  if (isInitializing || loading || !quiz || !currentQuestion) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>Loading quiz...</div>
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

            <Timer timeRemaining={timeRemaining} totalTime={quiz.configuration.timeDuration} />
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

