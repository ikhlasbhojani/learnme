import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { appEnv } from '../config/env'
import { AppError } from '../utils/appError'
import User, { type IUserDocument } from '../modules/auth/auth.model'

interface JwtPayload {
  userId: string
}

export interface AuthenticatedRequest extends Request {
  authUser?: IUserDocument
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req)

    if (!token) {
      return next(new AppError('Authentication required', 401))
    }

    const decoded = jwt.verify(token, appEnv.jwtSecret) as JwtPayload

    const user = await User.findById(decoded.userId)
    if (!user) {
      return next(new AppError('User not found', 401))
    }

    req.authUser = user
    return next()
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401))
  }
}

function extractToken(req: Request): string | undefined {
  if (req.cookies?.token) {
    return req.cookies.token as string
  }

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return undefined
}

