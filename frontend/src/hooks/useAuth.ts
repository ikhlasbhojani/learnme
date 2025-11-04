import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, AuthResult } from '../types'
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '../utils/storage'
import { validateEmail, validatePassword } from '../utils/validation'
import { authService } from '../services/authService'

interface StoredUser {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  themePreference: User['themePreference']
}

function serializeUser(user: User): StoredUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    themePreference: user.themePreference,
  }
}

function deserializeUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
    lastLoginAt: stored.lastLoginAt ? new Date(stored.lastLoginAt) : null,
    themePreference: stored.themePreference,
  }
}

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  signup: (email: string, password: string) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Pick<User, 'themePreference'>>) => Promise<User | null>
  refreshUser: () => Promise<User | null>
  loading: boolean
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStorageItem<StoredUser>(STORAGE_KEYS.USER)
    return stored ? deserializeUser(stored) : null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Load user from backend on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.fetchCurrentUser()
        if (currentUser) {
          setStorageItem(STORAGE_KEYS.USER, serializeUser(currentUser))
        } else {
          removeStorageItem(STORAGE_KEYS.USER)
        }
        setUser(currentUser)
      } catch (err) {
        console.error('Failed to load current user', err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await authService.fetchCurrentUser()
      if (currentUser) {
        setStorageItem(STORAGE_KEYS.USER, serializeUser(currentUser))
      } else {
        removeStorageItem(STORAGE_KEYS.USER)
      }
      setUser(currentUser)
      return currentUser
    } catch (err) {
      console.error('Failed to refresh user', err)
      setUser(null)
      removeStorageItem(STORAGE_KEYS.USER)
      return null
    }
  }, [])

  const signup = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setError(null)
      setLoading(true)

      try {
        // Validate email
        if (!validateEmail(email)) {
          setLoading(false)
          return {
            success: false,
            error: 'Invalid email format',
          }
        }

        // Validate password
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.valid) {
          setLoading(false)
          return {
            success: false,
            error: passwordValidation.errors.join(', '),
          }
        }

        const newUser = await authService.signup({ email, password })
        setUser(newUser)
        setStorageItem(STORAGE_KEYS.USER, serializeUser(newUser))
        setLoading(false)

        // Navigate to home
        navigate('/home')

        return {
          success: true,
          user: newUser,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Signup failed'
        setError(errorMessage)
        setLoading(false)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [navigate]
  )

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setError(null)
      setLoading(true)

      try {
        const loggedInUser = await authService.login({ email, password })
        setUser(loggedInUser)
        setStorageItem(STORAGE_KEYS.USER, serializeUser(loggedInUser))
        setLoading(false)

        // Navigate to home
        navigate('/home')

        return {
          success: true,
          user: loggedInUser,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed'
        setError(errorMessage)
        setLoading(false)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [navigate]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error('Failed to logout', err)
    } finally {
      setUser(null)
      removeStorageItem(STORAGE_KEYS.USER)
      navigate('/login')
    }
  }, [navigate])

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, 'themePreference'>>) => {
      if (!user) {
        return null
      }

      try {
        const updated = await authService.updateProfile({
          themePreference: updates.themePreference,
        })
        setUser(updated)
        setStorageItem(STORAGE_KEYS.USER, serializeUser(updated))
        return updated
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
        setError(errorMessage)
        return null
      }
    },
    [user]
  )

  return {
    user,
    isAuthenticated: Boolean(user),
    signup,
    login,
    logout,
    updateProfile,
    refreshUser,
    loading,
    error,
  }
}
