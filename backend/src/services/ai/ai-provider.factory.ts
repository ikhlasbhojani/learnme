import { AIProvider, AIModelConfig } from './ai-provider.interface'
import { OpenAIProvider } from './providers/openai.provider'

export function createAIProvider(config: AIModelConfig): AIProvider {
  // All providers use OpenAI-compatible API
  // If baseUrl is provided, it's a custom/external provider
  // Otherwise, it's OpenAI's official API
  return new OpenAIProvider(config.apiKey, config.model, config.baseUrl)
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
    id: 'custom',
    name: 'Custom / External LLM',
    models: [
      { id: 'custom', name: 'Enter model name' },
    ],
    baseUrl: 'custom', // Requires user input
  },
]

// Common external LLM providers that are OpenAI-compatible
// These providers expose OpenAI-compatible APIs and can be used with the OpenAI SDK
export const EXTERNAL_PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma-7b-it', name: 'Gemma 7B' },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: [
      { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B' },
      { id: 'meta-llama/Llama-3-8b-chat-hf', name: 'Llama 3 8B' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    models: [
      { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large Online' },
      { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small Online' },
    ],
  },
]

