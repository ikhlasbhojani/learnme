import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  QuizInstance,
  QuizConfiguration,
  AssessmentResult,
} from '../types'
import { quizService } from '../services/quizService'

export interface UseQuizReturn {
  quiz: QuizInstance | null
  currentQuestionIndex: number
  currentQuestion: QuizInstance['questions'][0] | null
  isLastQuestion: boolean
  startQuiz: (config: QuizConfiguration, contentInput: { id: string; type: string } | null) => Promise<void>
  answerQuestion: (questionId: string, answer: string) => Promise<void>
  nextQuestion: () => Promise<void>
  previousQuestion: () => Promise<void>
  finishQuiz: () => Promise<AssessmentResult>
  loadQuiz: (quizId: string) => Promise<QuizInstance | null>
  resumeQuiz: (quizId: string) => Promise<QuizInstance | null>
  pauseQuiz: (reason?: 'tab-change' | 'manual') => Promise<void>
  expireQuiz: () => Promise<void>
  loading: boolean
  error: string | null
}

export function useQuiz(): UseQuizReturn {
  const [quiz, setQuiz] = useState<QuizInstance | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Ensure index is within bounds when accessing questions
  const currentQuestion = quiz && currentQuestionIndex >= 0 && currentQuestionIndex < quiz.questions.length
    ? quiz.questions[currentQuestionIndex]
    : null
  const isLastQuestion = quiz ? currentQuestionIndex === quiz.questions.length - 1 : false

  const updateQuizState = useCallback((nextQuiz: QuizInstance | null, preserveIndex = false) => {
    if (!nextQuiz) {
      setQuiz(null)
      setCurrentQuestionIndex(0)
      return null
    }

    setQuiz(nextQuiz)

    // Only auto-calculate index if not preserving current position
    if (!preserveIndex) {
      const answers = nextQuiz.answers ?? {}
      const firstUnansweredIndex = nextQuiz.questions.findIndex((question) => !answers[question.id])
      const nextIndex = firstUnansweredIndex === -1 ? Math.max(nextQuiz.questions.length - 1, 0) : firstUnansweredIndex
      setCurrentQuestionIndex(nextIndex)
    }

    return nextQuiz
  }, [])

  const handleError = useCallback((err: unknown, fallbackMessage: string) => {
    const message = err instanceof Error ? err.message : fallbackMessage
    setError(message)
  }, [])

  const startQuizHandler = useCallback(
    async (
      config: QuizConfiguration,
      contentInput: { id: string; type: string } | null
    ) => {
      setLoading(true)
      setError(null)

      try {
        const createdQuiz = await quizService.createQuiz(config, contentInput?.id ?? null)
        const startedQuiz = await quizService.startQuiz(createdQuiz.id)
        updateQuizState(startedQuiz)
        navigate(`/quiz/${startedQuiz.id}`)
      } catch (err) {
        handleError(err, 'Failed to start quiz')
      }
      setLoading(false)
    },
    [navigate, updateQuizState, handleError]
  )

  const answerQuestionHandler = useCallback(
    async (questionId: string, answer: string) => {
      if (!quiz) return

      try {
        const updatedQuiz = await quizService.answerQuestion(quiz.id, {
          questionId,
          answer,
        })
        // Preserve current index when answering - don't auto-jump to next unanswered
        updateQuizState(updatedQuiz, true)
      } catch (err) {
        handleError(err, 'Failed to submit answer')
      }
    },
    [quiz, updateQuizState, handleError]
  )

  const nextQuestion = useCallback(async () => {
    if (!quiz) return

    setCurrentQuestionIndex((prev) => {
      // Make sure we don't exceed the questions array
      const nextIndex = prev + 1
      if (nextIndex >= quiz.questions.length) {
        return prev // Already at last question
      }
      return nextIndex
    })
  }, [quiz])

  const previousQuestion = useCallback(async () => {
    if (!quiz || currentQuestionIndex === 0) return

    setCurrentQuestionIndex((prev) => prev - 1)
  }, [quiz, currentQuestionIndex])

  const finishQuizHandler = useCallback(async (): Promise<AssessmentResult> => {
    if (!quiz) {
      throw new Error('No active quiz')
    }

    setLoading(true)
    setError(null)

    try {
      const completedQuiz = await quizService.finishQuiz(quiz.id)
      updateQuizState(completedQuiz)
      const assessment = await quizService.fetchAssessment(quiz.id)
      navigate(`/assessment/${quiz.id}`)
      return assessment
    } catch (err) {
      handleError(err, 'Failed to finish quiz')
      throw err
    } finally {
      setLoading(false)
    }
  }, [quiz, navigate, updateQuizState, handleError])

  const pauseQuizHandler = useCallback(
    async (reason: 'tab-change' | 'manual' = 'tab-change') => {
      if (!quiz || quiz.status !== 'in-progress') return

      try {
        const pausedQuiz = await quizService.pauseQuiz(quiz.id, reason)
        updateQuizState(pausedQuiz)
      } catch (err) {
        handleError(err, 'Failed to pause quiz')
      }
    },
    [quiz, updateQuizState, handleError]
  )

  const resumeQuizHandler = useCallback(
    async (quizId: string): Promise<QuizInstance | null> => {
      setLoading(true)
      setError(null)

      try {
        const resumedQuiz = await quizService.resumeQuiz(quizId)
        updateQuizState(resumedQuiz)
        return resumedQuiz
      } catch (err) {
        handleError(err, 'Failed to resume quiz')
        return null
      } finally {
        setLoading(false)
      }
    },
    [updateQuizState, handleError]
  )

  const loadQuizHandler = useCallback(
    async (quizId: string): Promise<QuizInstance | null> => {
      setLoading(true)
      setError(null)

      try {
        const existingQuiz = await quizService.fetchQuiz(quizId)
        updateQuizState(existingQuiz)
        return existingQuiz
      } catch (err) {
        handleError(err, 'Failed to load quiz')
        setQuiz(null)
        setCurrentQuestionIndex(0)
        return null
      } finally {
        setLoading(false)
      }
    },
    [updateQuizState, handleError]
  )

  const expireQuizHandler = useCallback(async () => {
    if (!quiz) {
      throw new Error('No active quiz')
    }

    setLoading(true)
    setError(null)

    try {
      const expiredQuiz = await quizService.expireQuiz(quiz.id)
      updateQuizState(expiredQuiz)
      navigate(`/assessment/${quiz.id}?expired=true`)
    } catch (err) {
      handleError(err, 'Failed to expire quiz')
      throw err
    } finally {
      setLoading(false)
    }
  }, [quiz, navigate, updateQuizState, handleError])

  return {
    quiz,
    currentQuestionIndex,
    currentQuestion,
    isLastQuestion,
    startQuiz: startQuizHandler,
    answerQuestion: answerQuestionHandler,
    nextQuestion,
    previousQuestion,
    finishQuiz: finishQuizHandler,
    loadQuiz: loadQuizHandler,
    resumeQuiz: resumeQuizHandler,
    pauseQuiz: pauseQuizHandler,
    expireQuiz: expireQuizHandler,
    loading,
    error,
  }
}
