import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService } from '../services/quizService'
import { QuizInstance, Question } from '../types'

interface UseQuizReturn {
  quiz: QuizInstance | null
  currentQuestionIndex: number
  currentQuestion: Question | null
  isLastQuestion: boolean
  loading: boolean
  error: string | null
  loadQuiz: (quizId: string) => Promise<QuizInstance | null>
  startQuiz: (quizId: string) => Promise<void>
  answerQuestion: (questionId: string, answer: string) => Promise<void>
  nextQuestion: () => void
  previousQuestion: () => void
  finishQuiz: () => Promise<void>
}

export function useQuiz(): UseQuizReturn {
  const [quiz, setQuiz] = useState<QuizInstance | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Calculate current question and last question status
  const currentQuestion =
    quiz && quiz.questions && Array.isArray(quiz.questions) && currentQuestionIndex >= 0 && currentQuestionIndex < quiz.questions.length
      ? quiz.questions[currentQuestionIndex]
      : null

  const isLastQuestion =
    quiz && quiz.questions && Array.isArray(quiz.questions)
      ? currentQuestionIndex === quiz.questions.length - 1
      : false

  const loadQuiz = useCallback(async (quizId: string): Promise<QuizInstance | null> => {
    setLoading(true)
    setError(null)

    try {
      const loadedQuiz = await quizService.fetchQuiz(quizId)
      setQuiz(loadedQuiz)

      // Set current question index to first unanswered question
      if (loadedQuiz.questions && Array.isArray(loadedQuiz.questions)) {
        const answers = loadedQuiz.answers ?? {}
        const firstUnansweredIndex = loadedQuiz.questions.findIndex((q) => !answers[q.id])
        const nextIndex = firstUnansweredIndex === -1 ? Math.max(loadedQuiz.questions.length - 1, 0) : firstUnansweredIndex
        setCurrentQuestionIndex(nextIndex)
      }

      return loadedQuiz
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load quiz'
      setError(errorMessage)
      setQuiz(null)
      setCurrentQuestionIndex(0)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const startQuiz = useCallback(async (quizId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const startedQuiz = await quizService.startQuiz(quizId)
      setQuiz(startedQuiz)

      // Set current question index to first unanswered question
      if (startedQuiz.questions && Array.isArray(startedQuiz.questions)) {
        const answers = startedQuiz.answers ?? {}
        const firstUnansweredIndex = startedQuiz.questions.findIndex((q) => !answers[q.id])
        const nextIndex = firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex
        setCurrentQuestionIndex(nextIndex)
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to start quiz'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const answerQuestion = useCallback(
    async (questionId: string, answer: string): Promise<void> => {
      if (!quiz) {
        throw new Error('No active quiz')
      }

      setError(null)

      try {
        const updatedQuiz = await quizService.answerQuestion(quiz.id, questionId, answer)
        setQuiz(updatedQuiz)
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to save answer'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [quiz]
  )

  const nextQuestion = useCallback(() => {
    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) return

    setCurrentQuestionIndex((prev) => {
      const nextIndex = prev + 1
      if (nextIndex >= quiz.questions.length) {
        return prev // Already at last question
      }
      return nextIndex
    })
  }, [quiz])

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => {
      if (prev <= 0) {
        return 0
      }
      return prev - 1
    })
  }, [])

  const finishQuiz = useCallback(async (): Promise<void> => {
    if (!quiz) {
      throw new Error('No active quiz')
    }

    setLoading(true)
    setError(null)

    try {
      await quizService.finishQuiz(quiz.id)
      navigate(`/assessment/${quiz.id}`)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to finish quiz'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [quiz, navigate])

  return {
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
  }
}

