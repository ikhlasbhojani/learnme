import { useState, useEffect, useCallback } from 'react'

export interface UseTabVisibilityReturn {
  isVisible: boolean
  visibilityState: 'visible' | 'hidden' | 'prerender'
  isSupported: boolean
  onVisibilityChange: (callback: (isVisible: boolean) => void) => () => void
}

export function useTabVisibility(): UseTabVisibilityReturn {
  // Check if Page Visibility API is supported
  const isSupported = typeof document !== 'undefined' && 'visibilityState' in document

  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true
    if (!isSupported) return true // Default to visible if not supported
    return document.visibilityState === 'visible'
  })

  const [visibilityState, setVisibilityState] = useState<
    'visible' | 'hidden' | 'prerender'
  >(() => {
    if (typeof document === 'undefined') return 'visible'
    if (!isSupported) return 'visible' // Default to visible if not supported
    return document.visibilityState as 'visible' | 'hidden' | 'prerender'
  })

  useEffect(() => {
    if (typeof document === 'undefined' || !isSupported) return

    const handleVisibilityChange = () => {
      const state = document.visibilityState as 'visible' | 'hidden' | 'prerender'
      setVisibilityState(state)
      setIsVisible(state === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSupported])

  const onVisibilityChange = useCallback(
    (callback: (isVisible: boolean) => void) => {
      if (typeof document === 'undefined' || !isSupported) {
        // Return a no-op unsubscribe function if API not supported
        return () => {}
      }

      const handleChange = () => {
        callback(document.visibilityState === 'visible')
      }

      document.addEventListener('visibilitychange', handleChange)
      return () => {
        document.removeEventListener('visibilitychange', handleChange)
      }
    },
    [isSupported]
  )

  return {
    isVisible,
    visibilityState,
    isSupported,
    onVisibilityChange,
  }
}
