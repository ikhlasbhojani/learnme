import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware'
import {
  createContentSchema,
  updateContentSchema,
} from './content.validation'
import {
  createContentInput,
  deleteContentInput,
  getContentInputById,
  listContentInputs,
  updateContentInput,
} from './content.service'
import { AppError } from '../../utils/appError'

export async function createContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const parsed = createContentSchema.safeParse(req.body)
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
  }

  const content = await createContentInput(req.authUser.id, parsed.data)
  res.status(201).json({
    message: 'Content input created',
    data: content,
  })
}

export async function listContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const items = await listContentInputs(req.authUser.id)
  res.status(200).json({ data: items })
}

export async function getContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const { id } = req.params
  const item = await getContentInputById(req.authUser.id, id)
  res.status(200).json({ data: item })
}

export async function updateContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const parsed = updateContentSchema.safeParse(req.body)
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
  }

  const { id } = req.params
  const item = await updateContentInput(req.authUser.id, id, parsed.data)
  res.status(200).json({
    message: 'Content input updated',
    data: item,
  })
}

export async function deleteContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const { id } = req.params
  await deleteContentInput(req.authUser.id, id)
  res.status(204).send()
}

