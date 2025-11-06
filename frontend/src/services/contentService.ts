import { apiClient } from './apiClient'

export interface DocumentationTopic {
  id: string
  title: string
  url: string
  description?: string
  section?: string
}

export interface ExtractTopicsResult {
  topics: DocumentationTopic[]
  mainUrl: string
  totalPages: number
}

export async function extractTopicsFromUrl(url: string): Promise<ExtractTopicsResult> {
  const response = await apiClient.post<ExtractTopicsResult>('/content/extract-topics', { url })
  return response
}

export const contentService = {
  extractTopicsFromUrl,
}

