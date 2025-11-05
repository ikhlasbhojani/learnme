import { apiClient } from './apiClient'
import { Question } from '../types'

export interface GenerateQuizFromUrlRequest {
  url: string
  difficulty: 'easy' | 'medium' | 'hard'
  numberOfQuestions: number
  timeDuration?: number
}

export interface GenerateQuizFromDocumentRequest {
  document: string
  difficulty: 'easy' | 'medium' | 'hard'
  numberOfQuestions: number
  timeDuration?: number
}

export interface GeneratedQuizResponse {
  quizId: string
  questions: Question[]
  metadata: {
    source: string
    difficulty: string
    requestedQuestions: number
    generatedQuestions: number
    extractedAt: string
    generatedAt: string
  }
}

export async function generateQuizFromUrl(
  request: GenerateQuizFromUrlRequest
): Promise<GeneratedQuizResponse> {
  // apiClient automatically extracts 'data' from backend response { message, data }
  const response = await apiClient.post<GeneratedQuizResponse>(
    '/quiz-generation/generate-from-url',
    request
  )
  return response
}

export async function generateQuizFromDocument(
  request: GenerateQuizFromDocumentRequest
): Promise<GeneratedQuizResponse> {
  // apiClient automatically extracts 'data' from backend response { message, data }
  const response = await apiClient.post<GeneratedQuizResponse>(
    '/quiz-generation/generate-from-document',
    request
  )
  return response
}

export const quizGenerationService = {
  generateQuizFromUrl,
  generateQuizFromDocument,
}

