import { AIModelConfig } from '../../services/ai/ai-provider.interface'
import { AVAILABLE_PROVIDERS } from '../../services/ai/ai-provider.factory'
import User from '../auth/auth.model'

export interface SetupStatus {
  hasApiKey: boolean
  isConfigured: boolean
  provider?: string
  model?: string
}

export async function getSetupStatus(userId: string): Promise<SetupStatus> {
  const user = await User.findById(userId)
  if (!user) {
    return {
      hasApiKey: false,
      isConfigured: false,
    }
  }

  const hasApiKey = !!(user.aiApiKey && user.aiApiKey.trim().length > 0)
  return {
    hasApiKey,
    isConfigured: hasApiKey && !!(user.aiProvider && user.aiModel),
    provider: user.aiProvider || undefined,
    model: user.aiModel || undefined,
  }
}

export async function getAIConfig(userId: string): Promise<AIModelConfig | null> {
  const user = await User.findById(userId)
  if (!user || !user.aiApiKey) {
    return null
  }

  const provider = (user.aiProvider || 'openai') as any
  const model = user.aiModel || (provider === 'openai' ? 'gpt-4o-mini' : '')
  const apiKey = user.aiApiKey
  
  // Get baseUrl from provider definition
  const providerDef = AVAILABLE_PROVIDERS.find(p => p.id === provider)
  const baseUrl = providerDef?.baseUrl || undefined

  return {
    provider,
    model,
    apiKey,
    baseUrl,
  }
}

export async function updateAIConfig(
  userId: string,
  config: {
    provider: string
    model: string
    apiKey: string
    baseUrl?: string
  }
): Promise<void> {
  // Get baseUrl from provider definition if not provided
  const providerDef = AVAILABLE_PROVIDERS.find(p => p.id === config.provider)
  const baseUrl = config.baseUrl || providerDef?.baseUrl

  // Update user record in database
  await User.update(userId, {
    aiProvider: config.provider,
    aiModel: config.model,
    aiApiKey: config.apiKey,
  })
}


