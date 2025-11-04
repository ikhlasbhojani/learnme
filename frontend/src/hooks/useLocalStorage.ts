import { useState, useEffect } from 'react'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage'

/**
 * Hook for managing localStorage state
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getStorageItem<T>(key)
      return item ?? initialValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return initialValue
    }
  })

  // Update localStorage when state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      setStorageItem(key, valueToStore)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  return [storedValue, setValue] as const
}
