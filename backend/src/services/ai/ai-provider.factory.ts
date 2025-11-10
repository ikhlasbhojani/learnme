import { AIProvider, AIModelConfig } from './ai-provider.interface'
import { OpenAIProvider } from './providers/openai.provider'

export function createAIProvider(config: AIModelConfig): AIProvider {
  // All providers use OpenAI-compatible API via external client
  // Find the provider's baseUrl from AVAILABLE_PROVIDERS
  const provider = AVAILABLE_PROVIDERS.find(p => p.id === config.provider)
  const baseUrl = provider?.baseUrl || config.baseUrl
  
  return new OpenAIProvider(config.apiKey, config.model, baseUrl)
}

export const AVAILABLE_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    baseUrl: undefined, // Use OpenAI's default
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'grok',
    name: 'Grok (xAI)',
    models: [
      { id: 'grok-beta', name: 'Grok Beta' },
      { id: 'grok-2', name: 'Grok 2' },
    ],
    baseUrl: 'https://api.x.ai/v1',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
    baseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ],
    baseUrl: 'https://api.deepseek.com/v1',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'mistral-medium-latest', name: 'Mistral Medium' },
      { id: 'mistral-small-latest', name: 'Mistral Small' },
    ],
    baseUrl: 'https://api.mistral.ai/v1',
  },
]

