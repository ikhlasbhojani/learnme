import Quiz, { type IQuizDocument } from '../quiz/quiz.model'
import { QuizAnalysisAgent } from './agents/quiz-analysis.agent'
import { AppError } from '../../utils/appError'

export interface QuizAnalysisResult {
  performanceReview: string
  weakAreas: string[]
  suggestions: string[]
  detailedAnalysis: string
  strengths: string[]
  improvementAreas: string[]
}

export async function analyzeQuiz(userId: string, quizId: string): Promise<QuizAnalysisResult> {
  const quiz = await Quiz.findById(quizId)
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

  if (!['completed', 'expired'].includes(quiz.status)) {
    throw new AppError('Quiz must be completed or expired before analysis', 400)
  }

  // Convert answers Map to object
  const answersMap = quiz.answers instanceof Map ? quiz.answers : new Map(Object.entries(quiz.answers || {}))
  const answers = Object.fromEntries(answersMap)

  // Initialize analysis agent
  const analysisAgent = new QuizAnalysisAgent()

  // Run analysis
  const result = await analysisAgent.run({
    input: {
      quiz,
      answers,
    },
    metadata: {
      userId,
      quizId: quiz._id.toString(),
    },
  })

  const analysis = result.output as QuizAnalysisResult

  // Save analysis to quiz
  quiz.analysis = {
    ...analysis,
    analyzedAt: new Date(),
  }
  await quiz.save()

  return analysis
}

