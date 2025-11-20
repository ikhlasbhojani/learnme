// localStorage/sessionStorage utility functions

const STORAGE_PREFIX = 'learnme_'

/**
 * Get item from localStorage
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!item) return null
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error)
    return null
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error)
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error)
  }
}

/**
 * Clear all learnme-related items from localStorage
 */
export function clearAllStorage(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing localStorage', error)
  }
}

/**
 * Get item from sessionStorage
 */
export function getSessionItem<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!item) return null
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading from sessionStorage: ${key}`, error)
    return null
  }
}

/**
 * Set item in sessionStorage
 */
export function setSessionItem<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to sessionStorage: ${key}`, error)
  }
}

/**
 * Remove item from sessionStorage
 */
export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    console.error(`Error removing from sessionStorage: ${key}`, error)
  }
}

// Storage keys (without prefix - setStorageItem/getStorageItem adds it automatically)
export const STORAGE_KEYS = {
  USER: 'user',  // Will become 'learnme_user' after prefix is added
  QUIZ: (quizId: string) => `quiz_${quizId}`,
  SESSION: 'session',
  DISPLAY_NAME: 'display_name',
} as const
