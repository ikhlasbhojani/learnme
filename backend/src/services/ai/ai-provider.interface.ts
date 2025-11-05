export interface AIProvider {
  generateText(prompt: string): Promise<string>
  generateJSON(prompt: string): Promise<any>
}

export type AIProviderType = 'openai' | 'custom'

export interface AIModelConfig {
  provider: AIProviderType
  model: string
  apiKey: string
  baseUrl?: string // For custom providers
}

