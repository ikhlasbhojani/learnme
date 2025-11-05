import Quiz, {
  type IQuizDocument,
  type QuizPauseReason,
  type QuizStatus,
} from './quiz.model'
import {
  type AnswerQuestionInput,
  type CreateQuizInput,
  type PauseQuizInput,
} from './quiz.validation'
import { pickQuestions } from './questionPool'
import { AppError } from '../../utils/appError'

export interface AssessmentResult {
  quizInstanceId: string
  totalScore: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  performanceReview: string
  weakAreas: string[]
  suggestions: string[]
  generatedAt: Date
}

function ensureQuizOwnership(quiz: IQuizDocument | null, userId: string): IQuizDocument {
  if (!quiz) {
    throw new AppError('Quiz not found', 404)
  }

  if (quiz.userId !== userId) {
    throw new AppError('You are not allowed to access this quiz', 403)
  }

  return quiz
}

function ensureAnswersObject(quiz: IQuizDocument): Record<string, string> {
  if (!quiz.answers || typeof quiz.answers !== 'object') {
    return {}
  }
  return quiz.answers
}

function calculateScore(quiz: IQuizDocument) {
  const answers = ensureAnswersObject(quiz)
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  quiz.questions.forEach((question) => {
    const answer = answers[question.id]
    if (!answer) {
      unansweredCount += 1
    } else if (answer === question.correctAnswer) {
      correctCount += 1
    } else {
      incorrectCount += 1
    }
  })

  const totalQuestions = quiz.questions.length || 1
  const score = Math.round(((correctCount / totalQuestions) * 100 + Number.EPSILON) * 100) / 100

  return { correctCount, incorrectCount, unansweredCount, score }
}

function buildAssessment(quiz: IQuizDocument): AssessmentResult {
  const { correctCount, incorrectCount, unansweredCount, score } = calculateScore(quiz)

  const difficultyStats: Record<string, { correct: number; total: number }> = {}
  const answers = ensureAnswersObject(quiz)

  quiz.questions.forEach((question) => {
    const diff = question.difficulty
    if (!difficultyStats[diff]) {
      difficultyStats[diff] = { correct: 0, total: 0 }
    }
    difficultyStats[diff].total += 1
    if (answers[question.id] === question.correctAnswer) {
      difficultyStats[diff].correct += 1
    }
  })

  const weakAreas: string[] = []
  Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
    const percentage = (stats.correct / stats.total) * 100
    if (percentage < 50) {
      weakAreas.push(difficulty)
    }
  })

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

  const suggestions: string[] = []
  if (weakAreas.length > 0) {
    suggestions.push(`Focus on ${weakAreas.join(' and ')} difficulty questions to improve your understanding.`)
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

function ensureStatus(quiz: IQuizDocument, allowed: QuizStatus[]) {
  if (!allowed.includes(quiz.status)) {
    throw new AppError(`Quiz must be in one of the following states: ${allowed.join(', ')}`, 400)
  }
}

function generateDefaultQuizName(
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master',
  numberOfQuestions: number
): string {
  const difficultyNames: Record<string, string> = {
    Easy: 'Easy',
    Normal: 'Normal',
    Hard: 'Hard',
    Master: 'Master',
  }
  
  const difficultyName = difficultyNames[difficulty] || 'Normal'
  return `${difficultyName} Difficulty Quiz - ${numberOfQuestions} Questions`
}

export async function createQuiz(
  userId: string,
  input: CreateQuizInput
): Promise<ReturnType<IQuizDocument['toJSON']>> {
  const questions = pickQuestions(input.configuration.difficulty, input.configuration.numberOfQuestions)

  // Generate a default name based on difficulty and number of questions
  const defaultName = generateDefaultQuizName(
    input.configuration.difficulty,
    input.configuration.numberOfQuestions
  )

  const quiz = await Quiz.create({
    userId,
    contentInputId: input.contentInputId || null,
    name: defaultName,
    configuration: input.configuration,
    questions,
    answers: {},
    status: 'pending',
  })

  return quiz.toJSON()
}

export async function startQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['pending'])

  const updated = await Quiz.update(quizId, {
    status: 'in-progress',
    startTime: new Date(),
    pauseReason: null,
    pausedAt: null,
  })

  return updated.toJSON()
}

export async function answerQuizQuestion(
  userId: string,
  quizId: string,
  input: AnswerQuestionInput
) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  const questionExists = quiz.questions.some((question) => question.id === input.questionId)
  if (!questionExists) {
    throw new AppError('Question not found in this quiz', 404)
  }

  const answers = ensureAnswersObject(quiz)
  answers[input.questionId] = input.answer

  const updated = await Quiz.update(quizId, {
    answers,
  })

  return updated.toJSON()
}

export async function pauseQuiz(
  userId: string,
  quizId: string,
  { reason }: PauseQuizInput
) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  if (quiz.pauseReason) {
    return quiz.toJSON()
  }

  const updated = await Quiz.update(quizId, {
    pauseReason: reason,
    pausedAt: new Date(),
    pauseCount: (quiz.pauseCount ?? 0) + 1,
  })

  return updated.toJSON()
}

export async function resumeQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  if (!quiz.pauseReason) {
    throw new AppError('Quiz is not paused', 400)
  }

  const updated = await Quiz.update(quizId, {
    pauseReason: null,
    pausedAt: null,
  })

  return updated.toJSON()
}

export async function finishQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  const { correctCount, incorrectCount, score } = calculateScore(quiz)

  const updated = await Quiz.update(quizId, {
    status: 'completed',
    endTime: new Date(),
    correctCount,
    incorrectCount,
    score,
    pauseReason: null,
    pausedAt: null,
  })

  // Trigger AI analysis asynchronously (don't wait for it)
  try {
    const { analyzeQuiz } = await import('../quiz-analysis/quiz-analysis.service')
    analyzeQuiz(userId, quizId).catch((err) => {
      console.error('Failed to analyze quiz:', err)
      // Don't throw - analysis is optional enhancement
    })
  } catch (err) {
    console.error('Failed to load analysis service:', err)
  }

  return updated.toJSON()
}

export async function expireQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  const { correctCount, incorrectCount, score } = calculateScore(quiz)

  const updated = await Quiz.update(quizId, {
    status: 'expired',
    endTime: new Date(),
    correctCount,
    incorrectCount,
    score,
  })

  // Trigger AI analysis asynchronously (don't wait for it)
  try {
    const { analyzeQuiz } = await import('../quiz-analysis/quiz-analysis.service')
    analyzeQuiz(userId, quizId).catch((err) => {
      console.error('Failed to analyze quiz:', err)
      // Don't throw - analysis is optional enhancement
    })
  } catch (err) {
    console.error('Failed to load analysis service:', err)
  }

  return updated.toJSON()
}

export async function getQuizById(userId: string, quizId: string) {
  try {
    const quiz = await Quiz.findById(quizId)
    
    if (!quiz) {
      throw new AppError('Quiz not found', 404)
    }
    
    // Verify ownership
    if (quiz.userId !== userId) {
      throw new AppError('You are not allowed to access this quiz', 403)
    }
    
    return quiz.toJSON()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error('Error in getQuizById:', error)
    throw new AppError(`Failed to fetch quiz: ${error instanceof Error ? error.message : 'Unknown error'}`, 500)
  }
}

export async function listQuizzes(userId: string) {
  const quizzes = await Quiz.find({ userId })
  return quizzes.map((quiz) => quiz.toJSON())
}

export async function getQuizAssessment(userId: string, quizId: string): Promise<AssessmentResult> {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  if (!['completed', 'expired'].includes(quiz.status)) {
    throw new AppError('Assessment is only available for completed or expired quizzes', 400)
  }

  // If AI analysis exists, use it; otherwise use basic assessment
  if (quiz.analysis && quiz.analysis.analyzedAt) {
    const baseAssessment = buildAssessment(quiz)
    return {
      ...baseAssessment,
      performanceReview: quiz.analysis.performanceReview || baseAssessment.performanceReview,
      weakAreas: quiz.analysis.weakAreas || baseAssessment.weakAreas,
      suggestions: quiz.analysis.suggestions || baseAssessment.suggestions,
    }
  }

  return buildAssessment(quiz)
}

