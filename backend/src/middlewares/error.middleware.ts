import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/appError'
import { appEnv } from '../config/env'

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route ${req.path} not found`, 404))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
    })
    return
  }

  const statusCode = 500
  const message = err instanceof Error ? err.message : 'Internal Server Error'

  // Always log errors in development, and include stack trace
  if (!appEnv.isProduction) {
    console.error('Error details:', {
      message,
      stack: err instanceof Error ? err.stack : undefined,
      error: err,
    })
  }

  res.status(statusCode).json({
    message: appEnv.isProduction ? 'Internal Server Error' : message,
  })
}

