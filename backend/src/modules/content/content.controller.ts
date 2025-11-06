import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware'
import { AppError } from '../../utils/appError'
import { extractTopicsFromDocumentation } from './content.service'
import ContentInput from './content.model'

export async function extractTopicsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      throw new AppError('Authentication required', 401)
    }

    const { url } = req.body

    if (!url || typeof url !== 'string') {
      throw new AppError('URL is required', 400)
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      throw new AppError('Invalid URL format', 400)
    }

    const result = await extractTopicsFromDocumentation(req.authUser.id, url)

    res.json({
      message: 'Topics extracted successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

// Stub handlers for existing routes (if needed)
export async function listContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      throw new AppError('Authentication required', 401)
    }
    const content = await ContentInput.find({ userId: req.authUser.id })
    res.json({ message: 'Content retrieved', data: content })
  } catch (error) {
    next(error)
  }
}

export async function createContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      throw new AppError('Authentication required', 401)
    }
    const { type, source, content } = req.body
    const contentInput = await ContentInput.create({
      userId: req.authUser.id,
      type,
      source,
      content,
    })
    res.status(201).json({ message: 'Content created', data: contentInput })
  } catch (error) {
    next(error)
  }
}

export async function getContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      throw new AppError('Authentication required', 401)
    }
    const { id } = req.params
    const content = await ContentInput.findOne({ id, userId: req.authUser.id })
    if (!content) {
      throw new AppError('Content not found', 404)
    }
    res.json({ message: 'Content retrieved', data: content })
  } catch (error) {
    next(error)
  }
}

export async function updateContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      throw new AppError('Authentication required', 401)
    }
    const { id } = req.params
    const { source, content } = req.body
    const updated = await ContentInput.update(id, req.authUser.id, { source, content })
    res.json({ message: 'Content updated', data: updated })
  } catch (error) {
    next(error)
  }
}

export async function deleteContentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.authUser) {
      throw new AppError('Authentication required', 401)
    }
    const { id } = req.params
    const deleted = await ContentInput.deleteOne(id, req.authUser.id)
    if (!deleted) {
      throw new AppError('Content not found', 404)
    }
    res.json({ message: 'Content deleted', data: { id } })
  } catch (error) {
    next(error)
  }
}
