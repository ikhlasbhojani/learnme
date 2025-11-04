import type { Request, Response, NextFunction } from 'express'
import {
  loginSchema,
  signupSchema,
  updateProfileSchema,
} from './auth.validation'
import {
  findUserById,
  loginUser,
  registerUser,
  updateUserProfile,
} from './auth.service'
import { AppError } from '../../utils/appError'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware'
import { appEnv } from '../../config/env'

function attachAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: appEnv.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export async function signupHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
  }

  const result = await registerUser(parsed.data)
  attachAuthCookie(res, result.token)

  res.status(201).json({
    message: 'Signup successful',
    data: result.user,
    token: result.token,
  })
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
  }

  const result = await loginUser(parsed.data)
  attachAuthCookie(res, result.token)

  res.status(200).json({
    message: 'Login successful',
    data: result.user,
    token: result.token,
  })
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: appEnv.isProduction,
  })
  res.status(200).json({
    message: 'Logged out successfully',
  })
}

export async function meHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const user = await findUserById(req.authUser.id)
  res.status(200).json({
    data: user,
  })
}

export async function updateProfileHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return next(new AppError('Authentication required', 401))
  }

  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400))
  }

  const updated = await updateUserProfile(req.authUser.id, parsed.data)
  res.status(200).json({
    message: 'Profile updated',
    data: updated,
  })
}

