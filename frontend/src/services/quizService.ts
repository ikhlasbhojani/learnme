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
}

interface AssessmentResponse extends Omit<AssessmentResult, 'generatedAt'> {
  generatedAt: string
}

function mapQuiz(response: QuizResponse): QuizInstance {
  return {
    id: response.id,
    userId: response.userId,
    contentInputId: response.contentInputId,
    name: response.name ?? null,
    configuration: response.configuration,
    questions: response.questions,
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
  }
}

function mapAssessment(response: AssessmentResponse): AssessmentResult {
  return {
    ...response,
    generatedAt: new Date(response.generatedAt),
  }
}

export async function createQuiz(
  configuration: QuizConfiguration,
  contentInputId: string | null
): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>('/quizzes', {
    configuration,
    contentInputId: contentInputId ?? undefined,
  })
  return mapQuiz(response)
}

export async function startQuiz(quizId: string): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/start`)
  return mapQuiz(response)
}

export async function answerQuestion(
  quizId: string,
  payload: { questionId: string; answer: string }
): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/answer`, payload)
  return mapQuiz(response)
}

export async function pauseQuiz(
  quizId: string,
  reason: QuizInstance['pauseReason'] = 'tab-change'
): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/pause`, {
    reason,
  })
  return mapQuiz(response)
}

export async function resumeQuiz(quizId: string): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/resume`)
  return mapQuiz(response)
}

export async function finishQuiz(quizId: string): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/finish`)
  return mapQuiz(response)
}

export async function expireQuiz(quizId: string): Promise<QuizInstance> {
  const response = await apiClient.post<QuizResponse>(`/quizzes/${quizId}/expire`)
  return mapQuiz(response)
}

export async function fetchQuiz(quizId: string): Promise<QuizInstance> {
  const response = await apiClient.get<QuizResponse>(`/quizzes/${quizId}`)
  return mapQuiz(response)
}

export async function fetchAssessment(quizId: string): Promise<AssessmentResult> {
  const response = await apiClient.get<AssessmentResponse>(`/quizzes/${quizId}/assessment`)
  return mapAssessment(response)
}

export async function fetchAllQuizzes(): Promise<QuizInstance[]> {
  const response = await apiClient.get<QuizResponse[]>(`/quizzes`)
  return response.map(mapQuiz)
}

export const quizService = {
  createQuiz,
  startQuiz,
  answerQuestion,
  pauseQuiz,
  resumeQuiz,
  finishQuiz,
  expireQuiz,
  fetchQuiz,
  fetchAssessment,
  fetchAllQuizzes,
}

