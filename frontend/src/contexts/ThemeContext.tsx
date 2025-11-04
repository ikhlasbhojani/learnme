import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getStorageItem, setStorageItem } from '../utils/storage'
import { useAuth } from '../hooks/useAuth'

export type ThemeName = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeName
  isDark: boolean
  setTheme: (theme: ThemeName) => Promise<void>
  toggleTheme: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, updateProfile } = useAuth()
  
  // Initialize theme from localStorage first (synchronous)
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const stored = getStorageItem<ThemeName>('theme')
      if (stored && (stored === 'light' || stored === 'dark')) {
        // Apply immediately
        document.documentElement.setAttribute('data-theme', stored)
        document.body.style.background = stored === 'dark' ? '#0a0a0a' : '#ffffff'
        document.body.style.color = stored === 'dark' ? '#ffffff' : '#000000'
        return stored
      }
    }
    return 'light'
  })

  // Apply theme to DOM whenever theme state changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      const isDark = theme === 'dark'
      document.body.style.background = isDark ? '#0a0a0a' : '#ffffff'
      document.body.style.color = isDark ? '#ffffff' : '#000000'
    }
  }, [theme])

  const setTheme = useCallback(async (newTheme: ThemeName) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      throw new Error('Invalid theme')
    }

    // Update state (this will trigger useEffect above to update DOM)
    setThemeState(newTheme)

    // Save to localStorage immediately
    setStorageItem('theme', newTheme)

    // Save to user profile asynchronously (don't block on this)
    if (updateProfile) {
      try {
        await updateProfile({ themePreference: newTheme })
      } catch (err) {
        console.error('Failed to update theme preference', err)
      }
    }
  }, [updateProfile])

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    await setTheme(newTheme)
  }, [theme, setTheme])

  // Sync with user preference when user data loads (only if localStorage doesn't have a value)
  useEffect(() => {
    if (user?.themePreference) {
      const stored = getStorageItem<ThemeName>('theme')
      // Only sync if localStorage is empty or doesn't match user preference
      // This ensures user preference takes precedence on first load
      if (!stored && user.themePreference !== theme) {
        setThemeState(user.themePreference)
        setStorageItem('theme', user.themePreference)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.themePreference]) // Only run when user data loads

  const value: ThemeContextType = {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

