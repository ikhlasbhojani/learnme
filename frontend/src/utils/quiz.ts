import {
  QuizInstance,
  QuizConfiguration,
  Question,
  AssessmentResult,
} from '../types'
import { generateQuestions } from './mockQuestions'

/**
 * Create a new quiz instance
 */
export function createQuiz(
  userId: string,
  config: QuizConfiguration,
  contentInputId: string | null = null
): QuizInstance {
  const questions = generateQuestions(config)

  return {
    id: crypto.randomUUID(),
    userId,
    contentInputId,
    configuration: config,
    questions,
    answers: {},
    startTime: null,
    endTime: null,
    status: 'pending',
    score: null,
    correctCount: null,
    incorrectCount: null,
    pauseReason: null,
    pausedAt: null,
    pauseCount: 0,
  }
}

/**
 * Calculate quiz score and results
 */
export function calculateScore(quiz: QuizInstance): {
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  score: number
} {
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  quiz.questions.forEach((question) => {
    const answer = quiz.answers[question.id]
    if (!answer) {
      unansweredCount++
    } else if (answer === question.correctAnswer) {
      correctCount++
    } else {
      incorrectCount++
    }
  })

  const totalQuestions = quiz.questions.length
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
  }
}

/**
 * Generate assessment result
 */
export function generateAssessment(quiz: QuizInstance): AssessmentResult {
  const { correctCount, incorrectCount, unansweredCount, score } = calculateScore(quiz)

  // Identify weak areas (difficulty levels with <50% correct)
  const difficultyStats: Record<string, { correct: number; total: number }> = {}
  quiz.questions.forEach((question) => {
    const diff = question.difficulty
    if (!difficultyStats[diff]) {
      difficultyStats[diff] = { correct: 0, total: 0 }
    }
    difficultyStats[diff].total++
    if (quiz.answers[question.id] === question.correctAnswer) {
      difficultyStats[diff].correct++
    }
  })

  const weakAreas: string[] = []
  Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
    const percentage = (stats.correct / stats.total) * 100
    if (percentage < 50) {
      weakAreas.push(difficulty)
    }
  })

  // Generate performance review
  let performanceReview = ''
  if (score >= 90) {
    performanceReview = 'Excellent performance! You have a strong understanding of the material.'
  } else if (score >= 70) {
    performanceReview = 'Good performance! You have a solid grasp of most concepts.'
  } else if (score >= 50) {
    performanceReview = 'Fair performance. There is room for improvement in several areas.'
  } else {
    performanceReview = 'Needs improvement. Consider reviewing the material more thoroughly.'
  }

  // Generate suggestions
  const suggestions: string[] = []
  if (weakAreas.length > 0) {
    suggestions.push(
      `Focus on ${weakAreas.join(' and ')} difficulty questions to improve your understanding.`
    )
  }
  if (unansweredCount > 0) {
    suggestions.push(
      `Try to answer all questions. You left ${unansweredCount} question${unansweredCount > 1 ? 's' : ''} unanswered.`
    )
  }
  if (score < 70) {
    suggestions.push('Review the material again and take another quiz to reinforce learning.')
  }
  if (suggestions.length === 0) {
    suggestions.push('Keep up the great work! Continue practicing to maintain your skills.')
  }

  return {
    quizInstanceId: quiz.id,
    totalScore: score,
    correctCount,
    incorrectCount,
    unansweredCount,
    performanceReview,
    weakAreas,
    suggestions,
    generatedAt: new Date(),
  }
}

/**
 * Answer a question
 */
export function answerQuestion(
  quiz: QuizInstance,
  questionId: string,
  answer: string
): QuizInstance {
  return {
    ...quiz,
    answers: {
      ...quiz.answers,
      [questionId]: answer,
    },
  }
}

/**
 * Start quiz
 */
export function startQuiz(quiz: QuizInstance): QuizInstance {
  return {
    ...quiz,
    status: 'in-progress',
    startTime: new Date(),
  }
}

/**
 * Finish quiz
 */
export function finishQuiz(quiz: QuizInstance): QuizInstance {
  const { correctCount, incorrectCount, score } = calculateScore(quiz)
  return {
    ...quiz,
    status: 'completed',
    endTime: new Date(),
    correctCount,
    incorrectCount,
    score,
  }
}

/**
 * Expire quiz (timer ran out)
 */
export function expireQuiz(quiz: QuizInstance): QuizInstance {
  const { correctCount, incorrectCount, score } = calculateScore(quiz)
  return {
    ...quiz,
    status: 'expired',
    endTime: new Date(),
    correctCount,
    incorrectCount,
    score,
  }
}

/**
 * Pause quiz
 */
export function pauseQuiz(
  quiz: QuizInstance,
  reason: 'tab-change' | 'manual' = 'tab-change'
): QuizInstance {
  if (quiz.status !== 'in-progress') {
    throw new Error('Quiz not in progress')
  }

  if (quiz.pauseReason !== null) {
    // Already paused, ignore (per FR-004)
    return quiz
  }

  return {
    ...quiz,
    pauseReason: reason,
    pausedAt: new Date(),
    pauseCount: (quiz.pauseCount || 0) + 1,
  }
}

/**
 * Resume quiz
 */
export function resumeQuiz(quiz: QuizInstance): QuizInstance {
  if (quiz.pauseReason === null) {
    throw new Error('Quiz is not paused')
  }

  return {
    ...quiz,
    pauseReason: null,
    pausedAt: null,
  }
}
