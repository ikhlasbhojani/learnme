import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, AuthResult } from '../types'
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '../utils/storage'
import { validateEmail, validatePassword } from '../utils/validation'
import { authService } from '../services/authService'

interface StoredUser {
  id: string
  email?: string
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  themePreference: User['themePreference']
  aiProvider?: User['aiProvider']
  aiApiKey?: string | null
  aiModel?: string | null
  aiBaseUrl?: string | null
  hasApiKey?: boolean
}

function serializeUser(user: User): StoredUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    themePreference: user.themePreference,
    aiProvider: user.aiProvider,
    aiApiKey: user.aiApiKey,
    aiModel: user.aiModel,
    aiBaseUrl: user.aiBaseUrl,
    hasApiKey: user.hasApiKey,
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
    aiProvider: stored.aiProvider ?? null,
    aiApiKey: stored.aiApiKey ?? null,
    aiModel: stored.aiModel ?? null,
    aiBaseUrl: stored.aiBaseUrl ?? null,
    hasApiKey: stored.hasApiKey ?? !!stored.aiApiKey,
  }
}

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  signup: (email: string, password: string) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Pick<User, 'themePreference' | 'aiProvider' | 'aiApiKey' | 'aiModel' | 'aiBaseUrl'>>) => Promise<User | null>
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
    // MIGRATION 1: Move data from old 'user' key to new 'learnme_user' key
    try {
      const oldData = localStorage.getItem('user')
      const newData = localStorage.getItem('learnme_user')
      if (oldData && !newData) {
        console.log('🔄 Migrating user data from old storage key')
        localStorage.setItem('learnme_user', oldData)
        localStorage.removeItem('user')
      }
    } catch (err) {
      console.error('Storage migration 1 failed:', err)
    }
    
    // MIGRATION 2: Fix double-prefix bug (learnme_learnme_user → learnme_user)
    try {
      const doublePrefix = localStorage.getItem('learnme_learnme_user')
      const correct = localStorage.getItem('learnme_user')
      if (doublePrefix && !correct) {
        console.log('🔄 Fixing double-prefix storage bug')
        localStorage.setItem('learnme_user', doublePrefix)
        localStorage.removeItem('learnme_learnme_user')
      }
    } catch (err) {
      console.error('Storage migration 2 failed:', err)
    }

    const loadUser = async () => {
      const stored = getStorageItem<StoredUser>(STORAGE_KEYS.USER)
      
      // If we have a user in storage, trust it immediately
      if (stored) {
        const deserializedUser = deserializeUser(stored)
        setUser(deserializedUser)
        setLoading(false)
        
        // Don't verify with backend immediately after login - give cookie time to settle
        // This prevents clearing user state if cookie isn't ready yet
        return
      }

      // No stored user - try to fetch from backend (for page refresh with cookie)
      try {
        const currentUser = await authService.fetchCurrentUser()
        if (currentUser) {
          // Check if this browser has been configured
          const browserConfigured = localStorage.getItem('learnme_ai_configured') === 'true'
          
          if (!browserConfigured) {
            // Clear API key from backend response - force browser configuration
            currentUser.aiApiKey = undefined
            currentUser.aiProvider = undefined
            currentUser.aiModel = undefined
            currentUser.aiBaseUrl = undefined
          }
          
          setStorageItem(STORAGE_KEYS.USER, serializeUser(currentUser))
          setUser(currentUser)
        }
      } catch (err) {
        // No stored user and fetch failed - user is not authenticated
        // Don't log 401 as error - it's expected when not logged in
        if ((err as { status?: number }).status !== 401) {
          console.error('Failed to load current user', err)
        }
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
    []
  )

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setError(null)
      setLoading(true)

      try {
        const loggedInUser = await authService.login({ email, password })
        
        // Set user state and storage
        setUser(loggedInUser)
        setStorageItem(STORAGE_KEYS.USER, serializeUser(loggedInUser))
        setLoading(false)

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
    []
  )

  const logout = useCallback(async () => {
    // Clear state first for immediate UI feedback
    setUser(null)
    removeStorageItem(STORAGE_KEYS.USER)
    
    try {
      await authService.logout()
    } catch (err) {
      console.error('Failed to logout on backend', err)
    }
    
    navigate('/login')
  }, [navigate])

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, 'themePreference' | 'aiProvider' | 'aiApiKey' | 'aiModel' | 'aiBaseUrl'>>) => {
      if (!user) {
        return null
      }

      try {
        // If updating AI config, mark browser as configured BEFORE the update
        if (updates.aiApiKey && updates.aiProvider) {
          localStorage.setItem('learnme_ai_configured', 'true')
          console.log('✅ Browser marked as configured (AI key being saved)')
        }
        
        const updated = await authService.updateProfile({
          themePreference: updates.themePreference,
          aiProvider: updates.aiProvider,
          aiApiKey: updates.aiApiKey,
          aiModel: updates.aiModel,
          aiBaseUrl: updates.aiBaseUrl,
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
