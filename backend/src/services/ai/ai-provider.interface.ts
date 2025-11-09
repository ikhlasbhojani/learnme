import { z } from 'zod'

export interface AIProvider {
  generateText(prompt: string): Promise<string>
  generateJSON(prompt: string): Promise<any>
  generateStructuredOutput<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>
}

export type AIProviderType = 'openai'

export interface AIModelConfig {
  provider: AIProviderType
  model: string
  apiKey: string
}

