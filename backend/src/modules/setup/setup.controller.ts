import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getSetupStatus, updateAIConfig, getAIConfig } from './setup.service'
import { AVAILABLE_PROVIDERS, EXTERNAL_PROVIDERS } from '../../services/ai/ai-provider.factory'
import { AppError } from '../../utils/appError'

const updateAIConfigSchema = z.object({
  provider: z.enum(['openai', 'custom']),
  model: z.string().min(1, 'Model is required'),
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().optional(),
})

export async function getSetupStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const status = getSetupStatus()
    const config = getAIConfig()
    res.json({
      message: 'Setup status retrieved',
      data: {
        ...status,
        config,
        availableProviders: AVAILABLE_PROVIDERS,
        externalProviders: EXTERNAL_PROVIDERS,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAIConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = updateAIConfigSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
    }

    updateAIConfig({
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

