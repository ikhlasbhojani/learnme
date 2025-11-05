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
  if (quiz.userId !== userId) {
    throw new AppError('You are not allowed to access this quiz', 403)
  }

  if (!['completed', 'expired'].includes(quiz.status)) {
    throw new AppError('Quiz must be completed or expired before analysis', 400)
  }

  // Answers are already an object in SQLite
  const answers = quiz.answers || {}

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
      quizId: quiz.id,
    },
  })

  const analysis = result.output as QuizAnalysisResult

  // Save analysis to quiz
  await Quiz.update(quizId, {
    analysis: {
      ...analysis,
      analyzedAt: new Date(),
    },
  })

  return analysis
}

