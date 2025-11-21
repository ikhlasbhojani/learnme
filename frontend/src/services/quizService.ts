import { apiClient } from './apiClient'
import {
  AssessmentResult,
  QuizConfiguration,
  QuizInstance,
  Question,
} from '../types'

interface QuizResponse {
  id: string
  userId: string
  contentInputId: string | null
  name: string | null
  configuration: QuizConfiguration
  questions: Question[]
  answers: Record<string, string>
  startTime: string | null
  endTime: string | null
  status: QuizInstance['status']
  score: number | null
  correctCount: number | null
  incorrectCount: number | null
  pauseReason: QuizInstance['pauseReason']
  pausedAt: string | null
  pauseCount: number
  createdAt?: string
  updatedAt?: string
  analysis?: {
    performanceReview: string | null
    weakAreas: string[]
    suggestions: string[]
    strengths: string[]
    improvementAreas: string[]
    detailedAnalysis: string | null
    topicsToReview: string[]
    analyzedAt: string | null
  }
}

interface AssessmentResponse extends Omit<AssessmentResult, 'generatedAt'> {
  generatedAt: string
}

function mapQuiz(response: QuizResponse): QuizInstance {
  // Backend returns quiz with 'id' field (from toJSON transform)
  // apiClient automatically extracts 'data' field, so response is QuizResponse directly
  return {
    id: response.id,
    userId: response.userId,
    contentInputId: response.contentInputId,
    name: response.name ?? null,
    configuration: response.configuration,
    questions: Array.isArray(response.questions) ? response.questions : [],
    answers: response.answers ?? {},
    startTime: response.startTime ? new Date(response.startTime) : null,
    endTime: response.endTime ? new Date(response.endTime) : null,
    status: response.status,
    score: response.score,
    correctCount: response.correctCount,
    incorrectCount: response.incorrectCount,
    pauseReason: response.pauseReason ?? null,
    pausedAt: response.pausedAt ? new Date(response.pausedAt) : null,
    pauseCount: response.pauseCount ?? 0,
    createdAt: response.createdAt ? new Date(response.createdAt) : null,
    updatedAt: response.updatedAt ? new Date(response.updatedAt) : null,
    analysis: response.analysis ? {
      quizInstanceId: response.id,
      totalScore: response.score ?? 0,
      correctCount: response.correctCount ?? 0,
      incorrectCount: response.incorrectCount ?? 0,
      unansweredCount: (Array.isArray(response.questions) ? response.questions.length : 0) - (response.correctCount ?? 0) - (response.incorrectCount ?? 0),
      performanceReview: response.analysis.performanceReview,
      weakAreas: response.analysis.weakAreas,
      suggestions: response.analysis.suggestions,
      strengths: response.analysis.strengths,
      improvementAreas: response.analysis.improvementAreas,
      detailedAnalysis: response.analysis.detailedAnalysis,
      topicsToReview: response.analysis.topicsToReview,
      generatedAt: response.analysis.analyzedAt ? new Date(response.analysis.analyzedAt) : new Date(),
    } : undefined,
  }
}

function mapAssessment(response: AssessmentResponse): AssessmentResult {
  return {
    ...response,
    generatedAt: new Date(response.generatedAt),
  }
}

export const quizService = {
  /**
   * Fetch a quiz by ID
   */
  async fetchQuiz(quizId: string): Promise<QuizInstance> {
    try {
      const response = await apiClient.get<QuizResponse>(`/quizzes/${quizId}`)
      return mapQuiz(response)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch quiz'
      throw new Error(errorMessage)
    }
  },

  /**
   * List all quizzes for the current user
   */
  async listQuizzes(): Promise<QuizInstance[]> {
    try {
      const response = await apiClient.get<QuizResponse[]>('/quizzes')
      return (response || []).map(mapQuiz)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to list quizzes'
      throw new Error(errorMessage)
    }
  },

  /**
   * Start a quiz
   */
  async startQuiz(quizId: string): Promise<QuizInstance> {
    try {
      const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/start`)
      // Backend returns partial data, need to fetch full quiz
      const fullQuiz = await this.fetchQuiz(quizId)
      return fullQuiz
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start quiz'
      throw new Error(errorMessage)
    }
  },

  /**
   * Answer a question
   */
  async answerQuestion(quizId: string, questionId: string, answer: string): Promise<QuizInstance> {
    try {
      const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/answer`, {
        questionId,
        answer,
      })
      // Backend returns partial data, need to fetch full quiz
      const fullQuiz = await this.fetchQuiz(quizId)
      return fullQuiz
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save answer'
      throw new Error(errorMessage)
    }
  },

  /**
   * Finish a quiz
   */
  async finishQuiz(quizId: string): Promise<QuizInstance> {
    try {
      const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/finish`)
      // Backend returns full quiz data
      return mapQuiz(response)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to finish quiz'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get assessment results for a completed quiz
   */
  async getAssessment(quizId: string): Promise<AssessmentResult> {
    try {
      const response = await apiClient.get<AssessmentResponse>(`/quizzes/${quizId}/assessment`)
      return mapAssessment(response)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch assessment'
      throw new Error(errorMessage)
    }
  },

  /**
   * Delete a quiz
   */
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await apiClient.delete(`/quizzes/${quizId}`)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete quiz'
      throw new Error(errorMessage)
    }
  },
}

