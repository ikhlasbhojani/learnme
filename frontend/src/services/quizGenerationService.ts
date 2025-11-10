import { apiClient } from './apiClient'
import { QuizConfiguration } from '../types'

interface GenerateQuizFromUrlRequest {
  url?: string
  selectedTopics?: Array<{ id: string; title: string; url: string }>
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  numberOfQuestions: number
  timeDuration: number
}

interface GenerateQuizFromDocumentRequest {
  document: string
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  numberOfQuestions: number
  timeDuration: number
}

interface GenerateQuizResponse {
  quizId: string
  message?: string
}

export const quizGenerationService = {
  /**
   * Generate quiz from URL (with optional topic selection)
   */
  async generateQuizFromUrl(request: GenerateQuizFromUrlRequest): Promise<GenerateQuizResponse> {
    try {
      const response = await apiClient.post<{ quizId: string; questions?: any[]; metadata?: any }>('/quiz-generation/generate-from-url', {
        url: request.url,
        selectedTopics: request.selectedTopics,
        difficulty: request.difficulty,
        numberOfQuestions: request.numberOfQuestions,
        timeDuration: request.timeDuration,
      })

      // Backend returns: { data: { quizId: string, questions: [], metadata: {} } }
      // apiClient automatically extracts 'data' field, so response is { quizId, questions, metadata }
      if (!response.quizId) {
        console.error('Quiz generation response:', response)
        throw new Error('Quiz ID missing in response')
      }

      return {
        quizId: response.quizId,
        message: 'Quiz generated successfully',
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate quiz'
      throw new Error(errorMessage)
    }
  },

  /**
   * Generate quiz from document text
   */
  async generateQuizFromDocument(request: GenerateQuizFromDocumentRequest): Promise<GenerateQuizResponse> {
    try {
      const response = await apiClient.post<{ quizId: string; questions?: any[]; metadata?: any }>('/quiz-generation/generate-from-document', {
        document: request.document,
        difficulty: request.difficulty,
        numberOfQuestions: request.numberOfQuestions,
        timeDuration: request.timeDuration,
      })

      // Backend returns: { data: { quizId: string, questions: [], metadata: {} } }
      // apiClient automatically extracts 'data' field, so response is { quizId, questions, metadata }
      if (!response.quizId) {
        console.error('Quiz generation response:', response)
        throw new Error('Quiz ID missing in response')
      }

      return {
        quizId: response.quizId,
        message: 'Quiz generated successfully',
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate quiz'
      throw new Error(errorMessage)
    }
  },
}

