import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuiz } from '../hooks/useQuiz'
import { quizService } from '../services/quizService'
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
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '../components/common/Button'

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
  const { timeRemaining, start: startTimer, pause: pauseTimer, resume: resumeTimer, stop: stopTimer, onExpire: setTimerExpire } = useTimer()
  const { isFullscreen, isSupported, enterFullscreen, exitFullscreen, error: fullscreenErrorState } = useFullscreen()
  const { isVisible, onVisibilityChange, isSupported: isTabVisibilitySupported } = useTabVisibility()
  const quizStartedRef = useRef(false)

  const handleTimerExpiration = useCallback(async () => {
    if (!quiz) return
    await expireQuizHandler()
  }, [quiz, expireQuizHandler])

  const quizInitializedRef = useRef<string | null>(null)
  const isStartingQuizRef = useRef(false)

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
    console.log('Loading quiz:', quizId)
    loadQuiz(quizId)
      .then((loadedQuiz) => {
        console.log('Quiz loaded:', loadedQuiz ? { id: loadedQuiz.id, status: loadedQuiz.status } : null)
        if (loadedQuiz) {
          if (loadedQuiz.status === 'pending') {
            // Quiz is pending, auto-start it
            // Prevent multiple start attempts (but allow if previous attempt failed)
            if (isStartingQuizRef.current) {
              console.log('Quiz start already in progress, will retry after delay...')
              // Wait a bit and check again
              setTimeout(() => {
                if (!isStartingQuizRef.current) {
                  // Previous attempt completed/failed, try again
                  loadQuiz(quizId).then((retryLoadedQuiz) => {
                    if (retryLoadedQuiz && retryLoadedQuiz.status === 'pending') {
                      // Try starting again
                      isStartingQuizRef.current = true
                      quizService.startQuiz(retryLoadedQuiz.id)
                        .then(() => loadQuiz(quizId))
                        .then((reloadedQuiz) => {
                          if (reloadedQuiz && reloadedQuiz.status === 'in-progress' && reloadedQuiz.startTime) {
                            const elapsed = Math.floor(
                              (Date.now() - new Date(reloadedQuiz.startTime).getTime()) / 1000
                            )
                            const remaining = Math.max(0, reloadedQuiz.configuration.timeDuration - elapsed)
                            if (remaining > 0) {
                              startTimer(remaining)
                            }
                          }
                          isStartingQuizRef.current = false
                        })
                        .catch((err) => {
                          console.error('Failed to start quiz on retry:', err)
                          isStartingQuizRef.current = false
                        })
                    } else if (retryLoadedQuiz && retryLoadedQuiz.status === 'in-progress') {
                      // Quiz already started, just start timer
                      if (retryLoadedQuiz.startTime) {
                        const elapsed = Math.floor(
                          (Date.now() - new Date(retryLoadedQuiz.startTime).getTime()) / 1000
                        )
                        const remaining = Math.max(0, retryLoadedQuiz.configuration.timeDuration - elapsed)
                        if (remaining > 0) {
                          startTimer(remaining)
                        }
                      }
                      isStartingQuizRef.current = false
                    }
                  })
                }
              }, 500)
              return
            }
            
            isStartingQuizRef.current = true
            
            // Reload quiz first to ensure we have the latest state before starting
            loadQuiz(loadedQuiz.id)
              .then((freshQuiz) => {
                if (!freshQuiz || freshQuiz.status !== 'pending') {
                  console.warn('Quiz status changed before start:', freshQuiz?.status)
                  isStartingQuizRef.current = false
                  // If quiz is already started, handle it as in-progress
                  if (freshQuiz && freshQuiz.status === 'in-progress') {
                    // Handle as in-progress quiz
                    if (freshQuiz.startTime) {
                      const elapsed = Math.floor(
                        (Date.now() - new Date(freshQuiz.startTime).getTime()) / 1000
                      )
                      const remaining = Math.max(0, freshQuiz.configuration.timeDuration - elapsed)
                      if (remaining > 0) {
                        startTimer(remaining)
                      } else {
                        handleTimerExpiration()
                      }
                    }
                  }
                  return
                }
                
                // Quiz is still pending, start it
                return quizService.startQuiz(freshQuiz.id)
              })
              .then((startedQuiz) => {
                if (!startedQuiz) return
                
                // Reload to ensure we have the latest state and update hook state
                return loadQuiz(loadedQuiz.id)
              })
              .then((reloadedQuiz) => {
                if (reloadedQuiz && reloadedQuiz.status === 'in-progress' && reloadedQuiz.startTime) {
                  // Calculate elapsed time since start
                  const elapsed = Math.floor(
                    (Date.now() - new Date(reloadedQuiz.startTime).getTime()) / 1000
                  )
                  const remaining = Math.max(0, reloadedQuiz.configuration.timeDuration - elapsed)
                  
                  if (remaining > 0) {
                    // Start timer with remaining time
                    startTimer(remaining)
                  } else {
                    // Timer expired, auto-submit
                    handleTimerExpiration()
                  }
                }
              })
              .catch((err) => {
                console.error('Failed to start quiz:', err)
                isStartingQuizRef.current = false
                // If quiz is already started, reload it
                if (err.message && err.message.includes('must be in one of the following states')) {
                  console.log('Quiz may already be started, reloading...')
                  loadQuiz(loadedQuiz.id)
                    .then((reloadedQuiz) => {
                      if (reloadedQuiz && reloadedQuiz.status === 'in-progress') {
                        if (reloadedQuiz.startTime) {
                          const elapsed = Math.floor(
                            (Date.now() - new Date(reloadedQuiz.startTime).getTime()) / 1000
                          )
                          const remaining = Math.max(0, reloadedQuiz.configuration.timeDuration - elapsed)
                          if (remaining > 0) {
                            startTimer(remaining)
                          }
                        }
                      }
                    })
                    .catch((reloadErr) => {
                      console.error('Failed to reload quiz after start error:', reloadErr)
                      quizInitializedRef.current = null
                    })
                } else {
                  // Reset initialization ref so user can retry
                  quizInitializedRef.current = null
                }
              })
              .finally(() => {
                // Reset the flag after a delay to allow for completion
                setTimeout(() => {
                  isStartingQuizRef.current = false
                }, 2000)
              })
          } else if (loadedQuiz.status === 'in-progress') {
            // Resume timer if quiz was in progress
            if (loadedQuiz.startTime) {
              // Calculate elapsed time, accounting for pause time
              const startTime = new Date(loadedQuiz.startTime).getTime()
              const now = Date.now()
              const elapsed = Math.floor((now - startTime) / 1000)
              
              // Account for pause duration if quiz was paused
              let pauseDuration = 0
              if (loadedQuiz.pausedAt) {
                const pausedAt = new Date(loadedQuiz.pausedAt).getTime()
                pauseDuration = Math.floor((now - pausedAt) / 1000)
              }
              
              const actualElapsed = elapsed - pauseDuration
              const remaining = Math.max(0, loadedQuiz.configuration.timeDuration - actualElapsed)
              
              if (remaining > 0) {
                // Only start timer if quiz is not paused
                if (!loadedQuiz.pauseReason) {
                  startTimer(remaining)
                }
              } else {
                // Timer expired, auto-submit
                handleTimerExpiration()
              }
            }
            
            // Show resume prompt if quiz was paused
            if (loadedQuiz.pauseReason === 'tab-change') {
              setShowResumePrompt(true)
            }
          } else if (loadedQuiz.status === 'completed' || loadedQuiz.status === 'expired') {
            // Quiz is already completed, navigate to assessment
            navigate(`/assessment/${loadedQuiz.id}`)
          }
        } else {
          // Quiz doesn't exist (404)
          console.error('Quiz not found:', quizId)
          // Wait a moment and retry - quiz might still be saving
          setTimeout(() => {
            loadQuiz(quizId)
              .then((retryQuiz) => {
                if (retryQuiz) {
                  // Quiz found on retry, handle it
                  if (retryQuiz.status === 'pending') {
                    // Reload fresh state before starting
                    loadQuiz(quizId)
                      .then((freshQuiz) => {
                        if (!freshQuiz || freshQuiz.status !== 'pending') {
                          if (freshQuiz && freshQuiz.status === 'in-progress') {
                            // Already started, just start timer
                            if (freshQuiz.startTime) {
                              const elapsed = Math.floor(
                                (Date.now() - new Date(freshQuiz.startTime).getTime()) / 1000
                              )
                              const remaining = Math.max(0, freshQuiz.configuration.timeDuration - elapsed)
                              if (remaining > 0) {
                                startTimer(remaining)
                              }
                            }
                          }
                          return
                        }
                        return quizService.startQuiz(freshQuiz.id)
                      })
                      .then(() => loadQuiz(quizId))
                      .then((reloadedQuiz) => {
                        if (reloadedQuiz && reloadedQuiz.status === 'in-progress' && reloadedQuiz.startTime) {
                          const elapsed = Math.floor(
                            (Date.now() - new Date(reloadedQuiz.startTime).getTime()) / 1000
                          )
                          const remaining = Math.max(0, reloadedQuiz.configuration.timeDuration - elapsed)
                          if (remaining > 0) {
                            startTimer(remaining)
                          }
                        }
                      })
                      .catch((err) => {
                        console.error('Failed to start quiz on retry:', err)
                        // If already started, just load and start timer
                        loadQuiz(quizId).then((reloadedQuiz) => {
                          if (reloadedQuiz && reloadedQuiz.status === 'in-progress' && reloadedQuiz.startTime) {
                            const elapsed = Math.floor(
                              (Date.now() - new Date(reloadedQuiz.startTime).getTime()) / 1000
                            )
                            const remaining = Math.max(0, reloadedQuiz.configuration.timeDuration - elapsed)
                            if (remaining > 0) {
                              startTimer(remaining)
                            }
                          }
                        })
                      })
                  } else if (retryQuiz.status === 'in-progress') {
                    // Already in progress, just start timer
                    if (retryQuiz.startTime) {
                      const elapsed = Math.floor(
                        (Date.now() - new Date(retryQuiz.startTime).getTime()) / 1000
                      )
                      const remaining = Math.max(0, retryQuiz.configuration.timeDuration - elapsed)
                      if (remaining > 0) {
                        startTimer(remaining)
                      }
                    }
                  }
                } else {
                  // Still not found after retry, check URL params or redirect
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
                    console.error('Quiz not found after retry:', quizId)
                    alert('Quiz not found. Please try generating again.')
                    navigate('/generate-quiz')
                  }
                }
              })
              .catch((retryErr) => {
                console.error('Failed to load quiz on retry:', retryErr)
                alert('Failed to load quiz. Please try generating again.')
                navigate('/generate-quiz')
              })
          }, 1000) // Wait 1 second before retry
        }
      })
      .catch((error) => {
        console.error('Failed to load quiz:', error)
        quizInitializedRef.current = null
        
        // Wait a moment and retry - might be a timing issue
        setTimeout(() => {
          loadQuiz(quizId)
            .then((retryQuiz) => {
              if (retryQuiz) {
                // Quiz found on retry, handle it normally
                if (retryQuiz.status === 'pending') {
                  quizService.startQuiz(retryQuiz.id)
                    .then(() => loadQuiz(quizId))
                    .then((reloadedQuiz) => {
                      if (reloadedQuiz && reloadedQuiz.status === 'in-progress' && reloadedQuiz.startTime) {
                        const elapsed = Math.floor(
                          (Date.now() - new Date(reloadedQuiz.startTime).getTime()) / 1000
                        )
                        const remaining = Math.max(0, reloadedQuiz.configuration.timeDuration - elapsed)
                        if (remaining > 0) {
                          startTimer(remaining)
                        }
                      }
                    })
                }
              } else {
                // Still not found, check URL params or redirect to generate page
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
                  console.error('Quiz not found after retry:', quizId)
                  alert('Quiz not found. Please try generating again.')
                  navigate('/generate-quiz')
                }
              }
            })
            .catch((retryErr) => {
              console.error('Failed to load quiz on retry:', retryErr)
              alert('Failed to load quiz. Please try generating again.')
              navigate('/generate-quiz')
            })
        }, 1000) // Wait 1 second before retry
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
      // Try to enter fullscreen automatically when quiz starts
      // This will work if there was a recent user gesture (like clicking "Start Quiz")
      enterFullscreen().catch((err) => {
        // If it fails due to permission/user gesture, show error but don't block quiz
        const errorMsg =
          err instanceof Error
            ? err.message.includes('not supported')
              ? 'Fullscreen mode is not supported. Quiz will continue in normal mode.'
              : err.message.includes('user gesture') || err.message.includes('permission')
              ? 'Fullscreen requires a user gesture. Click the fullscreen button to enter fullscreen mode.'
              : 'Fullscreen permission was denied. Click the fullscreen button to enter fullscreen mode.'
            : 'Fullscreen permission was denied. Click the fullscreen button to enter fullscreen mode.'
        setFullscreenError(errorMsg)
        // Don't block quiz - just show warning
        console.warn('Fullscreen failed, continuing quiz in normal mode:', err)
      })
    }
  }, [quiz?.status, isSupported, enterFullscreen])

  // Start timer when quiz starts (only if not already running)
  useEffect(() => {
    if (quiz && quiz.status === 'in-progress' && quiz.startTime) {
      // Calculate remaining time based on start time and duration
      const elapsed = Math.floor(
        (Date.now() - new Date(quiz.startTime).getTime()) / 1000
      )
      const remaining = Math.max(0, quiz.configuration.timeDuration - elapsed)
      
      // Only start timer if it's not already running and we have time remaining
      if (timeRemaining === 0 && remaining > 0) {
        startTimer(remaining)
      } else if (remaining <= 0 && timeRemaining > 0) {
        // Timer should have expired
        handleTimerExpiration()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.status, quiz?.startTime, quiz?.configuration?.timeDuration, timeRemaining])

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

  // Clear fullscreen error when fullscreen is successfully entered
  useEffect(() => {
    if (isFullscreen && fullscreenError) {
      setFullscreenError(null)
    }
  }, [isFullscreen, fullscreenError])

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
      // Calculate remaining time accounting for pause
      const startTime = new Date(resumed.startTime).getTime()
      const pausedAtTime = pausedAt.getTime()
      const now = Date.now()
      
      const totalElapsed = Math.floor((now - startTime) / 1000)
      const pauseDuration = Math.floor((now - pausedAtTime) / 1000)
      const actualElapsed = totalElapsed - pauseDuration
      const remaining = Math.max(0, resumed.configuration.timeDuration - actualElapsed)
      
      if (remaining > 0) {
        resumeTimer()
      } else {
        handleTimerExpiration()
      }
    }

    setShowResumePrompt(false)
  }

  const handleAnswerSelect = async (answer: string) => {
    if (!currentQuestion || !quiz) return
    
    // Update local state immediately for UI feedback
    setSelectedAnswer(answer)
    
    // Save answer to backend immediately
    try {
      await answerQuestion(currentQuestion.id, answer)
    } catch (err) {
      console.error('Failed to save answer:', err)
      // Show error but keep the selection in UI
    }
  }

  const handleNext = async () => {
    if (!currentQuestion || !selectedAnswer || !quiz) return
    
    // Answer should already be saved when selected, but ensure it's saved
    const currentAnswers = quiz.answers || {}
    if (currentAnswers[currentQuestion.id] !== selectedAnswer) {
      try {
        await answerQuestion(currentQuestion.id, selectedAnswer)
      } catch (err) {
        console.error('Failed to save answer:', err)
        // Continue anyway to next question
      }
    }
    
    // Clear selected answer
    setSelectedAnswer(null)
    
    // Move to next question
    await nextQuestion()
  }

  const handleEnterFullscreen = async () => {
    try {
      await enterFullscreen()
      // Error will be cleared by the useEffect that watches isFullscreen
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message.includes('not supported')
            ? 'Fullscreen mode is not supported in your browser.'
            : err.message.includes('user gesture') || err.message.includes('permission')
            ? 'Fullscreen permission was denied. Please allow fullscreen in your browser settings or try again.'
            : 'Failed to enter fullscreen mode. Please try again.'
          : 'Failed to enter fullscreen mode. Please try again.'
      setFullscreenError(errorMsg)
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setFullscreenError((prev) => (prev === errorMsg ? null : prev))
      }, 5000)
    }
  }

  const handleFinish = async () => {
    if (!quiz) {
      console.error('No quiz available to finish')
      return
    }
    
    // Prevent multiple clicks and ensure quiz is in progress
    if (quiz.status !== 'in-progress') {
      console.warn('Quiz is not in progress, cannot finish. Status:', quiz.status)
      if (quiz.status === 'completed' || quiz.status === 'expired') {
        navigate(`/assessment/${quiz.id}`)
      }
      return
    }
    
    try {
      // Stop the timer
      stopTimer()
      
      // Save final answer if there's one selected
      if (currentQuestion && selectedAnswer) {
        try {
          await answerQuestion(currentQuestion.id, selectedAnswer)
          // Wait a moment for the save to complete
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Failed to save final answer:', err)
          // Continue anyway to finish quiz
        }
      }
      
      // Ensure all answers are saved - save any unsaved answers
      const currentAnswers = quiz.answers || {}
      const unsavedQuestions = quiz.questions.filter((q) => !currentAnswers[q.id])
      
      if (unsavedQuestions.length > 0) {
        // Save any missing answers (empty string for unanswered)
        for (const question of unsavedQuestions) {
          try {
            await answerQuestion(question.id, '')
          } catch (err) {
            console.error(`Failed to save answer for question ${question.id}:`, err)
          }
        }
        // Wait for all saves to complete
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
      
      // Reload quiz to get latest state before finishing
      try {
        const latestQuiz = await loadQuiz(quiz.id)
        if (latestQuiz && latestQuiz.status === 'in-progress') {
          // Then finish the quiz
          await finishQuiz()
        } else if (latestQuiz) {
          // Quiz already finished, navigate to assessment
          navigate(`/assessment/${quiz.id}`)
        } else {
          throw new Error('Failed to load latest quiz state')
        }
      } catch (finishErr) {
        console.error('Failed to finish quiz:', finishErr)
        // Try one more time without reload
        try {
          await finishQuiz()
        } catch (retryErr) {
          console.error('Failed to finish quiz after retry:', retryErr)
          // Show error to user
          alert('Failed to finish quiz. Please try again.')
        }
      }
    } catch (err) {
      console.error('Error in handleFinish:', err)
      // Still try to finish even if there were errors
      try {
        await finishQuiz()
      } catch (finishErr) {
        console.error('Failed to finish quiz after retry:', finishErr)
        alert('Failed to finish quiz. Please try again.')
      }
    }
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
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: theme.spacing.lg,
              borderRadius: theme.borderRadius.xl,
              boxShadow: theme.shadows.md,
            }}
          >
            {quiz.name && (
              <div
                style={{
                  marginBottom: theme.spacing.md,
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontSize: theme.typography.fontSize.xl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: colors.text,
                    margin: 0,
                  }}
                >
                  {quiz.name}
                </h2>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
            >
              <div style={{ flex: 1 }}>
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
                    backgroundColor: colors.gray[200],
                    borderRadius: theme.borderRadius.full,
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
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <Timer timeRemaining={timeRemaining} totalTime={quiz.configuration.timeDuration} />
                {isSupported && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={isFullscreen ? exitFullscreen : handleEnterFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    style={{
                      minWidth: 'auto',
                      padding: theme.spacing.sm,
                    }}
                  >
                    {isFullscreen ? (
                      <Minimize2 size={18} />
                    ) : (
                      <Maximize2 size={18} />
                    )}
                  </Button>
                )}
              </div>
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
      <ResumePrompt
        isOpen={showResumePrompt}
        pauseReason={quiz?.pauseReason || 'tab-change'}
        pausedAt={quiz?.pausedAt || null}
        onResume={handleResume}
      />
    </>
  )
}
