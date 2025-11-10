import { apiClient } from './apiClient'
import { User } from '../types'

interface AuthPayload {
  email: string
  password: string
}

interface SignupPayload extends AuthPayload {
  themePreference?: User['themePreference']
}

interface UpdateProfilePayload {
  themePreference?: User['themePreference']
}

interface UserResponse {
  id: string
  email: string
  themePreference?: User['themePreference'] | null
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
}

function mapUser(response: UserResponse): User {
  const updatedAt = response.updatedAt ?? response.createdAt
  return {
    id: response.id,
    email: response.email,
    themePreference: response.themePreference ?? null,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(updatedAt),
    lastLoginAt: response.lastLoginAt ? new Date(response.lastLoginAt) : null,
  }
}

export async function signup(payload: SignupPayload): Promise<User> {
  // Node.js backend returns: { message: "...", data: { user: {...}, token: "..." } }
  // apiClient automatically extracts 'data' field, so response is { user, token }
  const response = await apiClient.post<{ user: UserResponse; token: string }>('/auth/signup', payload)
  // Store token in localStorage for Authorization header
  if (response?.token) {
    localStorage.setItem('auth_token', response.token)
  }
  return mapUser(response.user)
}

export async function login(payload: AuthPayload): Promise<User> {
  // Node.js backend returns: { message: "...", data: { user: {...}, token: "..." } }
  // apiClient automatically extracts 'data' field, so response is { user, token }
  const response = await apiClient.post<{ user: UserResponse; token: string }>('/auth/login', payload)
  // Store token in localStorage for Authorization header
  if (response?.token) {
    localStorage.setItem('auth_token', response.token)
  }
  return mapUser(response.user)
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
  // Clear token from localStorage
  localStorage.removeItem('auth_token')
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    // Node.js backend returns: { data: user.toJSON() }
    // apiClient automatically extracts 'data' field, so response is UserResponse directly
    const response = await apiClient.get<UserResponse>('/auth/me')
    return mapUser(response)
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      return null
    }
    throw error
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  // Node.js backend returns: { message: "...", data: user.toJSON() }
  // apiClient automatically extracts 'data' field, so response is UserResponse directly
  const response = await apiClient.patch<UserResponse>('/auth/me', payload)
  return mapUser(response)
}

export const authService = {
  signup,
  login,
  logout,
  fetchCurrentUser,
  updateProfile,
}

