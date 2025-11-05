import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User, { type IUserDocument } from './auth.model'
import {
  type LoginInput,
  type SignupInput,
  type UpdateProfileInput,
} from './auth.validation'
import { AppError } from '../../utils/appError'
import { appEnv } from '../../config/env'

const TOKEN_EXPIRATION = '7d'

export interface AuthResponse {
  user: ReturnType<IUserDocument['toJSON']>
  token: string
}

export async function registerUser(input: SignupInput): Promise<AuthResponse> {
  const existing = await User.findOne({ email: input.email.toLowerCase() })
  if (existing) {
    throw new AppError('Email already registered', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    themePreference: input.themePreference ?? null,
  })

  const token = generateAuthToken(user.id)

  return {
    user: user.toJSON(),
    token,
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email.toLowerCase() })
  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) {
    throw new AppError('Invalid credentials', 401)
  }

  const updatedUser = await User.update(user.id, { lastLoginAt: new Date() })
  const token = generateAuthToken(updatedUser.id)

  return {
    user: updatedUser.toJSON(),
    token,
  }
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<ReturnType<IUserDocument['toJSON']>> {
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const updatedUser = await User.update(userId, {
    themePreference: updates.themePreference,
  })

  return updatedUser.toJSON()
}

export async function findUserById(
  userId: string
): Promise<ReturnType<IUserDocument['toJSON']>> {
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  return user.toJSON()
}

export function generateAuthToken(userId: string): string {
  return jwt.sign({ userId }, appEnv.jwtSecret, { expiresIn: TOKEN_EXPIRATION })
}

