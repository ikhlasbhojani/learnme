export interface AIProvider {
  generateText(prompt: string): Promise<string>
  generateJSON(prompt: string): Promise<any>
}

export type AIProviderType = 'openai' | 'gemini' | 'grok' | 'claude' | 'deepseek' | 'mistral'

export interface AIModelConfig {
  provider: AIProviderType
  model: string
  apiKey: string
  baseUrl?: string // For custom providers
}

