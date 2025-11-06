import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import { getSetupStatus, updateAIConfig, getAIConfig } from './setup.service'
import { AVAILABLE_PROVIDERS } from '../../services/ai/ai-provider.factory'
import { AppError } from '../../utils/appError'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware'

const updateAIConfigSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'grok', 'claude', 'deepseek', 'mistral']),
  model: z.string().min(1, 'Model is required'),
  apiKey: z.string().min(1, 'API key is required'),
  // baseUrl is now auto-determined from provider, but kept for backward compatibility
  baseUrl: z.string().optional(),
})

export async function getSetupStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      return next(new AppError('User not authenticated', 401))
    }

    const status = await getSetupStatus(req.authUser.id)
    const config = await getAIConfig(req.authUser.id)
    
    // Don't send API key in response for security
    const safeConfig = config ? {
      provider: config.provider,
      model: config.model,
      // Don't include apiKey in response
    } : undefined
    
    res.json({
      message: 'Setup status retrieved',
      data: {
        ...status,
        config: safeConfig,
        availableProviders: AVAILABLE_PROVIDERS,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAIConfigHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      return next(new AppError('User not authenticated', 401))
    }

    const parsed = updateAIConfigSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
    }

    await updateAIConfig(req.authUser.id, {
      provider: parsed.data.provider,
      model: parsed.data.model,
      apiKey: parsed.data.apiKey,
      baseUrl: parsed.data.baseUrl,
    })

    res.json({
      message: 'AI configuration updated successfully',
      data: {
        hasApiKey: true,
        isConfigured: true,
        provider: parsed.data.provider,
        model: parsed.data.model,
      },
    })
  } catch (error) {
    next(error)
  }
}

