import { Types, isValidObjectId } from 'mongoose'
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

  const quizUserId = typeof quiz.user === 'object' && quiz.user !== null 
    ? quiz.user.toString() 
    : String(quiz.user)
  
  if (quizUserId !== userId) {
    throw new AppError('You are not allowed to access this quiz', 403)
  }

  return quiz
}

function ensureAnswersMap(quiz: IQuizDocument): Map<string, string> {
  if (!(quiz.answers instanceof Map)) {
    quiz.answers = new Map(Object.entries(quiz.answers)) as unknown as Map<string, string>
  }

  return quiz.answers as Map<string, string>
}

function calculateScore(quiz: IQuizDocument) {
  const answers = ensureAnswersMap(quiz)
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  quiz.questions.forEach((question) => {
    const answer = answers.get(question.id)
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
  const answers = ensureAnswersMap(quiz)

  quiz.questions.forEach((question) => {
    const diff = question.difficulty
    if (!difficultyStats[diff]) {
      difficultyStats[diff] = { correct: 0, total: 0 }
    }
    difficultyStats[diff].total += 1
    if (answers.get(question.id) === question.correctAnswer) {
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

export async function createQuiz(
  userId: string,
  input: CreateQuizInput
): Promise<ReturnType<IQuizDocument['toJSON']>> {
  const questions = pickQuestions(input.configuration.difficulty, input.configuration.numberOfQuestions)

  const quiz = await Quiz.create({
    user: new Types.ObjectId(userId),
    contentInput: input.contentInputId ? new Types.ObjectId(input.contentInputId) : null,
    configuration: input.configuration,
    questions,
    answers: new Map(),
    status: 'pending',
  })

  return quiz.toJSON()
}

export async function startQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['pending'])

  quiz.status = 'in-progress'
  quiz.startTime = new Date()
  quiz.pauseReason = null
  quiz.pausedAt = null

  await quiz.save()
  return quiz.toJSON()
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

  const answers = ensureAnswersMap(quiz)
  answers.set(input.questionId, input.answer)
  quiz.markModified('answers')
  await quiz.save()

  return quiz.toJSON()
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

  quiz.pauseReason = reason
  quiz.pausedAt = new Date()
  quiz.pauseCount = (quiz.pauseCount ?? 0) + 1
  await quiz.save()

  return quiz.toJSON()
}

export async function resumeQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  if (!quiz.pauseReason) {
    throw new AppError('Quiz is not paused', 400)
  }

  quiz.pauseReason = null
  quiz.pausedAt = null
  await quiz.save()

  return quiz.toJSON()
}

export async function finishQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  const { correctCount, incorrectCount, score } = calculateScore(quiz)

  quiz.status = 'completed'
  quiz.endTime = new Date()
  quiz.correctCount = correctCount
  quiz.incorrectCount = incorrectCount
  quiz.score = score
  quiz.pauseReason = null
  quiz.pausedAt = null

  await quiz.save()
  return quiz.toJSON()
}

export async function expireQuiz(userId: string, quizId: string) {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  ensureStatus(quiz, ['in-progress'])

  const { correctCount, incorrectCount, score } = calculateScore(quiz)

  quiz.status = 'expired'
  quiz.endTime = new Date()
  quiz.correctCount = correctCount
  quiz.incorrectCount = incorrectCount
  quiz.score = score

  await quiz.save()
  return quiz.toJSON()
}

export async function getQuizById(userId: string, quizId: string) {
  try {
    // Try to find quiz - handle both ObjectId and UUID formats
    let quiz = null
    
    // First, try as ObjectId (MongoDB default)
    if (isValidObjectId(quizId)) {
      quiz = await Quiz.findById(quizId)
    }
    
    // If not found and it's a UUID format, return 404
    if (!quiz) {
      // UUID format check (8-4-4-4-12 pattern)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidPattern.test(quizId)) {
        // This is a UUID that was generated client-side but never saved
        // Return 404 since it doesn't exist in database
        throw new AppError('Quiz not found', 404)
      }
      
      // Try one more time as string query (in case schema was changed)
      quiz = await Quiz.findOne({ _id: quizId } as any)
    }
    
    if (!quiz) {
      throw new AppError('Quiz not found', 404)
    }
    
    // Verify ownership
    const quizUserId = typeof quiz.user === 'object' && quiz.user !== null 
      ? quiz.user.toString() 
      : String(quiz.user)
    
    if (quizUserId !== userId) {
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
  const quizzes = await Quiz.find({ user: userId }).sort({ createdAt: -1 })
  return quizzes.map((quiz) => quiz.toJSON())
}

export async function getQuizAssessment(userId: string, quizId: string): Promise<AssessmentResult> {
  const quiz = ensureQuizOwnership(await Quiz.findById(quizId), userId)
  if (!['completed', 'expired'].includes(quiz.status)) {
    throw new AppError('Assessment is only available for completed or expired quizzes', 400)
  }

  return buildAssessment(quiz)
}

