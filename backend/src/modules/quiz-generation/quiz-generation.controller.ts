import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware'
import { AppError } from '../../utils/appError'
import {
  generateQuizFromContentSchema,
  generateQuizFromUrlSchema,
} from './quiz-generation.validation'
import {
  generateQuizFromDocument,
  generateQuizFromUrl,
} from './quiz-generation.service'

function ensureAuth(req: AuthenticatedRequest) {
  if (!req.authUser) {
    throw new AppError('Authentication required', 401)
  }
}

export async function generateQuizFromUrlHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const parsed = generateQuizFromUrlSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400)
    }

    const result = await generateQuizFromUrl(req.authUser!.id, parsed.data)
    res.status(201).json({
      message: 'Quiz generated successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function generateQuizFromDocumentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const parsed = generateQuizFromContentSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400)
    }

    const result = await generateQuizFromDocument(req.authUser!.id, parsed.data)
    res.status(201).json({
      message: 'Quiz generated successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

